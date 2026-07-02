// =====================================================
// Shared formatters — dipakai di client components DAN server (API routes)
// Tidak ada "use client" directive — aman diimport dari mana saja
// =====================================================

/**
 * Format angka ke format Rupiah Indonesia
 * @example formatRupiah(2000) → "Rp 2.000"
 */
export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n)
}

/**
 * Format tanggal ke format lokal Indonesia (misal: "02 Jan 2026")
 */
export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "-"
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

/**
 * Format tanggal + waktu ke format lokal Indonesia (misal: "02 Jan 2026, 14:30")
 */
export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "-"
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Hitung jumlah hari keterlambatan dari tanggal jatuh tempo
 * @returns 0 jika belum terlambat, > 0 jika sudah terlambat
 */
export function hariTerlambat(jatuhTempo: string | Date): number {
  const j = typeof jatuhTempo === "string" ? new Date(jatuhTempo) : jatuhTempo
  const today = new Date()
  j.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diff = today.getTime() - j.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}
