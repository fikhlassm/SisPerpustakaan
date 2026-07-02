import { requireAdmin } from "@/lib/auth"
import { apiHandler, fail, ok } from "@/lib/api"
import { parseBody } from "@/lib/validate"
import { PengembalianSchema } from "@/lib/schemas"
import { processReturn, LoanError } from "@/services/loan-service"

// POST /api/pengembalian — proses pengembalian buku (admin only)
// Body: { idDetail: string }
// Ref: DFD 6.0, Use Case Proses Pengembalian Buku
//
// Logika bisnis ada di LoanService.processReturn():
//  - Hitung hari telat, buat denda jika perlu
//  - Tambah stok buku, tandai peminjaman "Selesai" jika semua buku kembali
export const POST = apiHandler(async (req) => {
  await requireAdmin()

  const { data, error } = await parseBody(req, PengembalianSchema)
  if (error) return error

  try {
    const result = await processReturn(data.idDetail)
    return ok(result)
  } catch (e) {
    if (e instanceof LoanError) return fail(e.message, e.statusCode)
    throw e
  }
})
