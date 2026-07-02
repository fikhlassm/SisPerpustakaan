import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { apiHandler, fail, nextId, ok } from "@/lib/api"

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

  const where: any = {}
  if (q) {
    where.OR = [
      { judulBuku: { contains: q } },
      { pengarang: { contains: q } },
      { penerbit: { contains: q } },
    ]
  }
  if (idKategori) where.idKategori = idKategori

  // Mapping parameter sort ke field Prisma (Ref: DFD 4.5 Filter/Urutan)
  const sortFieldMap: Record<string, string> = {
    judul: "judulBuku",
    pengarang: "pengarang",
    tahun: "tahunTerbit",
    stok: "stok",
  }
  const sortField = sortFieldMap[sortParam] || "idBuku"
  const orderBy: any = { [sortField]: orderParam }

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
  const body = await req.json()
  const { idKategori, judulBuku, pengarang, penerbit, tahunTerbit, stok } = body

  if (!idKategori || !judulBuku || !pengarang || !penerbit || !tahunTerbit) {
    return fail("id_kategori, judul, pengarang, penerbit, tahun terbit wajib diisi", 422)
  }
  const stokNum = Number(stok) || 0
  if (stokNum < 0) return fail("Stok tidak boleh negatif (chk_buku_stok)", 422)

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
      tahunTerbit: Number(tahunTerbit),
      stok: stokNum,
    },
    include: { kategori: true },
  })
  return ok(buku, 201)
})
