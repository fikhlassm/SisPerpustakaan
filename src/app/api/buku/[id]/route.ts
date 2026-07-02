import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { apiHandler, fail, ok } from "@/lib/api"

// GET /api/buku/[id] — detail buku (Ref: Use Case Lihat Detail Buku)
export const GET = apiHandler(async (_req, ctx) => {
  const id = (await ctx.params).id
  const buku = await db.buku.findUnique({
    where: { idBuku: id },
    include: { kategori: true, admin: { select: { namaAdmin: true } } },
  })
  if (!buku) return fail("Buku tidak ditemukan", 404)
  return ok(buku)
})

// PUT /api/buku/[id] — update buku (admin only)
export const PUT = apiHandler(async (req, ctx) => {
  await requireAdmin()
  const id = (await ctx.params).id
  const body = await req.json()
  const { idKategori, judulBuku, pengarang, penerbit, tahunTerbit, stok } = body

  const exists = await db.buku.findUnique({ where: { idBuku: id } })
  if (!exists) return fail("Buku tidak ditemukan", 404)

  if (idKategori) {
    const kategori = await db.kategori.findUnique({ where: { idKategori } })
    if (!kategori) return fail("Kategori tidak ditemukan", 404)
  }
  const stokNum = stok !== undefined ? Number(stok) : undefined
  if (stokNum !== undefined && stokNum < 0) return fail("Stok tidak boleh negatif", 422)

  const updated = await db.buku.update({
    where: { idBuku: id },
    data: {
      ...(idKategori ? { idKategori } : {}),
      ...(judulBuku ? { judulBuku } : {}),
      ...(pengarang ? { pengarang } : {}),
      ...(penerbit ? { penerbit } : {}),
      ...(tahunTerbit !== undefined ? { tahunTerbit: Number(tahunTerbit) } : {}),
      ...(stokNum !== undefined ? { stok: stokNum } : {}),
    },
    include: { kategori: true },
  })
  return ok(updated)
})

// DELETE /api/buku/[id] — hapus buku (admin only)
// Ref: ON DELETE RESTRICT — tidak bisa hapus jika sedang dipinjam (ada detail_peminjaman)
export const DELETE = apiHandler(async (_req, ctx) => {
  await requireAdmin()
  const id = (await ctx.params).id
  const exists = await db.buku.findUnique({
    where: { idBuku: id },
    include: { _count: { select: { detailPinjam: true } } },
  })
  if (!exists) return fail("Buku tidak ditemukan", 404)
  if (exists._count.detailPinjam > 0) {
    return fail("Tidak bisa menghapus: buku pernah/tercatat dalam peminjaman", 409)
  }
  await db.buku.delete({ where: { idBuku: id } })
  return ok({ message: "Buku dihapus" })
})
