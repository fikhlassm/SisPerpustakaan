import { db } from "@/lib/db"
import { requireAnggota, requireAdmin } from "@/lib/auth"
import { apiHandler, ok } from "@/lib/api"
import { formatDate } from "@/lib/api-client"

// =====================================================
// /api/notifikasi — Notifikasi Jatuh Tempo & Denda
// Ref:
//   DFD 3.4.7 Proses Notifikasi & Laporan
//     7.1 Cek Jatuh Tempo          (baca D3 Data Peminjaman)
//     7.2 Kirim Notifikasi Jatuh Tempo (kirim peringatan ke Anggota)
//   Use Case (Bab 5.2): "menerima notifikasi otomatis terkait jatuh tempo atau denda"
//   Activity 6.2.6 Cek Status Peminjaman
//
// Pendekatan: notifikasi di-fetch on-demand oleh anggota (pull model),
// bukan push email/WhatsApp. Setiap kali anggota login atau membuka
// halaman notifikasi, sistem mengecek D3 + D4 dan mengembalikan
// daftar notifikasi yang aktif.
// =====================================================

export type Notifikasi = {
  id: string
  jenis: "jatuh_tempo" | "terlambat" | "denda"
  judul: string
  pesan: string
  idPeminjaman: string
  tanggalJatuhTempo?: string
  hariMenujuJatuhTempo?: number // negatif = sudah lewat
  totalDenda?: number
  level: "info" | "warning" | "danger"
}

// GET /api/notifikasi — daftar notifikasi untuk anggota yang sedang login
// Query: ?role=anggota (default) | ?role=admin (admin lihat ringkasan semua notifikasi)
export const GET = apiHandler(async (req) => {
  const { searchParams } = new URL(req.url)
  const roleParam = searchParams.get("role")

  // Admin: ringkasan notifikasi seluruh anggota (untuk dashboard admin)
  if (roleParam === "admin") {
    await requireAdmin()
    return ok(await buildAdminNotifications())
  }

  // Anggota: notifikasi pribadi
  const session = await requireAnggota()
  return ok(await buildAnggotaNotifications(session.id))
})

