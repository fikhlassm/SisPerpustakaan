import { db } from "@/lib/db"
import { requireAdmin, hashPassword } from "@/lib/auth"
import { apiHandler, fail, ok, type RouteContext } from "@/lib/api"
import { parseBody } from "@/lib/validate"
import { UpdateAnggotaSchema } from "@/lib/schemas"

// GET /api/anggota/[id] — detail anggota (admin only)
export const GET = apiHandler(async (_req, ctx?: RouteContext) => {
  await requireAdmin()
  const id = (await ctx!.params).id
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
export const PUT = apiHandler(async (req, ctx?: RouteContext) => {
  await requireAdmin()
  const id = (await ctx!.params).id

  const { data, error } = await parseBody(req, UpdateAnggotaSchema)
  if (error) return error
  const { namaAnggota, jenisKelamin, alamat, noTelepon, email, tanggalLahir, password } = data

  const exists = await db.anggota.findUnique({ where: { idAnggota: id } })
  if (!exists) return fail("Anggota tidak ditemukan", 404)

  if (email && email !== exists.email) {
    const dup = await db.anggota.findUnique({ where: { email } })
    if (dup) return fail("Email sudah dipakai anggota lain", 409)
  }

  const updated = await db.anggota.update({
    where: { idAnggota: id },
    data: {
      ...(namaAnggota !== undefined ? { namaAnggota } : {}),
      ...(jenisKelamin !== undefined ? { jenisKelamin } : {}),
      ...(alamat !== undefined ? { alamat: alamat || null } : {}),
      ...(noTelepon !== undefined ? { noTelepon: noTelepon || null } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(tanggalLahir !== undefined ? { tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null } : {}),
      ...(password !== undefined ? { password: await hashPassword(password) } : {}),
    },
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
export const DELETE = apiHandler(async (_req, ctx?: RouteContext) => {
  await requireAdmin()
  const id = (await ctx!.params).id
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
