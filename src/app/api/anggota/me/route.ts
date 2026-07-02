import { db } from "@/lib/db"
import { requireAnggota, hashPassword } from "@/lib/auth"
import { apiHandler, fail, ok } from "@/lib/api"
import { parseBody } from "@/lib/validate"
import { UpdateProfilSchema } from "@/lib/schemas"

// =====================================================
// /api/anggota/me — Profil Anggota (self-service)
// Ref: Sequence Diagram 8.2.8 "Edit Profil Anggota"
//      Activity Diagram 6.2.8 "Edit Profil"
//      Use Case "Kelola Profil Pribadi" (Bab 5.2)
// =====================================================

// GET /api/anggota/me — anggota melihat data profilnya sendiri
export const GET = apiHandler(async () => {
  const session = await requireAnggota()
  const anggota = await db.anggota.findUnique({
    where: { idAnggota: session.id },
    select: {
      idAnggota: true,
      namaAnggota: true,
      jenisKelamin: true,
      alamat: true,
      noTelepon: true,
      email: true,
      tanggalDaftar: true,
      statusAnggota: true,
      tanggalLahir: true,
      _count: { select: { peminjaman: true } },
    },
  })
  if (!anggota) return fail("Anggota tidak ditemukan", 404)
  return ok(anggota)
})

// PUT /api/anggota/me — anggota mengubah data profilnya sendiri
// Catatan: statusAnggota TIDAK bisa diubah sendiri (hanya admin via /verify)
export const PUT = apiHandler(async (req) => {
  const session = await requireAnggota()

  const { data, error } = await parseBody(req, UpdateProfilSchema)
  if (error) return error
  const { namaAnggota, jenisKelamin, alamat, noTelepon, email, tanggalLahir, password } = data

  const exists = await db.anggota.findUnique({ where: { idAnggota: session.id } })
  if (!exists) return fail("Anggota tidak ditemukan", 404)

  // Cek duplikasi email jika diubah
  if (email && email !== exists.email) {
    const dup = await db.anggota.findUnique({ where: { email } })
    if (dup) return fail("Email sudah dipakai anggota lain", 409)
  }

  const updated = await db.anggota.update({
    where: { idAnggota: session.id },
    data: {
      ...(namaAnggota !== undefined ? { namaAnggota } : {}),
      ...(jenisKelamin !== undefined ? { jenisKelamin } : {}),
      ...(alamat !== undefined ? { alamat: alamat || null } : {}),
      ...(noTelepon !== undefined ? { noTelepon: noTelepon || null } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(tanggalLahir !== undefined ? { tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null } : {}),
      ...(password !== undefined ? { password: await hashPassword(password) } : {}),
    },
    select: {
      idAnggota: true,
      namaAnggota: true,
      jenisKelamin: true,
      alamat: true,
      noTelepon: true,
      email: true,
      tanggalDaftar: true,
      statusAnggota: true,
      tanggalLahir: true,
    },
  })
  return ok(updated)
})
