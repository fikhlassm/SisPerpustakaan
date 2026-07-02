import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { apiHandler, ok } from "@/lib/api"

// =====================================================
// /api/laporan/peminjaman — Laporan Peminjaman (terpisah)
// Ref:
//   DFD 3.4.7 proses 7.3 Generate Laporan Peminjaman
//   Sequence 8.2.14 generateLaporan(jenis="peminjaman", periode)
//
// Query:
//   ?dari=2026-01-01   (tanggal mulai, default: awal tahun ini)
//   ?sampai=2026-12-31 (tanggal akhir, default: hari ini)
//   ?status=Dipinjam|Selesai  (filter status, default: semua)
//
// Response: array of peminjaman dalam periode + ringkasan
// =====================================================

export const GET = apiHandler(async (req) => {
  await requireAdmin()
  const { searchParams } = new URL(req.url)

  const today = new Date()
  const awalTahun = new Date(today.getFullYear(), 0, 1)
  const dari = searchParams.get("dari") ? new Date(searchParams.get("dari")!) : awalTahun
  const sampai = searchParams.get("sampai") ? new Date(searchParams.get("sampai")!) : today
  sampai.setHours(23, 59, 59, 999)
  const status = searchParams.get("status") || undefined

  const where: any = {
    tanggalPinjam: { gte: dari, lte: sampai },
  }
  if (status) where.statusPinjam = status

  const [list, total, totalSelesai, totalDipinjam, totalBukuDipinjam] = await Promise.all([
    db.peminjaman.findMany({
      where,
      orderBy: { tanggalPinjam: "desc" },
      include: {
        anggota: { select: { idAnggota: true, namaAnggota: true, email: true } },
        detail: {
          include: {
            buku: { select: { idBuku: true, judulBuku: true, pengarang: true } },
            denda: { select: { totalDenda: true, statusPembayaran: true } },
          },
        },
      },
    }),
    db.peminjaman.count({ where }),
    db.peminjaman.count({ where: { ...where, statusPinjam: "Selesai" } }),
    db.peminjaman.count({ where: { ...where, statusPinjam: "Dipinjam" } }),
    db.detailPeminjaman.count({
      where: { peminjaman: where },
    }),
  ])

  return ok({
    jenis: "peminjaman",
    periode: { dari: dari.toISOString(), sampai: sampai.toISOString() },
    ringkasan: {
      totalTransaksi: total,
      selesai: totalSelesai,
      dipinjam: totalDipinjam,
      totalBukuDipinjam,
    },
    items: list,
  })
})
