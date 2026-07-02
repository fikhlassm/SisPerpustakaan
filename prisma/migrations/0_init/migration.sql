-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Admin" (
    "idAdmin" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "namaAdmin" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "noTelepon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("idAdmin")
);

-- CreateTable
CREATE TABLE "Kategori" (
    "idKategori" TEXT NOT NULL,
    "namaKategori" TEXT NOT NULL,
    "deskripsi" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kategori_pkey" PRIMARY KEY ("idKategori")
);

-- CreateTable
CREATE TABLE "Anggota" (
    "idAnggota" TEXT NOT NULL,
    "namaAnggota" TEXT NOT NULL,
    "jenisKelamin" TEXT NOT NULL,
    "alamat" TEXT,
    "noTelepon" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "tanggalDaftar" TIMESTAMP(3) NOT NULL,
    "statusAnggota" TEXT NOT NULL,
    "tanggalLahir" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Anggota_pkey" PRIMARY KEY ("idAnggota")
);

-- CreateTable
CREATE TABLE "Buku" (
    "idBuku" TEXT NOT NULL,
    "idKategori" TEXT NOT NULL,
    "idAdmin" TEXT NOT NULL,
    "judulBuku" TEXT NOT NULL,
    "pengarang" TEXT NOT NULL,
    "penerbit" TEXT NOT NULL,
    "tahunTerbit" INTEGER NOT NULL,
    "stok" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Buku_pkey" PRIMARY KEY ("idBuku")
);

-- CreateTable
CREATE TABLE "Peminjaman" (
    "idPeminjaman" TEXT NOT NULL,
    "idAnggota" TEXT NOT NULL,
    "tanggalPinjam" TIMESTAMP(3) NOT NULL,
    "tanggalJatuhTempo" TIMESTAMP(3) NOT NULL,
    "statusPinjam" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Peminjaman_pkey" PRIMARY KEY ("idPeminjaman")
);

-- CreateTable
CREATE TABLE "DetailPeminjaman" (
    "idDetail" TEXT NOT NULL,
    "idPeminjaman" TEXT NOT NULL,
    "idBuku" TEXT NOT NULL,
    "tanggalKembali" TIMESTAMP(3),
    "jumlahHariTelat" INTEGER NOT NULL DEFAULT 0,
    "statusKembali" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetailPeminjaman_pkey" PRIMARY KEY ("idDetail")
);

-- CreateTable
CREATE TABLE "Denda" (
    "idDenda" SERIAL NOT NULL,
    "idDetail" TEXT NOT NULL,
    "jumlahHariTelat" INTEGER NOT NULL,
    "tarifPerhari" DOUBLE PRECISION NOT NULL,
    "totalDenda" DOUBLE PRECISION NOT NULL,
    "statusPembayaran" TEXT NOT NULL,
    "tanggalPembayaran" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Denda_pkey" PRIMARY KEY ("idDenda")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Anggota_email_key" ON "Anggota"("email");

-- CreateIndex
CREATE INDEX "Buku_idKategori_idx" ON "Buku"("idKategori");

-- CreateIndex
CREATE INDEX "Buku_idAdmin_idx" ON "Buku"("idAdmin");

-- CreateIndex
CREATE INDEX "Peminjaman_idAnggota_idx" ON "Peminjaman"("idAnggota");

-- CreateIndex
CREATE INDEX "DetailPeminjaman_idPeminjaman_idx" ON "DetailPeminjaman"("idPeminjaman");

-- CreateIndex
CREATE INDEX "DetailPeminjaman_idBuku_idx" ON "DetailPeminjaman"("idBuku");

-- CreateIndex
CREATE UNIQUE INDEX "Denda_idDetail_key" ON "Denda"("idDetail");

-- AddForeignKey
ALTER TABLE "Buku" ADD CONSTRAINT "Buku_idKategori_fkey" FOREIGN KEY ("idKategori") REFERENCES "Kategori"("idKategori") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Buku" ADD CONSTRAINT "Buku_idAdmin_fkey" FOREIGN KEY ("idAdmin") REFERENCES "Admin"("idAdmin") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Peminjaman" ADD CONSTRAINT "Peminjaman_idAnggota_fkey" FOREIGN KEY ("idAnggota") REFERENCES "Anggota"("idAnggota") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailPeminjaman" ADD CONSTRAINT "DetailPeminjaman_idPeminjaman_fkey" FOREIGN KEY ("idPeminjaman") REFERENCES "Peminjaman"("idPeminjaman") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailPeminjaman" ADD CONSTRAINT "DetailPeminjaman_idBuku_fkey" FOREIGN KEY ("idBuku") REFERENCES "Buku"("idBuku") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Denda" ADD CONSTRAINT "Denda_idDetail_fkey" FOREIGN KEY ("idDetail") REFERENCES "DetailPeminjaman"("idDetail") ON DELETE RESTRICT ON UPDATE CASCADE;

