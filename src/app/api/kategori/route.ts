import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { apiHandler, fail, nextId, ok } from "@/lib/api"

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
  const body = await req.json()
  const { namaKategori, deskripsi } = body
  if (!namaKategori) return fail("Nama kategori wajib diisi", 422)

  const idKategori = await nextId("kategori", "KTG")
  const kategori = await db.kategori.create({
    data: { idKategori, namaKategori, deskripsi: deskripsi || null },
  })
  return ok(kategori, 201)
})
