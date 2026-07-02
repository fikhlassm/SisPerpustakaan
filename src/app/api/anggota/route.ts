import { db } from "@/lib/db"
import { requireAdmin, hashPassword } from "@/lib/auth"
import { apiHandler, fail, nextId, ok } from "@/lib/api"

// GET /api/anggota — daftar anggota (admin only), dukung filter status
// Ref: DFD 2.0, Use Case Kelola Data Anggota
export const GET = apiHandler(async (req) => {
  await requireAdmin()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") || undefined
  const q = searchParams.get("q")?.trim() || ""

  const where: any = {}
  if (status) where.statusAnggota = status
  if (q) {
    where.OR = [
      { namaAnggota: { contains: q } },
      { email: { contains: q } },
      { idAnggota: { contains: q } },
    ]
  }

  const list = await db.anggota.findMany({
    where,
    orderBy: { idAnggota: "asc" },
    select: {
      idAnggota: true,
      namaAnggota: true,
      jenisKelamin: true,
      alamat: true,
      noTelepon: true,
      email: true,
      tanggalDaftar: true,
      statusAnggota: true,
      tanggalLahir: true,
      createdAt: true,
    },
  })
  return ok(list)
})

// POST /api/anggota — admin tambah anggota langsung (status bisa langsung Aktif)
export const POST = apiHandler(async (req) => {
  await requireAdmin()
  const body = await req.json()
  const {
    namaAnggota,
    jenisKelamin,
    alamat,
    noTelepon,
    email,
    password,
    tanggalLahir,
    statusAnggota,
  } = body

  if (!namaAnggota || !jenisKelamin || !email || !password) {
    return fail("Nama, jenis kelamin, email, password wajib diisi", 422)
  }
  if (!["L", "P"].includes(jenisKelamin)) return fail("Jenis kelamin harus 'L' atau 'P'", 422)

  const exists = await db.anggota.findUnique({ where: { email } })
  if (exists) return fail("Email sudah terdaftar", 409)

  const idAnggota = await nextId("anggota", "AG")
  const hashed = await hashPassword(password)
  const anggota = await db.anggota.create({
    data: {
      idAnggota,
      namaAnggota,
      jenisKelamin,
      alamat: alamat || null,
      noTelepon: noTelepon || null,
      email,
      password: hashed,
      tanggalDaftar: new Date(),
      statusAnggota: statusAnggota === "Aktif" ? "Aktif" : "Nonaktif",
      tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
    },
    select: {
      idAnggota: true,
      namaAnggota: true,
      email: true,
      statusAnggota: true,
    },
  })
  return ok(anggota, 201)
})
