import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { apiHandler, fail, ok, TARIF_DENDA_PERHARI } from "@/lib/api"

// POST /api/pengembalian — proses pengembalian buku (admin only)
// Body: { idDetail: string }  -> kembalikan 1 item detail peminjaman
// Ref: DFD 6.0, Use Case Proses Pengembalian Buku
//
// Logika:
//  - Tandai status_kembali = "Sudah", tanggal_kembali = hari ini
//  - Hitung jumlah_hari_telat = max(0, today - tanggal_jatuh_tempo) dalam hari
//  - Jika telat > 0: buat record denda (tarif_perhari = TARIF_DENDA_PERHARI)
//  - Tambah stok buku +1
//  - Jika semua detail sudah "Sudah", ubah status_pinjam = "Selesai"
export const POST = apiHandler(async (req) => {
  await requireAdmin()
  const body = await req.json()
  const { idDetail } = body
  if (!idDetail) return fail("idDetail wajib diisi", 422)

  const detail = await db.detailPeminjaman.findUnique({
    where: { idDetail },
    include: { peminjaman: true, buku: true, denda: true },
  })
  if (!detail) return fail("Detail peminjaman tidak ditemukan", 404)
  if (detail.statusKembali === "Sudah") {
    return fail("Buku ini sudah dikembalikan", 409)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const jatuhTempo = new Date(detail.peminjaman.tanggalJatuhTempo)
  jatuhTempo.setHours(0, 0, 0, 0)

  const diffMs = today.getTime() - jatuhTempo.getTime()
  const hariTelat = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

  const result = await db.$transaction(async (tx) => {
    // Update detail
    const updated = await tx.detailPeminjaman.update({
      where: { idDetail },
      data: {
        tanggalKembali: today,
        jumlahHariTelat: hariTelat,
        statusKembali: "Sudah",
      },
    })

    // Tambah stok buku
    await tx.buku.update({
      where: { idBuku: detail.idBuku },
      data: { stok: { increment: 1 } },
    })

    // Buat denda jika telat
    let dendaRecord = null
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

    // Cek apakah semua detail pada peminjaman ini sudah dikembalikan
    const sisabelum = await tx.detailPeminjaman.count({
      where: { idPeminjaman: detail.idPeminjaman, statusKembali: "Belum" },
    })
    if (sisabelum === 0) {
      await tx.peminjaman.update({
        where: { idPeminjaman: detail.idPeminjaman },
        data: { statusPinjam: "Selesai" },
      })
    }

    return { updated, dendaRecord }
  })

  return ok({
    message: hariTelat > 0 ? `Buku dikembalikan telat ${hariTelat} hari. Denda dibuat.` : "Buku dikembalikan tepat waktu.",
    detail: result.updated,
    denda: result.dendaRecord,
  })
})
