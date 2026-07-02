import { db } from "@/lib/db"
import { requireAdmin, requireAnggota } from "@/lib/auth"
import { apiHandler, fail, ok } from "@/lib/api"
import { parseBody } from "@/lib/validate"
import { CreatePeminjamanSchema } from "@/lib/schemas"
import { createLoan, LoanError } from "@/services/loan-service"
import type { Prisma } from "@prisma/client"

// GET /api/peminjaman — daftar semua peminjaman (admin only)
// Query: ?status=Dipinjam|Selesai, ?q=kata kunci
// Ref: DFD 5.0, Use Case Kelola Peminjaman
export const GET = apiHandler(async (req) => {
  await requireAdmin()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") || undefined
  const q = searchParams.get("q")?.trim() || ""

  const where: Prisma.PeminjamanWhereInput = {}
  if (status) where.statusPinjam = status
  if (q) {
    where.OR = [
      { idPeminjaman: { contains: q } },
      { anggota: { namaAnggota: { contains: q } } },
      { anggota: { idAnggota: { contains: q } } },
    ]
  }

  const list = await db.peminjaman.findMany({
    where,
    orderBy: { tanggalPinjam: "desc" },
    include: {
      anggota: { select: { idAnggota: true, namaAnggota: true, email: true } },
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

// POST /api/peminjaman — anggota mengajukan peminjaman
// Body: { idBukuList: string[] }
// Ref: DFD 5.0, Use Case Ajukan Peminjaman Buku
export const POST = apiHandler(async (req) => {
  const session = await requireAnggota()

  const { data, error } = await parseBody(req, CreatePeminjamanSchema)
  if (error) return error

  try {
    const result = await createLoan(session.id, data.idBukuList)
    return ok(result, 201)
  } catch (e) {
    if (e instanceof LoanError) return fail(e.message, e.statusCode)
    throw e // re-throw — ditangkap apiHandler → 500
  }
})
