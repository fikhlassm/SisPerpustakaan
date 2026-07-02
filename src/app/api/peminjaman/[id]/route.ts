import { db } from "@/lib/db"
import { requireAdmin, requireAnggota } from "@/lib/auth"
import { apiHandler, fail, ok, type RouteContext } from "@/lib/api"

// GET /api/peminjaman/[id] — detail peminjaman
// Admin bisa lihat semua; anggota hanya miliknya sendiri
export const GET = apiHandler(async (_req, ctx?: RouteContext) => {
  const id = (await ctx!.params).id
  const peminjaman = await db.peminjaman.findUnique({
    where: { idPeminjaman: id },
    include: {
      anggota: { select: { idAnggota: true, namaAnggota: true, email: true } },
      detail: {
        include: {
          buku: { select: { idBuku: true, judulBuku: true, pengarang: true, penerbit: true } },
          denda: true,
        },
      },
    },
  })
  if (!peminjaman) return fail("Peminjaman tidak ditemukan", 404)

  // Otorisasi: admin bebas, anggota hanya miliknya
  try {
    await requireAdmin()
  } catch {
    const session = await requireAnggota()
    if (peminjaman.idAnggota !== session.id) {
      return fail("Anda tidak berhak melihat peminjaman ini", 403)
    }
  }

  return ok(peminjaman)
})
