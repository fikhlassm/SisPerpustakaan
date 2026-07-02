import { db } from "@/lib/db"
import { requireAdmin, requireAnggota } from "@/lib/auth"
import { apiHandler, fail, nextId, ok, LAMA_PINJAM_HARI, MAKS_BUKU_PINJAM } from "@/lib/api"

// GET /api/peminjaman — daftar semua peminjaman (admin only), filter ?status=Dipinjam|Selesai
// Ref: DFD 5.0, Use Case Kelola Peminjaman
export const GET = apiHandler(async (req) => {
  await requireAdmin()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") || undefined
  const q = searchParams.get("q")?.trim() || ""

  const where: any = {}
  if (status) where.statusPinjam = status
  if (q) {
    where.OR = [
      { idPeminjaman: { contains: q } },
      { anggota: { namaAnggota: { contains: q } } },
      { anggota: { idAnggota: { contains: q } } },
    ]
  }

  const list = await db.peminjaman.findMany({
    where,
    orderBy: { tanggalPinjam: "desc" },
    include: {
      anggota: { select: { idAnggota: true, namaAnggota: true, email: true } },
      detail: {
        include: {
          buku: { select: { idBuku: true, judulBuku: true, pengarang: true } },
          denda: true,
        },
      },
    },
  })
  return ok(list)
})

// POST /api/peminjaman — anggota mengajukan peminjaman
// Body: { idBukuList: string[] }
// Ref: DFD 5.0, Use Case Ajukan Peminjaman Buku
export const POST = apiHandler(async (req) => {
  const session = await requireAnggota()

  // Cek anggota Aktif (Ref: DFD 2.2 — harus terverifikasi)
  const anggota = await db.anggota.findUnique({ where: { idAnggota: session.id } })
  if (!anggota) return fail("Anggota tidak ditemukan", 404)
  if (anggota.statusAnggota !== "Aktif") {
    return fail("Akun Anda belum diverifikasi admin. Tidak bisa meminjam buku.", 403)
  }

  const body = await req.json()
  const { idBukuList } = body
  if (!Array.isArray(idBukuList) || idBukuList.length === 0) {
    return fail("Pilih minimal 1 buku untuk dipinjam", 422)
  }
  if (idBukuList.length > MAKS_BUKU_PINJAM) {
    return fail(`Maksimal ${MAKS_BUKU_PINJAM} buku per peminjaman`, 422)
  }

  // Cek apakah anggota masih punya peminjaman aktif (tidak boleh ada 2 peminjaman aktif bersamaan)
  const aktif = await db.peminjaman.findFirst({
    where: { idAnggota: session.id, statusPinjam: "Dipinjam" },
  })
  if (aktif) {
    return fail(
      "Anda masih memiliki peminjaman aktif. Selesaikan/kembalikan dahulu sebelum meminjam lagi.",
      409,
    )
  }

  // Validasi semua buku & stok
  const bukuList = await db.buku.findMany({ where: { idBuku: { in: idBukuList } } })
  if (bukuList.length !== idBukuList.length) {
    return fail("Salah satu buku tidak ditemukan", 404)
  }
  for (const b of bukuList) {
    if (b.stok <= 0) return fail(`Stok buku "${b.judulBuku}" habis`, 409)
  }

  // Buat peminjaman + detail
  const idPeminjaman = await nextId("peminjaman", "PMJ")
  const today = new Date()
  const jatuhTempo = new Date(today)
  jatuhTempo.setDate(jatuhTempo.getDate() + LAMA_PINJAM_HARI)

  // Transaction: buat peminjaman, detail, dan kurangi stok
  const result = await db.$transaction(async (tx) => {
    let detailCounter = await tx.detailPeminjaman.count()
    const detailData = []
    for (const b of bukuList) {
      detailCounter++
      const idDetail = `DTL${String(detailCounter).padStart(4, "0")}`
      detailData.push({
        idDetail,
        idBuku: b.idBuku,
        statusKembali: "Belum",
      })
      await tx.buku.update({
        where: { idBuku: b.idBuku },
        data: { stok: { decrement: 1 } },
      })
    }

    const peminjaman = await tx.peminjaman.create({
      data: {
        idPeminjaman,
        idAnggota: session.id,
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
    return peminjaman
  })

  return ok(result, 201)
})
