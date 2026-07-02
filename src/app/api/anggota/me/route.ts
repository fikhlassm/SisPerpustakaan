import { db } from "@/lib/db"
import { requireAnggota, hashPassword } from "@/lib/auth"
import { apiHandler, fail, ok } from "@/lib/api"

// =====================================================
// /api/anggota/me — Profil Anggota (self-service)
// Ref: Sequence Diagram 8.2.8 "Edit Profil Anggota"
//      Activity Diagram 6.2.8 "Edit Profil"
//      Use Case "Kelola Profil Pribadi" (Bab 5.2)
//
// Menggantikan ProfilController pada Sequence Diagram:
//   lihatProfil()       -> GET  /api/anggota/me
//   updateProfil(data)  -> PUT  /api/anggota/me
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
// Body: { namaAnggota?, jenisKelamin?, alamat?, noTelepon?, email?, tanggalLahir?, password? }
// Catatan: statusAnggota TIDAK bisa diubah sendiri (hanya admin via /verify)
export const PUT = apiHandler(async (req) => {
  const session = await requireAnggota()
  const body = await req.json()
  const { namaAnggota, jenisKelamin, alamat, noTelepon, email, tanggalLahir, password } = body

  const exists = await db.anggota.findUnique({ where: { idAnggota: session.id } })
  if (!exists) return fail("Anggota tidak ditemukan", 404)

  // Validasi jenis kelamin
  if (jenisKelamin && !["L", "P"].includes(jenisKelamin)) {
    return fail("Jenis kelamin harus 'L' atau 'P'", 422)
  }

  // Cek duplikasi email jika diubah
  if (email && email !== exists.email) {
    const dup = await db.anggota.findUnique({ where: { email } })
    if (dup) return fail("Email sudah dipakai anggota lain", 409)
  }

  const data: any = {}
  if (namaAnggota) data.namaAnggota = namaAnggota
  if (jenisKelamin) data.jenisKelamin = jenisKelamin
  if (alamat !== undefined) data.alamat = alamat || null
  if (noTelepon !== undefined) data.noTelepon = noTelepon || null
  if (email) data.email = email
  if (tanggalLahir !== undefined) data.tanggalLahir = tanggalLahir ? new Date(tanggalLahir) : null
  if (password) {
    if (password.length < 6) return fail("Password minimal 6 karakter", 422)
    data.password = await hashPassword(password)
  }

  const updated = await db.anggota.update({
    where: { idAnggota: session.id },
    data,
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
