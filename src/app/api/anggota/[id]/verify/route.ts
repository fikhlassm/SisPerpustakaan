import { requireAdmin } from "@/lib/auth"
import { apiHandler, fail, ok, type RouteContext } from "@/lib/api"
import { parseBody } from "@/lib/validate"
import { VerifyAnggotaSchema } from "@/lib/schemas"
import { verifyMember, MemberError } from "@/services/member-service"

// PATCH /api/anggota/[id]/verify — verifikasi/aktivasi anggota (toggle Aktif/Nonaktif)
// Ref: DFD 2.2 Verifikasi Anggota, Activity 6.2.11
//
// Body opsional: { status?: "Aktif" | "Nonaktif" }
// Jika tidak disertakan → toggle otomatis (via MemberService.verify)
export const PATCH = apiHandler(async (req, ctx?: RouteContext) => {
  await requireAdmin()
  const id = (await ctx!.params).id

  const { data, error } = await parseBody(req, VerifyAnggotaSchema)
  if (error) return error

  try {
    const updated = await verifyMember(id, data.status)
    return ok(updated)
  } catch (e) {
    if (e instanceof MemberError) return fail(e.message, e.statusCode)
    throw e
  }
})
