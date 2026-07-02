import { db } from "@/lib/db"
import { createSession, hashPassword } from "@/lib/auth"
import { apiHandler, fail, nextId, ok } from "@/lib/api"
import { parseBody } from "@/lib/validate"
import { RegisterSchema } from "@/lib/schemas"

// POST /api/auth/register — Daftar Anggota baru (status default Nonaktif, perlu verifikasi admin)
// Ref: Use Case Daftar, DFD 2.1
export const POST = apiHandler(async (req) => {
  const { data, error } = await parseBody(req, RegisterSchema)
  if (error) return error

  const { namaAnggota, jenisKelamin, alamat, noTelepon, email, password, tanggalLahir } = data

  const exists = await db.anggota.findUnique({ where: { email } })
  if (exists) {
    return fail("Email sudah terdaftar", 409)
  }

  const idAnggota = await nextId("anggota", "AG")
  const hashed = await hashPassword(password)

  const anggota = await db.anggota.create({
    data: {
      idAnggota,
      namaAnggota,
      jenisKelamin,
      alamat: alamat || null,
      noTelepon: noTelepon || null,
      email,
      password: hashed,
      tanggalDaftar: new Date(),
      statusAnggota: "Nonaktif", // butuh verifikasi admin (Ref: Activity 6.2.11)
      tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
    },
  })

  // auto-login setelah daftar (tapi tetap Nonaktif hingga diverifikasi)
  await createSession({
    id: anggota.idAnggota,
    role: "anggota",
    nama: anggota.namaAnggota,
    email: anggota.email,
  })

  return ok(
    {
      id: anggota.idAnggota,
      nama: anggota.namaAnggota,
      email: anggota.email,
      status: anggota.statusAnggota,
      message: "Pendaftaran berhasil. Akun Anda menunggu verifikasi admin.",
    },
    201,
  )
})
