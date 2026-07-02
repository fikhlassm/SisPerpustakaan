// =====================================================
// constants.ts — konstanta domain & UI yang dipakai di seluruh app
//
// Memisahkan nilai bisnis dari komponen UI sehingga:
//  - Menambah status baru cukup di satu tempat
//  - Tidak ada "magic string" tersebar di komponen
// =====================================================

// ---------------------------------------------------
// Business constants (mirror dari lib/api.ts untuk client)
// Nilai definitif tetap di lib/api.ts (server), ini untuk client components
// ---------------------------------------------------
export const TARIF_DENDA_PERHARI = 2000   // Rp 2.000/hari
export const LAMA_PINJAM_HARI = 7         // 7 hari batas pinjam
export const MAKS_BUKU_PINJAM = 3         // maks 3 buku per peminjaman

// ---------------------------------------------------
// StatusBadge color map — dipindah dari ui-helpers.tsx
// Key = nilai status dari database, Value = Tailwind classes
// ---------------------------------------------------
export const STATUS_BADGE_CLASSES: Record<string, string> = {
  // Anggota
  Aktif:       "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  Nonaktif:    "bg-muted text-muted-foreground border-border",
  // Peminjaman
  Dipinjam:    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  Selesai:     "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  // Detail peminjaman (status kembali)
  Belum:       "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  Sudah:       "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  // Denda
  "Belum Bayar": "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  "Sudah Bayar": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
} as const

// Fallback jika status tidak dikenal
export const STATUS_BADGE_FALLBACK = "bg-muted text-muted-foreground border-border"

// ---------------------------------------------------
// Jenis kelamin labels
// ---------------------------------------------------
export const JENIS_KELAMIN_LABEL: Record<string, string> = {
  L: "Laki-laki",
  P: "Perempuan",
} as const
