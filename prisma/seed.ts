import { db } from "../src/lib/db"
import bcrypt from "bcryptjs"

async function main() {
  console.log("🌱 Seeding database...")

  // Bersihkan data lama (urutan penting karena FK)
  await db.denda.deleteMany()
  await db.detailPeminjaman.deleteMany()
  await db.peminjaman.deleteMany()
  await db.buku.deleteMany()
  await db.anggota.deleteMany()
  await db.kategori.deleteMany()
  await db.admin.deleteMany()

  // --- admin (Ref: 1.5) ---
  const adminPass = await bcrypt.hash("admin123", 10)
  await db.admin.create({
    data: {
      idAdmin: "ADM001",
      username: "admin1",
      password: adminPass,
      namaAdmin: "Budi Santoso",
      email: "admin1@perpus.ac.id",
      noTelepon: "081234567890",
    },
  })

  // --- kategori (Ref: 1.5) ---
  await db.kategori.createMany({
    data: [
      { idKategori: "KTG001", namaKategori: "Teknologi Informasi", deskripsi: "Buku seputar TI, pemrograman, dan sistem informasi" },
      { idKategori: "KTG002", namaKategori: "Fiksi", deskripsi: "Novel dan cerita fiksi" },
      { idKategori: "KTG003", namaKategori: "Sains", deskripsi: "Buku sains dan penelitian" },
      { idKategori: "KTG004", namaKategori: "Pendidikan", deskripsi: "Buku pendidikan dan akademik" },
      { idKategori: "KTG005", namaKategori: "Sejarah", deskripsi: "Buku sejarah dan biografi" },
    ],
  })

  // --- buku (Ref: 1.5, diperluas) ---
  await db.buku.createMany({
    data: [
      { idBuku: "BK0001", idKategori: "KTG001", idAdmin: "ADM001", judulBuku: "Rekayasa Perangkat Lunak", pengarang: "Roger Pressman", penerbit: "Andi Offset", tahunTerbit: 2015, stok: 5 },
      { idBuku: "BK0002", idKategori: "KTG001", idAdmin: "ADM001", judulBuku: "Basis Data", pengarang: "Fathansyah", penerbit: "Informatika", tahunTerbit: 2018, stok: 3 },
      { idBuku: "BK0003", idKategori: "KTG002", idAdmin: "ADM001", judulBuku: "Laskar Pelangi", pengarang: "Andrea Hirata", penerbit: "Bentang Pustaka", tahunTerbit: 2005, stok: 2 },
      { idBuku: "BK0004", idKategori: "KTG001", idAdmin: "ADM001", judulBuku: "Clean Code", pengarang: "Robert C. Martin", penerbit: "Prentice Hall", tahunTerbit: 2008, stok: 4 },
      { idBuku: "BK0005", idKategori: "KTG003", idAdmin: "ADM001", judulBuku: "A Brief History of Time", pengarang: "Stephen Hawking", penerbit: "Bantam Books", tahunTerbit: 1988, stok: 3 },
      { idBuku: "BK0006", idKategori: "KTG002", idAdmin: "ADM001", judulBuku: "Bumi Manusia", pengarang: "Pramoedya Ananta Toer", penerbit: "Hasta Mitra", tahunTerbit: 1980, stok: 2 },
      { idBuku: "BK0007", idKategori: "KTG004", idAdmin: "ADM001", judulBuku: "Metodologi Penelitian", pengarang: "Sugiyono", penerbit: "Alfabeta", tahunTerbit: 2019, stok: 6 },
      { idBuku: "BK0008", idKategori: "KTG005", idAdmin: "ADM001", judulBuku: "Sejarah Indonesia Modern", pengarang: "M.C. Ricklefs", penerbit: "Serambi", tahunTerbit: 2008, stok: 3 },
      { idBuku: "BK0009", idKategori: "KTG001", idAdmin: "ADM001", judulBuku: "Pengantar Sistem Informasi", pengarang: "Bodnar & Hopwood", penerbit: "Salemba Empat", tahunTerbit: 2014, stok: 4 },
      { idBuku: "BK0010", idKategori: "KTG003", idAdmin: "ADM001", judulBuku: "Sapiens", pengarang: "Yuval Noah Harari", penerbit: "Harper", tahunTerbit: 2014, stok: 5 },
      { idBuku: "BK0011", idKategori: "KTG002", idAdmin: "ADM001", judulBuku: "Filosofi Teras", pengarang: "Henry Manampiring", penerbit: "Kompas", tahunTerbit: 2018, stok: 3 },
      { idBuku: "BK0012", idKategori: "KTG004", idAdmin: "ADM001", judulBuku: "Psikologi Pendidikan", pengarang: "Muhibbin Syah", penerbit: "Remaja Rosdakarya", tahunTerbit: 2017, stok: 2 },
    ],
  })

  // --- anggota (Ref: 1.5) — AG0002 sengaja Nonaktif untuk uji verifikasi ---
  const anggotaPass = await bcrypt.hash("anggota123", 10)
  await db.anggota.create({
    data: {
      idAnggota: "AG0001",
      namaAnggota: "Siti Aisyah",
      jenisKelamin: "P",
      alamat: "Jl. Mulyorejo No. 1, Surabaya",
      noTelepon: "081298765432",
      email: "siti@ub.ac.id",
      password: anggotaPass,
      tanggalDaftar: new Date("2026-01-10"),
      statusAnggota: "Aktif",
      tanggalLahir: new Date("2003-05-14"),
    },
  })
  await db.anggota.create({
    data: {
      idAnggota: "AG0002",
      namaAnggota: "Rizky Ramadhan",
      jenisKelamin: "L",
      alamat: "Jl. Kertajaya No. 5, Surabaya",
      noTelepon: "081211122233",
      email: "rizky@ub.ac.id",
      password: anggotaPass,
      tanggalDaftar: new Date("2026-02-15"),
      statusAnggota: "Nonaktif",
      tanggalLahir: new Date("2002-11-20"),
    },
  })
  await db.anggota.create({
    data: {
      idAnggota: "AG0003",
      namaAnggota: "Dewi Lestari",
      jenisKelamin: "P",
      alamat: "Jl. Rungkut No. 12, Surabaya",
      noTelepon: "081333344455",
      email: "dewi@ub.ac.id",
      password: anggotaPass,
      tanggalDaftar: new Date("2026-03-01"),
      statusAnggota: "Aktif",
      tanggalLahir: new Date("2003-08-22"),
    },
  })

  // --- peminjaman contoh (agar dashboard & laporan langsung berisi) ---
  const today = new Date()
  const daysAgo = (n: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() - n)
    return d
  }
  const daysAhead = (n: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + n)
    return d
  }

  // Peminjaman 1: AG0001, masih dipinjam, belum telat
  await db.peminjaman.create({
    data: {
      idPeminjaman: "PMJ0001",
      idAnggota: "AG0001",
      tanggalPinjam: daysAgo(3),
      tanggalJatuhTempo: daysAhead(4),
      statusPinjam: "Dipinjam",
      detail: {
        create: [
          { idDetail: "DTL0001", idBuku: "BK0001", statusKembali: "Belum" },
          { idDetail: "DTL0002", idBuku: "BK0005", statusKembali: "Belum" },
        ],
      },
    },
  })

  // Peminjaman 2: AG0001, sudah selesai (dikembalikan tepat waktu)
  await db.peminjaman.create({
    data: {
      idPeminjaman: "PMJ0002",
      idAnggota: "AG0001",
      tanggalPinjam: daysAgo(30),
      tanggalJatuhTempo: daysAgo(16),
      statusPinjam: "Selesai",
      detail: {
        create: [
          { idDetail: "DTL0003", idBuku: "BK0003", tanggalKembali: daysAgo(17), statusKembali: "Sudah", jumlahHariTelat: 0 },
        ],
      },
    },
  })

  // Peminjaman 3: AG0003, sudah selesai tapi telat -> ada denda
  await db.peminjaman.create({
    data: {
      idPeminjaman: "PMJ0003",
      idAnggota: "AG0003",
      tanggalPinjam: daysAgo(40),
      tanggalJatuhTempo: daysAgo(26),
      statusPinjam: "Selesai",
      detail: {
        create: [
          {
            idDetail: "DTL0004",
            idBuku: "BK0004",
            tanggalKembali: daysAgo(20),
            statusKembali: "Sudah",
            jumlahHariTelat: 6,
            denda: {
              create: {
                jumlahHariTelat: 6,
                tarifPerhari: 2000,
                totalDenda: 12000,
                statusPembayaran: "Belum Bayar",
              },
            },
          },
        ],
      },
    },
  })

  // Peminjaman 4: AG0003, masih dipinjam, sudah lewat jatuh tempo (telat, belum kembali)
  await db.peminjaman.create({
    data: {
      idPeminjaman: "PMJ0004",
      idAnggota: "AG0003",
      tanggalPinjam: daysAgo(20),
      tanggalJatuhTempo: daysAgo(6),
      statusPinjam: "Dipinjam",
      detail: {
        create: [
          { idDetail: "DTL0005", idBuku: "BK0010", statusKembali: "Belum" },
        ],
      },
    },
  })

  console.log("✅ Seed selesai.")
  console.log("   Admin login    : username=admin1  password=admin123")
  console.log("   Anggota login 1: email=siti@ub.ac.id   password=anggota123 (Aktif)")
  console.log("   Anggota login 2: email=rizky@ub.ac.id  password=anggota123 (Nonaktif — untuk uji verifikasi)")
  console.log("   Anggota login 3: email=dewi@ub.ac.id   password=anggota123 (Aktif, punya denda)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
