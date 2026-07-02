import { NextResponse } from "next/server"
import { AuthError } from "./auth"

// =====================================================
// Helper response & util API (menggantikan response helper Laravel)
// =====================================================

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status })
}

export function apiHandler(fn: (req: Request, ctx?: any) => Promise<NextResponse>) {
  return async (req: Request, ctx?: any) => {
    try {
      return await fn(req, ctx)
    } catch (e: any) {
      if (e instanceof AuthError) {
        return fail(e.message, e.status)
      }
      console.error("[API Error]", e)
      return fail(e?.message || "Terjadi kesalahan server", 500)
    }
  }
}

// =====================================================
// Generator ID terformat (ADM001, BK0001, AG0001, KTG001, PMJ0001, DTL0001)
// =====================================================

export function genId(prefix: string, num: number, width: number): string {
  return `${prefix}${String(num).padStart(width, "0")}`
}

export async function nextId(
  model: "admin" | "kategori" | "anggota" | "buku" | "peminjaman" | "detail",
  prefix: string,
  width = 4,
): Promise<string> {
  const { db } = await import("./db")
  let maxNum = 0
  if (model === "admin") {
    const rows = await db.admin.findMany({ select: { idAdmin: true } })
    maxNum = rows.reduce((m, r) => Math.max(m, parseInt(r.idAdmin.replace(prefix, "")) || 0), 0)
  } else if (model === "kategori") {
    const rows = await db.kategori.findMany({ select: { idKategori: true } })
    maxNum = rows.reduce((m, r) => Math.max(m, parseInt(r.idKategori.replace(prefix, "")) || 0), 0)
  } else if (model === "anggota") {
    const rows = await db.anggota.findMany({ select: { idAnggota: true } })
    maxNum = rows.reduce((m, r) => Math.max(m, parseInt(r.idAnggota.replace(prefix, "")) || 0), 0)
  } else if (model === "buku") {
    const rows = await db.buku.findMany({ select: { idBuku: true } })
    maxNum = rows.reduce((m, r) => Math.max(m, parseInt(r.idBuku.replace(prefix, "")) || 0), 0)
  } else if (model === "peminjaman") {
    const rows = await db.peminjaman.findMany({ select: { idPeminjaman: true } })
    maxNum = rows.reduce((m, r) => Math.max(m, parseInt(r.idPeminjaman.replace(prefix, "")) || 0), 0)
  } else if (model === "detail") {
    const rows = await db.detailPeminjaman.findMany({ select: { idDetail: true } })
    maxNum = rows.reduce((m, r) => Math.max(m, parseInt(r.idDetail.replace(prefix, "")) || 0), 0)
  }
  return genId(prefix, maxNum + 1, width)
}

// =====================================================
// Konstanta bisnis (Ref: DFD 6.0 — tarif denda)
// =====================================================
export const TARIF_DENDA_PERHARI = 2000 // Rp 2.000 / hari
export const LAMA_PINJAM_HARI = 7 // jatuh tempo = tanggal pinjam + 7 hari
export const MAKS_BUKU_PINJAM = 3 // maksimal buku per peminjaman
