import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { apiHandler, fail, nextId, ok } from "@/lib/api"

// GET /api/buku — daftar buku dengan pencarian & filter kategori
// Query: ?q=judul/pengarang&id_kategori=KTG001
// Ref: DFD 4.0, Use Case Cari Buku / Lihat Katalog
export const GET = apiHandler(async (req) => {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim() || ""
  const idKategori = searchParams.get("id_kategori") || undefined

  const where: any = {}
  if (q) {
    where.OR = [
      { judulBuku: { contains: q } },
      { pengarang: { contains: q } },
      { penerbit: { contains: q } },
    ]
  }
  if (idKategori) where.idKategori = idKategori

  const list = await db.buku.findMany({
    where,
    orderBy: { idBuku: "asc" },
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
