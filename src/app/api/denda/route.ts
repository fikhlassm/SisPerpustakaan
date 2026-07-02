import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { apiHandler, fail, ok } from "@/lib/api"

// GET /api/denda — daftar semua denda (admin), filter ?status=Belum%20Bayar|Sudah%20Bayar
// Ref: DFD 6.0, Use Case Generate Laporan (denda)
export const GET = apiHandler(async (req) => {
  await requireAdmin()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") || undefined

  const where: any = {}
  if (status) where.statusPembayaran = status

  const list = await db.denda.findMany({
    where,
    orderBy: { idDenda: "desc" },
    include: {
      detailPeminjaman: {
        include: {
          buku: { select: { judulBuku: true } },
          peminjaman: {
            include: {
              anggota: { select: { idAnggota: true, namaAnggota: true, email: true } },
            },
          },
        },
      },
    },
  })
  return ok(list)
})
