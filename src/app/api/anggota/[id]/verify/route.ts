import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { apiHandler, fail, ok } from "@/lib/api"

// PATCH /api/anggota/[id]/verify — verifikasi/aktivasi anggota (toggle Aktif/Nonaktif)
// Ref: DFD 2.2 Verifikasi Anggota, Activity 6.2.11
export const PATCH = apiHandler(async (req, ctx) => {
  await requireAdmin()
  const id = (await ctx.params).id
  const body = await req.json().catch(() => ({}))
  // Jika body menyediakan status, pakai itu; selain itu toggle
  const exists = await db.anggota.findUnique({ where: { idAnggota: id } })
  if (!exists) return fail("Anggota tidak ditemukan", 404)

  const newStatus =
    body.status === "Aktif" || body.status === "Nonaktif"
      ? body.status
      : exists.statusAnggota === "Aktif"
        ? "Nonaktif"
        : "Aktif"

  const updated = await db.anggota.update({
    where: { idAnggota: id },
    data: { statusAnggota: newStatus },
    select: {
      idAnggota: true,
      namaAnggota: true,
      email: true,
      statusAnggota: true,
    },
  })
  return ok(updated)
})
