import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { apiHandler, fail, nextId, ok } from "@/lib/api"
import { parseBody } from "@/lib/validate"
import { CreateKategoriSchema } from "@/lib/schemas"

// GET /api/kategori — daftar semua kategori (publik untuk anggota, admin juga)
export const GET = apiHandler(async () => {
  const list = await db.kategori.findMany({
    orderBy: { idKategori: "asc" },
    include: { _count: { select: { buku: true } } },
  })
  return ok(list)
})

// POST /api/kategori — tambah kategori (admin only)
// Ref: DFD 1.0, Use Case Kelola Data Buku (kategori)
export const POST = apiHandler(async (req) => {
  await requireAdmin()

  const { data, error } = await parseBody(req, CreateKategoriSchema)
  if (error) return error
  const { namaKategori, deskripsi } = data

  const idKategori = await nextId("kategori", "KTG")
  const kategori = await db.kategori.create({
    data: { idKategori, namaKategori, deskripsi: deskripsi || null },
  })
  return ok(kategori, 201)
})
