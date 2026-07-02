import { db } from "@/lib/db"
import { TARIF_DENDA_PERHARI } from "@/lib/api"

// =====================================================
// FineService — business logic untuk denda
//
// Ref: DFD 6.0 (Denda & Pengembalian)
// =====================================================

export class FineError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message)
    this.name = "FineError"
  }
}

// =====================================================
// FineService.calculate — hitung total denda dari jumlah hari telat
//
// Memisahkan rumus bisnis dari persistence layer sehingga
// mudah diubah (misal: tarif progresif) tanpa menyentuh DB query.
// =====================================================
export function calculateFine(hariTelat: number): {
  hariTelat: number
  tarifPerhari: number
  totalDenda: number
} {
  const total = Math.max(0, hariTelat) * TARIF_DENDA_PERHARI
  return {
    hariTelat: Math.max(0, hariTelat),
    tarifPerhari: TARIF_DENDA_PERHARI,
    totalDenda: total,
  }
}

// =====================================================
// FineService.markPaid — tandai denda sebagai lunas
// =====================================================
export async function markFinePaid(idDenda: number) {
  const denda = await db.denda.findUnique({ where: { idDenda } })
  if (!denda) throw new FineError("Denda tidak ditemukan", 404)
  if (denda.statusPembayaran === "Sudah Bayar") {
    throw new FineError("Denda sudah lunas", 409)
  }

  return db.denda.update({
    where: { idDenda },
    data: {
      statusPembayaran: "Sudah Bayar",
      tanggalPembayaran: new Date(),
    },
  })
}