// =====================================================
// Build notifikasi untuk satu anggota (Ref: DFD 7.1, 7.2)
// =====================================================
async function buildAnggotaNotifications(idAnggota: string): Promise<Notifikasi[]> {
  const notifs: Notifikasi[] = []

  // Ambil semua peminjaman aktif anggota (D3 Data Peminjaman)
  const peminjamanAktif = await db.peminjaman.findMany({
    where: { idAnggota, statusPinjam: "Dipinjam" },
    include: {
      detail: {
        where: { statusKembali: "Belum" },
        include: {
          buku: { select: { judulBuku: true } },
          denda: true,
        },
      },
    },
    orderBy: { tanggalJatuhTempo: "asc" },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const p of peminjamanAktif) {
    const jatuhTempo = new Date(p.tanggalJatuhTempo)
    jatuhTempo.setHours(0, 0, 0, 0)
    const diffDays = Math.round(
      (jatuhTempo.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    )

    // Cek apakah ada detail dengan denda belum bayar
    const dendaBelumBayar = p.detail.filter((d) => d.denda && d.denda.statusPembayaran === "Belum Bayar")

    if (diffDays < 0) {
      // Sudah lewat jatuh tempo -> notifikasi terlambat (danger)
      const hariTelat = Math.abs(diffDays)
      notifs.push({
        id: `terlambat-${p.idPeminjaman}`,
        jenis: "terlambat",
        judul: `Peminjaman ${p.idPeminjaman} terlambat ${hariTelat} hari`,
        pesan: `Buku yang Anda pinjam telah melewati batas pengembalian ${hariTelat} hari yang lalu. Segera kembalikan ke perpustakaan untuk menghindari penambahan denda (Rp 2.000/hari).`,
        idPeminjaman: p.idPeminjaman,
        tanggalJatuhTempo: p.tanggalJatuhTempo.toISOString(),
        hariMenujuJatuhTempo: diffDays,
        level: "danger",
      })
    } else if (diffDays <= 2) {
      // Mendekati jatuh tempo (0-2 hari) -> notifikasi peringatan (warning)
      notifs.push({
        id: `jatuh-tempo-${p.idPeminjaman}`,
        jenis: "jatuh_tempo",
        judul:
          diffDays === 0
            ? `Peminjaman ${p.idPeminjaman} jatuh tempo HARI INI`
            : `Peminjaman ${p.idPeminjaman} jatuh tempo dalam ${diffDays} hari`,
        pesan: `Buku yang Anda pinjam harus dikembalikan paling lambat ${formatDate(p.tanggalJatuhTempo)}. Kembalikan tepat waktu untuk menghindari denda keterlambatan.`,
        idPeminjaman: p.idPeminjaman,
        tanggalJatuhTempo: p.tanggalJatuhTempo.toISOString(),
        hariMenujuJatuhTempo: diffDays,
        level: "warning",
      })
    }

    // Notifikasi denda belum bayar untuk detail yang sudah dikembalikan telat
    for (const d of dendaBelumBayar) {
      if (d.denda) {
        notifs.push({
          id: `denda-${d.denda.idDenda}`,
          jenis: "denda",
          judul: `Denda Rp ${d.denda.totalDenda.toLocaleString("id-ID")} belum dibayar`,
          pesan: `Anda memiliki denda keterlambatan ${d.denda.jumlahHariTelat} hari untuk buku "${d.buku.judulBuku}" (Rp 2.000/hari). Silakan lakukan pembayaran di loket perpustakaan.`,
          idPeminjaman: p.idPeminjaman,
          totalDenda: d.denda.totalDenda,
          level: "danger",
        })
      }
    }
  }

  // Tambahan: cek denda dari peminjaman yang sudah Selesai tapi masih ada denda belum bayar
  const dendaTerlewat = await db.denda.findMany({
    where: {
      statusPembayaran: "Belum Bayar",
      detailPeminjaman: {
        peminjaman: {
          idAnggota,
          statusPinjam: "Selesai",
        },
      },
    },
    include: {
      detailPeminjaman: {
        include: {
          buku: { select: { judulBuku: true } },
          peminjaman: { select: { idPeminjaman: true } },
        },
      },
    },
  })
  for (const d of dendaTerlewat) {
    // Hindari duplikat (sudah ditambahkan di atas jika peminjaman masih aktif)
    if (notifs.some((n) => n.id === `denda-${d.idDenda}`)) continue
    notifs.push({
      id: `denda-${d.idDenda}`,
      jenis: "denda",
      judul: `Denda Rp ${d.totalDenda.toLocaleString("id-ID")} belum dibayar`,
      pesan: `Anda memiliki denda keterlambatan ${d.jumlahHariTelat} hari untuk buku "${d.detailPeminjaman.buku.judulBuku}". Silakan lakukan pembayaran di loket perpustakaan.`,
      idPeminjaman: d.detailPeminjaman.peminjaman.idPeminjaman,
      totalDenda: d.totalDenda,
      level: "danger",
    })
  }

  // Urutkan: danger dulu, lalu warning, lalu info
  const levelOrder = { danger: 0, warning: 1, info: 2 }
  notifs.sort((a, b) => levelOrder[a.level] - levelOrder[b.level])
  return notifs
}

// =====================================================
// Build ringkasan notifikasi untuk admin (dashboard)
// =====================================================
async function buildAdminNotifications(): Promise<{
  total: number
  peminjamanTerlambat: number
  mendekatiJatuhTempo: number
  dendaBelumBayar: number
  items: Array<{
    idAnggota: string
    namaAnggota: string
    idPeminjaman: string
    jenis: string
    judul: string
    level: string
    tanggalJatuhTempo: string
  }>
}> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Semua peminjaman aktif
  const allAktif = await db.peminjaman.findMany({
    where: { statusPinjam: "Dipinjam" },
    include: {
      anggota: { select: { idAnggota: true, namaAnggota: true } },
      detail: { where: { statusKembali: "Belum" } },
    },
  })

  const items: Array<any> = []
  let terlambat = 0
  let mendekati = 0

  for (const p of allAktif) {
    const jt = new Date(p.tanggalJatuhTempo)
    jt.setHours(0, 0, 0, 0)
    const diff = Math.round((jt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) {
      terlambat++
      items.push({
        idAnggota: p.anggota.idAnggota,
        namaAnggota: p.anggota.namaAnggota,
        idPeminjaman: p.idPeminjaman,
        jenis: "terlambat",
        judul: `${p.anggota.namaAnggota} terlambat ${Math.abs(diff)} hari (${p.idPeminjaman})`,
        level: "danger",
        tanggalJatuhTempo: p.tanggalJatuhTempo.toISOString(),
      })
    } else if (diff <= 2) {
      mendekati++
      items.push({
        idAnggota: p.anggota.idAnggota,
        namaAnggota: p.anggota.namaAnggota,
        idPeminjaman: p.idPeminjaman,
        jenis: "jatuh_tempo",
        judul: `${p.anggota.namaAnggota} jatuh tempo dalam ${diff} hari (${p.idPeminjaman})`,
        level: "warning",
        tanggalJatuhTempo: p.tanggalJatuhTempo.toISOString(),
      })
    }
  }

  const dendaCount = await db.denda.count({ where: { statusPembayaran: "Belum Bayar" } })

  return {
    total: terlambat + mendekati + dendaCount,
    peminjamanTerlambat: terlambat,
    mendekatiJatuhTempo: mendekati,
    dendaBelumBayar: dendaCount,
    items: items.slice(0, 20), // 20 teratas
  }
}
