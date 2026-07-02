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
  | "profil"
