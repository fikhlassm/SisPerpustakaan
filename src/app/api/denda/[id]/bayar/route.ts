import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { apiHandler, fail, ok } from "@/lib/api"

// PATCH /api/denda/[id]/bayar — tandai denda lunas (admin only)
// Ref: DFD 6.0
export const PATCH = apiHandler(async (_req, ctx) => {
  await requireAdmin()
  const id = Number((await ctx.params).id)
  if (Number.isNaN(id)) return fail("ID denda tidak valid", 422)

  const denda = await db.denda.findUnique({ where: { idDenda: id } })
  if (!denda) return fail("Denda tidak ditemukan", 404)
  if (denda.statusPembayaran === "Sudah Bayar") {
    return fail("Denda sudah lunas", 409)
  }

  const updated = await db.denda.update({
    where: { idDenda: id },
    data: {
      statusPembayaran: "Sudah Bayar",
      tanggalPembayaran: new Date(),
    },
  })
  return ok(updated)
})
