import { requireAdmin } from "@/lib/auth"
import { apiHandler, fail, ok, type RouteContext } from "@/lib/api"
import { markFinePaid, FineError } from "@/services/fine-service"

// PATCH /api/denda/[id]/bayar — tandai denda lunas (admin only)
// Ref: DFD 6.0
export const PATCH = apiHandler(async (_req, ctx?: RouteContext) => {
  await requireAdmin()

  const id = Number((await ctx!.params).id)
  if (Number.isNaN(id)) return fail("ID denda tidak valid", 422)

  try {
    const updated = await markFinePaid(id)
    return ok(updated)
  } catch (e) {
    if (e instanceof FineError) return fail(e.message, e.statusCode)
    throw e
  }
})
