import { db } from "@/lib/db"
import { createSession, verifyPassword } from "@/lib/auth"
import { apiHandler, fail, ok } from "@/lib/api"

// POST /api/auth/login — Login untuk Admin (username) atau Anggota (email)
// Ref: DFD 3.0, Use Case Login
// Body: { role: "admin" | "anggota", identifier, password }
//   - admin: identifier = username
//   - anggota: identifier = email
export const POST = apiHandler(async (req) => {
  const body = await req.json()
  const { role, identifier, password } = body

  if (!role || !identifier || !password) {
    return fail("role, identifier, dan password wajib diisi", 422)
  }

  if (role === "admin") {
    const admin = await db.admin.findUnique({ where: { username: identifier } })
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
      role: "admin",
      nama: admin.namaAdmin,
      email: admin.email,
      username: admin.username,
    })
  }

  if (role === "anggota") {
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
      role: "anggota",
      nama: anggota.namaAnggota,
      email: anggota.email,
      status: anggota.statusAnggota,
      verified: anggota.statusAnggota === "Aktif",
    })
  }

  return fail("Role tidak valid", 422)
})
