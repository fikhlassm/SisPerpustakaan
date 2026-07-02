import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { apiHandler, fail, ok } from "@/lib/api"

// PUT /api/kategori/[id] — update kategori (admin only)
export const PUT = apiHandler(async (req, ctx) => {
  await requireAdmin()
  const id = (await ctx.params).id
  const body = await req.json()
  const { namaKategori, deskripsi } = body
  if (!namaKategori) return fail("Nama kategori wajib diisi", 422)

  const exists = await db.kategori.findUnique({ where: { idKategori: id } })
  if (!exists) return fail("Kategori tidak ditemukan", 404)

  const updated = await db.kategori.update({
    where: { idKategori: id },
    data: { namaKategori, deskripsi: deskripsi ?? null },
  })
  return ok(updated)
})

// DELETE /api/kategori/[id] — hapus kategori (admin only)
// Ref: ON DELETE RESTRICT di DDL — tidak bisa hapus jika masih dipakai buku
export const DELETE = apiHandler(async (_req, ctx) => {
  await requireAdmin()
  const id = (await ctx.params).id
  const exists = await db.kategori.findUnique({
    where: { idKategori: id },
    include: { _count: { select: { buku: true } } },
  })
  if (!exists) return fail("Kategori tidak ditemukan", 404)
  if (exists._count.buku > 0) {
    return fail(`Tidak bisa menghapus: kategori masih dipakai oleh ${exists._count.buku} buku`, 409)
  }
  await db.kategori.delete({ where: { idKategori: id } })
  return ok({ message: "Kategori dihapus" })
})
