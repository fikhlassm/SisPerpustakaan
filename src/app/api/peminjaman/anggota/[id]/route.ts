import { db } from "@/lib/db"
import { requireAnggota } from "@/lib/auth"
import { apiHandler, ok } from "@/lib/api"

// GET /api/peminjaman/anggota/[id] — riwayat peminjaman milik anggota (hanya dirinya sendiri)
// Ref: DFD 5.0, Use Case Lihat Status & Riwayat Peminjaman
export const GET = apiHandler(async (_req, ctx) => {
  const session = await requireAnggota()
  const id = (await ctx.params).id
  if (session.id !== id) {
    return ok({ error: "Forbidden" }, 403)
  }

  const list = await db.peminjaman.findMany({
    where: { idAnggota: id },
    orderBy: { tanggalPinjam: "desc" },
    include: {
      detail: {
        include: {
          buku: { select: { idBuku: true, judulBuku: true, pengarang: true } },
          denda: true,
        },
      },
    },
  })
  return ok(list)
})
