import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { apiHandler, ok } from "@/lib/api"

// GET /api/laporan — statistik & ringkasan untuk admin
// Ref: DFD 7.0, Use Case Generate Laporan
//
// Mengembalikan:
//  - ringkasan: total buku, total anggota, total peminjaman aktif, total denda belum bayar
//  - peminjamanPerBulan: jumlah peminjaman 6 bulan terakhir
//  - topBuku: 5 buku paling sering dipinjam
//  - dendaBelumBayar: list denda status Belum Bayar
//  - peminjamanTerbaru: 5 peminjaman terbaru
export const GET = apiHandler(async () => {
  await requireAdmin()

  const [
    totalBuku,
    totalAnggota,
    anggotaAktif,
    peminjamanAktif,
    totalPeminjaman,
    dendaBelumBayarAgg,
    allDendaBelumBayar,
    allPeminjaman,
    allDetail,
    peminjamanTerbaru,
  ] = await Promise.all([
    db.buku.count(),
    db.anggota.count(),
    db.anggota.count({ where: { statusAnggota: "Aktif" } }),
    db.peminjaman.count({ where: { statusPinjam: "Dipinjam" } }),
    db.peminjaman.count(),
    db.denda.aggregate({
      where: { statusPembayaran: "Belum Bayar" },
      _sum: { totalDenda: true },
      _count: true,
    }),
    db.denda.findMany({
      where: { statusPembayaran: "Belum Bayar" },
      include: {
        detailPeminjaman: {
          include: {
            buku: { select: { judulBuku: true } },
            peminjaman: {
              include: { anggota: { select: { idAnggota: true, namaAnggota: true } } },
            },
          },
        },
      },
      orderBy: { idDenda: "desc" },
    }),
    db.peminjaman.findMany({ select: { tanggalPinjam: true } }),
    db.detailPeminjaman.findMany({
      select: { idBuku: true, buku: { select: { judulBuku: true, pengarang: true } } },
    }),
    db.peminjaman.findMany({
      orderBy: { tanggalPinjam: "desc" },
      take: 5,
      include: {
        anggota: { select: { idAnggota: true, namaAnggota: true } },
        detail: { include: { buku: { select: { judulBuku: true } } } },
      },
    }),
  ])

  // Peminjaman per bulan (6 bulan terakhir)
  const now = new Date()
  const bulan: { label: string; total: number }[] = []
  const namaBulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const total = allPeminjaman.filter((p) => {
      return (
        p.tanggalPinjam.getFullYear() === d.getFullYear() &&
        p.tanggalPinjam.getMonth() === d.getMonth()
      )
    }).length
    bulan.push({ label: `${namaBulan[d.getMonth()]} ${d.getFullYear()}`, total })
  }

  // Top 5 buku paling sering dipinjam
  const counter: Record<string, { judul: string; pengarang: string; total: number }> = {}
  for (const d of allDetail) {
    if (!counter[d.idBuku]) {
      counter[d.idBuku] = { judul: d.buku.judulBuku, pengarang: d.buku.pengarang, total: 0 }
    }
    counter[d.idBuku].total++
  }
  const topBuku = Object.values(counter)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return ok({
    ringkasan: {
      totalBuku,
      totalAnggota,
      anggotaAktif,
      anggotaNonaktif: totalAnggota - anggotaAktif,
      peminjamanAktif,
      totalPeminjaman,
      totalStokBuku: await db.buku.aggregate({ _sum: { stok: true } }).then((r) => r._sum.stok || 0),
      dendaBelumBayar: dendaBelumBayarAgg._count,
      totalDendaBelumBayar: dendaBelumBayarAgg._sum.totalDenda || 0,
    },
    peminjamanPerBulan: bulan,
    topBuku,
    dendaBelumBayar: allDendaBelumBayar,
    peminjamanTerbaru,
  })
})
