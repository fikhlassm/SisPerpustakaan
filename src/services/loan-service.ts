import { db } from "@/lib/db"
import { nextId, LAMA_PINJAM_HARI, MAKS_BUKU_PINJAM, TARIF_DENDA_PERHARI } from "@/lib/api"
import type { Denda, Prisma } from "@prisma/client"

// =====================================================
// LoanService — business logic untuk peminjaman & pengembalian
//
// Ref: DFD 5.0 (Peminjaman), DFD 6.0 (Pengembalian)
//
// Memisahkan aturan bisnis dari HTTP layer sehingga:
//  - Route handlers hanya mengurus parse request + return response
//  - Service dapat diuji tanpa HTTP context
//  - Migrasi database (SQLite → PostgreSQL) hanya menyentuh layer ini
// =====================================================

// ----- Error types untuk service layer -----

export class LoanError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message)
    this.name = "LoanError"
  }
}

// ----- Return types -----

export type CreateLoanResult = Prisma.PeminjamanGetPayload<{
  include: {
    detail: {
      include: { buku: { select: { idBuku: true; judulBuku: true; pengarang: true } } }
    }
  }
}>

export type ProcessReturnResult = {
  message: string
  detail: Prisma.DetailPeminjamanGetPayload<Record<string, never>>
  denda: Denda | null
}

// =====================================================
// LoanService.create — buat peminjaman baru
//
// Validasi bisnis:
//  1. Anggota harus berstatus "Aktif"
//  2. Maks MAKS_BUKU_PINJAM buku per peminjaman
//  3. Tidak boleh punya peminjaman aktif lain
//  4. Semua buku harus ada dan stok > 0
// =====================================================
export async function createLoan(
  idAnggota: string,
  idBukuList: string[],
): Promise<CreateLoanResult> {
  // Validasi 1: anggota aktif
  const anggota = await db.anggota.findUnique({ where: { idAnggota } })
  if (!anggota) throw new LoanError("Anggota tidak ditemukan", 404)
  if (anggota.statusAnggota !== "Aktif") {
    throw new LoanError("Akun Anda belum diverifikasi admin. Tidak bisa meminjam buku.", 403)
  }

  // Validasi 2: jumlah buku
  if (idBukuList.length > MAKS_BUKU_PINJAM) {
    throw new LoanError(`Maksimal ${MAKS_BUKU_PINJAM} buku per peminjaman`, 422)
  }

  // Validasi 3: tidak ada peminjaman aktif
  const aktif = await db.peminjaman.findFirst({
    where: { idAnggota, statusPinjam: "Dipinjam" },
  })
  if (aktif) {
    throw new LoanError(
      "Anda masih memiliki peminjaman aktif. Selesaikan/kembalikan dahulu sebelum meminjam lagi.",
      409,
    )
  }

  // Validasi 4: semua buku ada & stok tersedia
  const bukuList = await db.buku.findMany({ where: { idBuku: { in: idBukuList } } })
  if (bukuList.length !== idBukuList.length) {
    throw new LoanError("Salah satu buku tidak ditemukan", 404)
  }
  for (const b of bukuList) {
    if (b.stok <= 0) throw new LoanError(`Stok buku "${b.judulBuku}" habis`, 409)
  }

  // Generate ID
  const idPeminjaman = await nextId("peminjaman", "PMJ")
  const today = new Date()
  const jatuhTempo = new Date(today)
  jatuhTempo.setDate(jatuhTempo.getDate() + LAMA_PINJAM_HARI)

  // Transaction: buat peminjaman, detail, kurangi stok
  return db.$transaction(async (tx) => {
    let detailCounter = await tx.detailPeminjaman.count()
    const detailData: { idDetail: string; idBuku: string; statusKembali: string }[] = []

    for (const b of bukuList) {
      detailCounter++
      const idDetail = `DTL${String(detailCounter).padStart(4, "0")}`
      detailData.push({ idDetail, idBuku: b.idBuku, statusKembali: "Belum" })
      await tx.buku.update({
        where: { idBuku: b.idBuku },
        data: { stok: { decrement: 1 } },
      })
    }

    return tx.peminjaman.create({
      data: {
        idPeminjaman,
        idAnggota,
        tanggalPinjam: today,
        tanggalJatuhTempo: jatuhTempo,
        statusPinjam: "Dipinjam",
        detail: { create: detailData },
      },
      include: {
        detail: {
          include: {
            buku: { select: { idBuku: true, judulBuku: true, pengarang: true } },
          },
        },
      },
    })
  })
}

// =====================================================
// LoanService.processReturn — proses pengembalian satu buku
//
// Logika:
//  1. Validasi detail ada dan belum dikembalikan
//  2. Hitung hari telat
//  3. Transaction: update detail, tambah stok, buat denda (jika telat),
//     tandai peminjaman "Selesai" jika semua detail sudah kembali
// =====================================================
export async function processReturn(idDetail: string): Promise<ProcessReturnResult> {
  const detail = await db.detailPeminjaman.findUnique({
    where: { idDetail },
    include: { peminjaman: true, buku: true, denda: true },
  })
  if (!detail) throw new LoanError("Detail peminjaman tidak ditemukan", 404)
  if (detail.statusKembali === "Sudah") {
    throw new LoanError("Buku ini sudah dikembalikan", 409)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const jatuhTempo = new Date(detail.peminjaman.tanggalJatuhTempo)
  jatuhTempo.setHours(0, 0, 0, 0)

  const hariTelat = Math.max(
    0,
    Math.floor((today.getTime() - jatuhTempo.getTime()) / (1000 * 60 * 60 * 24)),
  )

  const result = await db.$transaction(async (tx) => {
    const updated = await tx.detailPeminjaman.update({
      where: { idDetail },
      data: { tanggalKembali: today, jumlahHariTelat: hariTelat, statusKembali: "Sudah" },
    })

    await tx.buku.update({
      where: { idBuku: detail.idBuku },
      data: { stok: { increment: 1 } },
    })

    let dendaRecord: Denda | null = null
    if (hariTelat > 0) {
      dendaRecord = await tx.denda.create({
        data: {
          idDetail,
          jumlahHariTelat: hariTelat,
          tarifPerhari: TARIF_DENDA_PERHARI,
          totalDenda: hariTelat * TARIF_DENDA_PERHARI,
          statusPembayaran: "Belum Bayar",
        },
      })
    }

    // Tandai peminjaman selesai jika semua buku sudah dikembalikan
    const sisaBelum = await tx.detailPeminjaman.count({
      where: { idPeminjaman: detail.idPeminjaman, statusKembali: "Belum" },
    })
    if (sisaBelum === 0) {
      await tx.peminjaman.update({
        where: { idPeminjaman: detail.idPeminjaman },
        data: { statusPinjam: "Selesai" },
      })
    }

    return { updated, dendaRecord }
  })

  return {
    message:
      hariTelat > 0
        ? `Buku dikembalikan telat ${hariTelat} hari. Denda dibuat.`
        : "Buku dikembalikan tepat waktu.",
    detail: result.updated,
    denda: result.dendaRecord,
  }
}
