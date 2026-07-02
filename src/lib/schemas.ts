import { z } from "zod"

// =====================================================
// Zod v4 schemas untuk validasi request body API
// Catatan Zod v4 vs v3:
//   - required_error / invalid_type_error → error
//   - errorMap → error (sebagai string atau ZodErrorMap)
//   - z.enum([...]) tidak menerima plain array, gunakan tuple literal
// =====================================================

// ---------------------------------------------------
// Auth
// ---------------------------------------------------

export const LoginSchema = z.object({
  role: z.enum(["admin", "anggota"] as const).describe("Role harus 'admin' atau 'anggota'"),
  identifier: z.string().trim().min(1, "Identifier tidak boleh kosong"),
  password: z.string().min(1, "Password tidak boleh kosong"),
})

export const RegisterSchema = z.object({
  namaAnggota: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  jenisKelamin: z.enum(["L", "P"] as const, { error: "Jenis kelamin harus 'L' atau 'P'" }),
  email: z.string().email("Format email tidak valid").toLowerCase(),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(100, "Password terlalu panjang"),
  alamat: z.string().trim().max(255, "Alamat maksimal 255 karakter").optional().nullable(),
  noTelepon: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]*$/, "Format nomor telepon tidak valid")
    .max(20, "Nomor telepon maksimal 20 karakter")
    .optional()
    .nullable(),
  tanggalLahir: z
    .string()
    .refine((v) => !v || !isNaN(Date.parse(v)), { message: "Format tanggal lahir tidak valid" })
    .optional()
    .nullable(),
})

// ---------------------------------------------------
// Kategori
// ---------------------------------------------------

export const CreateKategoriSchema = z.object({
  namaKategori: z
    .string()
    .trim()
    .min(2, "Nama kategori minimal 2 karakter")
    .max(100, "Nama kategori maksimal 100 karakter"),
  deskripsi: z.string().trim().max(500, "Deskripsi maksimal 500 karakter").optional().nullable(),
})

export const UpdateKategoriSchema = CreateKategoriSchema

// ---------------------------------------------------
// Buku
// ---------------------------------------------------

export const CreateBukuSchema = z.object({
  idKategori: z.string().trim().min(1, "Kategori wajib dipilih"),
  judulBuku: z
    .string()
    .trim()
    .min(1, "Judul buku tidak boleh kosong")
    .max(255, "Judul buku maksimal 255 karakter"),
  pengarang: z
    .string()
    .trim()
    .min(1, "Pengarang tidak boleh kosong")
    .max(150, "Pengarang maksimal 150 karakter"),
  penerbit: z
    .string()
    .trim()
    .min(1, "Penerbit tidak boleh kosong")
    .max(150, "Penerbit maksimal 150 karakter"),
  tahunTerbit: z
    .number({ error: "Tahun terbit harus angka" })
    .int("Tahun terbit harus bilangan bulat")
    .min(1000, "Tahun terbit tidak valid")
    .max(new Date().getFullYear() + 1, "Tahun terbit tidak boleh di masa depan"),
  stok: z
    .number({ error: "Stok harus angka" })
    .int("Stok harus bilangan bulat")
    .min(0, "Stok tidak boleh negatif")
    .default(0),
})

export const UpdateBukuSchema = z.object({
  idKategori: z.string().trim().min(1).optional(),
  judulBuku: z.string().trim().min(1).max(255).optional(),
  pengarang: z.string().trim().min(1).max(150).optional(),
  penerbit: z.string().trim().min(1).max(150).optional(),
  tahunTerbit: z
    .number({ error: "Tahun terbit harus angka" })
    .int()
    .min(1000)
    .max(new Date().getFullYear() + 1)
    .optional(),
  stok: z
    .number({ error: "Stok harus angka" })
    .int()
    .min(0, "Stok tidak boleh negatif")
    .optional(),
})

// ---------------------------------------------------
// Anggota
// ---------------------------------------------------

const AnggotaBaseSchema = z.object({
  namaAnggota: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  jenisKelamin: z.enum(["L", "P"] as const, { error: "Jenis kelamin harus 'L' atau 'P'" }),
  email: z.string().email("Format email tidak valid").toLowerCase(),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(100, "Password terlalu panjang"),
  alamat: z.string().trim().max(255).optional().nullable(),
  noTelepon: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]*$/, "Format nomor telepon tidak valid")
    .max(20)
    .optional()
    .nullable(),
  tanggalLahir: z
    .string()
    .refine((v) => !v || !isNaN(Date.parse(v)), { message: "Format tanggal lahir tidak valid" })
    .optional()
    .nullable(),
  statusAnggota: z.enum(["Aktif", "Nonaktif"] as const).optional(),
})

export const CreateAnggotaSchema = AnggotaBaseSchema

export const UpdateAnggotaSchema = AnggotaBaseSchema.partial()

export const UpdateProfilSchema = z.object({
  namaAnggota: z.string().trim().min(2).max(100).optional(),
  jenisKelamin: z.enum(["L", "P"] as const).optional(),
  email: z.string().email("Format email tidak valid").toLowerCase().optional(),
  password: z.string().min(6, "Password minimal 6 karakter").max(100).optional(),
  alamat: z.string().trim().max(255).optional().nullable(),
  noTelepon: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]*$/, "Format nomor telepon tidak valid")
    .max(20)
    .optional()
    .nullable(),
  tanggalLahir: z
    .string()
    .refine((v) => !v || !isNaN(Date.parse(v)), { message: "Format tanggal lahir tidak valid" })
    .optional()
    .nullable(),
})

export const VerifyAnggotaSchema = z.object({
  status: z.enum(["Aktif", "Nonaktif"] as const).optional(),
})

// ---------------------------------------------------
// Peminjaman
// ---------------------------------------------------

export const CreatePeminjamanSchema = z.object({
  idBukuList: z
    .array(z.string().trim().min(1))
    .min(1, "Pilih minimal 1 buku")
    .max(3, "Maksimal 3 buku per peminjaman"),
})

// ---------------------------------------------------
// Pengembalian
// ---------------------------------------------------

export const PengembalianSchema = z.object({
  idDetail: z.string().trim().min(1, "idDetail tidak boleh kosong"),
})
