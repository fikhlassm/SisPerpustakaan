import { db } from "@/lib/db"
import { createSession, verifyPassword } from "@/lib/auth"
import { apiHandler, fail, ok } from "@/lib/api"
import { parseBody } from "@/lib/validate"
import { LoginSchema } from "@/lib/schemas"
import { checkRateLimit } from "@/lib/rate-limit"

// POST /api/auth/login — Login untuk Admin (username) atau Anggota (email)
// Ref: DFD 3.0, Use Case Login
// Body: { role: "admin" | "anggota", identifier, password }
//   - admin: identifier = username
//   - anggota: identifier = email
export const POST = apiHandler(async (req) => {
  // Rate limiting: maks 10 percobaan per IP per menit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown"
  const { allowed, remaining, resetAt } = checkRateLimit(`login:${ip}`, {
    max: 10,
    windowMs: 60_000,
  })
  if (!allowed) {
    return fail(
      "Terlalu banyak percobaan login. Coba lagi dalam 1 menit.",
      429,
      { resetAt, remaining },
    )
  }

  // Validasi body dengan Zod
  const { data, error } = await parseBody(req, LoginSchema)
  if (error) return error
  const { role, identifier, password } = data

  if (role === "admin") {
    const admin = await db.admin.findUnique({ where: { username: identifier } })
    // Pesan generik — jangan bocorkan apakah username ada atau tidak
    if (!admin) return fail("Username atau password salah", 401)
    const valid = await verifyPassword(password, admin.password)
    if (!valid) return fail("Username atau password salah", 401)

    await createSession({
      id: admin.idAdmin,
      role: "admin",
      nama: admin.namaAdmin,
      email: admin.email,
      username: admin.username,
    })

    return ok({
      id: admin.idAdmin,
      role: "admin" as const,
      nama: admin.namaAdmin,
      email: admin.email,
      username: admin.username,
    })
  }

  // role === "anggota"
  const anggota = await db.anggota.findUnique({ where: { email: identifier } })
  if (!anggota) return fail("Email atau password salah", 401)
  const valid = await verifyPassword(password, anggota.password)
  if (!valid) return fail("Email atau password salah", 401)

  await createSession({
    id: anggota.idAnggota,
    role: "anggota",
    nama: anggota.namaAnggota,
    email: anggota.email,
  })

  return ok({
    id: anggota.idAnggota,
    role: "anggota" as const,
    nama: anggota.namaAnggota,
    email: anggota.email,
    status: anggota.statusAnggota,
    verified: anggota.statusAnggota === "Aktif",
  })
})
