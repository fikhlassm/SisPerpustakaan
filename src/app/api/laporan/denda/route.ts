import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { apiHandler, ok } from "@/lib/api"

// =====================================================
// /api/laporan/denda — Laporan Denda (terpisah)
// Ref:
//   DFD 3.4.7 proses 7.4 Generate Laporan Denda
//   Sequence 8.2.14 generateLaporan(jenis="denda", periode)
//
// Query:
//   ?dari=2026-01-01   (berdasarkan created_at denda)
//   ?sampai=2026-12-31
//   ?status=Belum Bayar|Sudah Bayar
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
    createdAt: { gte: dari, lte: sampai },
  }
  if (status) where.statusPembayaran = status

  const [list, agg, belumBayarAgg, sudahBayarAgg] = await Promise.all([
    db.denda.findMany({
      where,
      orderBy: { idDenda: "desc" },
      include: {
        detailPeminjaman: {
          include: {
            buku: { select: { judulBuku: true, pengarang: true } },
            peminjaman: {
              include: { anggota: { select: { idAnggota: true, namaAnggota: true, email: true } } },
            },
          },
        },
      },
    }),
    db.denda.aggregate({ where, _sum: { totalDenda: true }, _count: true }),
    db.denda.aggregate({
      where: { ...where, statusPembayaran: "Belum Bayar" },
      _sum: { totalDenda: true },
      _count: true,
    }),
    db.denda.aggregate({
      where: { ...where, statusPembayaran: "Sudah Bayar" },
      _sum: { totalDenda: true },
      _count: true,
    }),
  ])

  return ok({
    jenis: "denda",
    periode: { dari: dari.toISOString(), sampai: sampai.toISOString() },
    ringkasan: {
      totalDenda: agg._count,
      totalNominal: agg._sum.totalDenda || 0,
      belumBayar: belumBayarAgg._count,
      nominalBelumBayar: belumBayarAgg._sum.totalDenda || 0,
      sudahBayar: sudahBayarAgg._count,
      nominalSudahBayar: sudahBayarAgg._sum.totalDenda || 0,
    },
    items: list,
  })
})
