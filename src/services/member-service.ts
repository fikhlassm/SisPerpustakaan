import { db } from "@/lib/db"

// =====================================================
// MemberService — business logic untuk manajemen anggota
//
// Ref: DFD 2.0 (Kelola Anggota), DFD 2.2 (Verifikasi)
// =====================================================

export class MemberError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message)
    this.name = "MemberError"
  }
}

// =====================================================
// MemberService.verify — toggle atau set status anggota
//
// Jika targetStatus disertakan: set langsung ke nilai tersebut
// Jika tidak: toggle antara Aktif ↔ Nonaktif
// =====================================================
export async function verifyMember(
  idAnggota: string,
  targetStatus?: "Aktif" | "Nonaktif",
) {
  const exists = await db.anggota.findUnique({ where: { idAnggota } })
  if (!exists) throw new MemberError("Anggota tidak ditemukan", 404)

  const newStatus: "Aktif" | "Nonaktif" =
    targetStatus === "Aktif" || targetStatus === "Nonaktif"
      ? targetStatus
      : exists.statusAnggota === "Aktif"
        ? "Nonaktif"
        : "Aktif"

  return db.anggota.update({
    where: { idAnggota },
    data: { statusAnggota: newStatus },
    select: {
      idAnggota: true,
      namaAnggota: true,
      email: true,
      statusAnggota: true,
    },
  })
}

// =====================================================
// MemberService.getProfile — ambil profil anggota sendiri
// =====================================================
export async function getMemberProfile(idAnggota: string) {
  const anggota = await db.anggota.findUnique({
    where: { idAnggota },
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
  if (!anggota) throw new MemberError("Anggota tidak ditemukan", 404)
  return anggota
}
