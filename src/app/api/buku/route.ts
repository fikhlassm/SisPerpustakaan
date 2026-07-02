import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { apiHandler, fail, nextId, ok } from "@/lib/api"
import { parseBody } from "@/lib/validate"
import { CreateBukuSchema } from "@/lib/schemas"
import type { Prisma } from "@prisma/client"

// GET /api/buku — daftar buku dengan pencarian, filter kategori, & sort
// Query:
//   ?q=judul/pengarang/penerbit   (kata kunci, Ref: DFD 4.1-4.3)
//   ?id_kategori=KTG001           (filter kategori, Ref: DFD 4.5)
//   ?sort=judul|pengarang|tahun|stok  (urutan, Ref: DFD 4.5 Filter/Urutan)
//   ?order=asc|desc               (arah urutan, default asc)
// Ref: DFD 4.0 Pencarian & Katalog Buku, Use Case Cari Buku / Lihat Katalog
export const GET = apiHandler(async (req) => {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim() || ""
  const idKategori = searchParams.get("id_kategori") || undefined
  const sortParam = searchParams.get("sort") || ""
  const orderParam = searchParams.get("order") === "desc" ? "desc" : "asc"

  const where: Prisma.BukuWhereInput = {}
  if (q) {
    where.OR = [
      { judulBuku: { contains: q } },
      { pengarang: { contains: q } },
      { penerbit: { contains: q } },
    ]
  }
  if (idKategori) where.idKategori = idKategori

  // Mapping parameter sort ke field Prisma (Ref: DFD 4.5 Filter/Urutan)
  const sortFieldMap: Record<string, keyof Prisma.BukuOrderByWithRelationInput> = {
    judul: "judulBuku",
    pengarang: "pengarang",
    tahun: "tahunTerbit",
    stok: "stok",
  }
  const sortField = sortFieldMap[sortParam] ?? "idBuku"
  const orderBy: Prisma.BukuOrderByWithRelationInput = { [sortField]: orderParam }

  const list = await db.buku.findMany({
    where,
    orderBy,
    include: { kategori: true },
  })
  return ok(list)
})

// POST /api/buku — tambah buku (admin only)
// Ref: DFD 1.0, Use Case Kelola Data Buku
export const POST = apiHandler(async (req) => {
  const session = await requireAdmin()

  const { data, error } = await parseBody(req, CreateBukuSchema)
  if (error) return error
  const { idKategori, judulBuku, pengarang, penerbit, tahunTerbit, stok } = data

  const kategori = await db.kategori.findUnique({ where: { idKategori } })
  if (!kategori) return fail("Kategori tidak ditemukan", 404)

  const idBuku = await nextId("buku", "BK")
  const buku = await db.buku.create({
    data: {
      idBuku,
      idKategori,
      idAdmin: session.id,
      judulBuku,
      pengarang,
      penerbit,
      tahunTerbit,
      stok,
    },
    include: { kategori: true },
  })
  return ok(buku, 201)
})
