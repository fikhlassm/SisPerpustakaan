import { db } from "@/lib/db"
import { createSession, hashPassword } from "@/lib/auth"
import { apiHandler, fail, nextId, ok } from "@/lib/api"

// POST /api/auth/register — Daftar Anggota baru (status default Nonaktif, perlu verifikasi admin)
// Ref: Use Case Daftar, DFD 2.1
export const POST = apiHandler(async (req) => {
  const body = await req.json()
  const { namaAnggota, jenisKelamin, alamat, noTelepon, email, password, tanggalLahir } = body

  if (!namaAnggota || !jenisKelamin || !email || !password) {
    return fail("Nama, jenis kelamin, email, dan password wajib diisi", 422)
  }
  if (!["L", "P"].includes(jenisKelamin)) {
    return fail("Jenis kelamin harus 'L' atau 'P'", 422)
  }

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
