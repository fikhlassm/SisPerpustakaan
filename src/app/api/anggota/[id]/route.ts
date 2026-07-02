import { db } from "@/lib/db"
import { requireAdmin, hashPassword } from "@/lib/auth"
import { apiHandler, fail, ok } from "@/lib/api"

// GET /api/anggota/[id] — detail anggota (admin only)
export const GET = apiHandler(async (_req, ctx) => {
  await requireAdmin()
  const id = (await ctx.params).id
  const anggota = await db.anggota.findUnique({
    where: { idAnggota: id },
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
      _count: { select: { peminjaman: true } },
    },
  })
  if (!anggota) return fail("Anggota tidak ditemukan", 404)
  return ok(anggota)
})

// PUT /api/anggota/[id] — update data anggota (admin only)
export const PUT = apiHandler(async (req, ctx) => {
  await requireAdmin()
  const id = (await ctx.params).id
  const body = await req.json()
  const { namaAnggota, jenisKelamin, alamat, noTelepon, email, tanggalLahir, password } = body

  const exists = await db.anggota.findUnique({ where: { idAnggota: id } })
  if (!exists) return fail("Anggota tidak ditemukan", 404)

  if (email && email !== exists.email) {
    const dup = await db.anggota.findUnique({ where: { email } })
    if (dup) return fail("Email sudah dipakai anggota lain", 409)
  }

  const data: any = {}
  if (namaAnggota) data.namaAnggota = namaAnggota
  if (jenisKelamin) data.jenisKelamin = jenisKelamin
  if (alamat !== undefined) data.alamat = alamat || null
  if (noTelepon !== undefined) data.noTelepon = noTelepon || null
  if (email) data.email = email
  if (tanggalLahir !== undefined) data.tanggalLahir = tanggalLahir ? new Date(tanggalLahir) : null
  if (password) data.password = await hashPassword(password)

  const updated = await db.anggota.update({
    where: { idAnggota: id },
    data,
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
    },
  })
  return ok(updated)
})

// DELETE /api/anggota/[id] — hapus anggota (admin only)
// Ref: ON DELETE RESTRICT — tidak bisa hapus jika punya riwayat peminjaman
export const DELETE = apiHandler(async (_req, ctx) => {
  await requireAdmin()
  const id = (await ctx.params).id
  const exists = await db.anggota.findUnique({
    where: { idAnggota: id },
    include: { _count: { select: { peminjaman: true } } },
  })
  if (!exists) return fail("Anggota tidak ditemukan", 404)
  if (exists._count.peminjaman > 0) {
    return fail("Tidak bisa menghapus: anggota memiliki riwayat peminjaman", 409)
  }
  await db.anggota.delete({ where: { idAnggota: id } })
  return ok({ message: "Anggota dihapus" })
})
