import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { apiHandler, ok } from "@/lib/api"

// =====================================================
// /api/laporan/anggota — Laporan Anggota (terpisah)
// Ref:
//   DFD 3.4.7 proses 7.5 Generate Laporan Anggota
//   Sequence 8.2.14 generateLaporan(jenis="anggota", periode)
//
// Query:
//   ?dari=2026-01-01   (berdasarkan tanggalDaftar)
//   ?sampai=2026-12-31
//   ?status=Aktif|Nonaktif
//
// Response: array anggota + statistik peminjaman per anggota
// =====================================================

export const GET = apiHandler(async (req) => {
  await requireAdmin()
  const { searchParams } = new URL(req.url)

  const today = new Date()
  const awalTahun = new Date(today.getFullYear(), 0, 1)
  const dari = searchParams.get("dari") ? new Date(searchParams.get("dari")!) : new Date(2000, 0, 1)
  const sampai = searchParams.get("sampai") ? new Date(searchParams.get("sampai")!) : today
  sampai.setHours(23, 59, 59, 999)
  const status = searchParams.get("status") || undefined

  const where: any = {
    tanggalDaftar: { gte: dari, lte: sampai },
  }
  if (status) where.statusAnggota = status

  const [list, totalAktif, totalNonaktif, totalAll] = await Promise.all([
    db.anggota.findMany({
      where,
      orderBy: { idAnggota: "asc" },
      select: {
        idAnggota: true,
        namaAnggota: true,
        jenisKelamin: true,
        email: true,
        noTelepon: true,
        tanggalDaftar: true,
        statusAnggota: true,
        _count: { select: { peminjaman: true } },
      },
    }),
    db.anggota.count({ where: { ...where, statusAnggota: "Aktif" } }),
    db.anggota.count({ where: { ...where, statusAnggota: "Nonaktif" } }),
    db.anggota.count({ where }),
  ])

  // Ambil statistik peminjaman per anggota
  const anggotaIds = list.map((a) => a.idAnggota)
  const peminjamanStats = await db.peminjaman.groupBy({
    by: ["idAnggota"],
    where: { idAnggota: { in: anggotaIds } },
    _count: { idPeminjaman: true },
  })
  const statsMap = new Map(peminjamanStats.map((s) => [s.idAnggota, s._count.idPeminjaman]))

  // Ambil total denda per anggota
  const dendaPerAnggota = await db.denda.findMany({
    where: {
      statusPembayaran: "Belum Bayar",
      detailPeminjaman: { peminjaman: { idAnggota: { in: anggotaIds } } },
    },
    include: {
      detailPeminjaman: { select: { peminjaman: { select: { idAnggota: true } } } },
    },
  })
  const dendaMap = new Map<string, number>()
  for (const d of dendaPerAnggota) {
    const idA = d.detailPeminjaman.peminjaman.idAnggota
    dendaMap.set(idA, (dendaMap.get(idA) || 0) + d.totalDenda)
  }

  const items = list.map((a) => ({
    ...a,
    totalPeminjaman: statsMap.get(a.idAnggota) || 0,
    dendaBelumBayar: dendaMap.get(a.idAnggota) || 0,
  }))

  return ok({
    jenis: "anggota",
    periode: { dari: dari.toISOString(), sampai: sampai.toISOString() },
    ringkasan: {
      totalAnggota: totalAll,
      aktif: totalAktif,
      nonaktif: totalNonaktif,
    },
    items,
  })
})
