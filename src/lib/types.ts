// =====================================================
// Tipe bersama untuk frontend & API (Ref: Class Diagram Bab 7)
// =====================================================

export type Role = "admin" | "anggota"

export type SessionUser = {
  id: string
  role: Role
  nama: string
  email: string
  username?: string
  status?: string
  verified?: boolean
}

export type Kategori = {
  idKategori: string
  namaKategori: string
  deskripsi?: string | null
  createdAt: string
  updatedAt: string
  _count?: { buku: number }
}

export type Buku = {
  idBuku: string
  idKategori: string
  idAdmin: string
  judulBuku: string
  pengarang: string
  penerbit: string
  tahunTerbit: number
  stok: number
  createdAt: string
  updatedAt: string
  kategori?: Kategori
}

export type Anggota = {
  idAnggota: string
  namaAnggota: string
  jenisKelamin: "L" | "P"
  alamat?: string | null
  noTelepon?: string | null
  email: string
  tanggalDaftar: string
  statusAnggota: "Aktif" | "Nonaktif"
  tanggalLahir?: string | null
  createdAt?: string
  _count?: { peminjaman: number }
}

export type Denda = {
  idDenda: number
  idDetail: string
  jumlahHariTelat: number
  tarifPerhari: number
  totalDenda: number
  statusPembayaran: "Belum Bayar" | "Sudah Bayar"
  tanggalPembayaran?: string | null
  createdAt: string
  updatedAt: string
  detailPeminjaman?: {
    idDetail: string
    buku: { judulBuku: string }
    peminjaman: {
      anggota: { idAnggota: string; namaAnggota: string; email: string }
    }
  }
}

export type DetailPeminjaman = {
  idDetail: string
  idPeminjaman: string
  idBuku: string
  tanggalKembali?: string | null
  jumlahHariTelat: number
  statusKembali: "Belum" | "Sudah"
  buku?: { idBuku: string; judulBuku: string; pengarang: string; penerbit?: string }
  denda?: Denda | null
}

export type Peminjaman = {
  idPeminjaman: string
  idAnggota: string
  tanggalPinjam: string
  tanggalJatuhTempo: string
  statusPinjam: "Dipinjam" | "Selesai"
  createdAt: string
  updatedAt: string
  anggota?: { idAnggota: string; namaAnggota: string; email: string }
  detail?: DetailPeminjaman[]
}

export type Laporan = {
  ringkasan: {
    totalBuku: number
    totalAnggota: number
    anggotaAktif: number
    anggotaNonaktif: number
    peminjamanAktif: number
    totalPeminjaman: number
    totalStokBuku: number
    dendaBelumBayar: number
    totalDendaBelumBayar: number
  }
  peminjamanPerBulan: { label: string; total: number }[]
  topBuku: { judul: string; pengarang: string; total: number }[]
  dendaBelumBayar: Denda[]
  peminjamanTerbaru: Peminjaman[]
}

// Navigasi view (karena hanya route / yang terlihat)
export type AdminView =
  | "dashboard"
  | "buku"
  | "kategori"
  | "anggota"
  | "peminjaman"
  | "pengembalian"
  | "denda"
  | "laporan"

export type AnggotaView =
  | "katalog"
  | "status"
  | "riwayat"
  | "denda"
  | "notifikasi"
  | "profil"

// =====================================================
// Tipe untuk endpoint gap-filling (Ref: DFD 7.1-7.2, 8.2.8, 8.2.14)
// =====================================================

// GET /api/notifikasi (Ref: DFD 7.1-7.2)
export type Notifikasi = {
  id: string
  jenis: "jatuh_tempo" | "terlambat" | "denda"
  judul: string
  pesan: string
  idPeminjaman: string
  tanggalJatuhTempo?: string
  hariMenujuJatuhTempo?: number
  totalDenda?: number
  level: "info" | "warning" | "danger"
}

// GET /api/notifikasi?role=admin
export type NotifikasiAdmin = {
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
}

// GET /api/anggota/me (Ref: Seq 8.2.8)
export type AnggotaProfil = {
  idAnggota: string
  namaAnggota: string
  jenisKelamin: "L" | "P"
  alamat?: string | null
  noTelepon?: string | null
  email: string
  tanggalDaftar: string
  statusAnggota: "Aktif" | "Nonaktif"
  tanggalLahir?: string | null
  _count?: { peminjaman: number }
}

// GET /api/laporan/peminjaman, /denda, /anggota (Ref: DFD 7.3-7.5, Seq 8.2.14)
export type LaporanPeminjaman = {
  jenis: "peminjaman"
  periode: { dari: string; sampai: string }
  ringkasan: {
    totalTransaksi: number
    selesai: number
    dipinjam: number
    totalBukuDipinjam: number
  }
  items: Peminjaman[]
}

export type LaporanDenda = {
  jenis: "denda"
  periode: { dari: string; sampai: string }
  ringkasan: {
    totalDenda: number
    totalNominal: number
    belumBayar: number
    nominalBelumBayar: number
    sudahBayar: number
    nominalSudahBayar: number
  }
  items: Denda[]
}

export type LaporanAnggotaItem = Anggota & {
  totalPeminjaman: number
  dendaBelumBayar: number
}

export type LaporanAnggota = {
  jenis: "anggota"
  periode: { dari: string; sampai: string }
  ringkasan: {
    totalAnggota: number
    aktif: number
    nonaktif: number
  }
  items: LaporanAnggotaItem[]
}
