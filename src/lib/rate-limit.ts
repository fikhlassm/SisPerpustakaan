// =====================================================
// In-memory rate limiter — untuk endpoint login
//
// Pendekatan: sliding window per IP.
//   - Catat timestamp setiap request
//   - Hapus entry yang lebih lama dari window
//   - Tolak jika jumlah request dalam window > max
//
// Catatan: in-memory, tidak persistent antar restart.
// Untuk production multi-instance, ganti dengan Redis.
// Untuk Phase 3/6 bisa di-upgrade ke upstash/redis.
// =====================================================

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Bersihkan entri lama setiap 5 menit agar store tidak membengkak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    // Hapus entry yang semua timestampnya sudah di luar window terpanjang (15 menit)
    entry.timestamps = entry.timestamps.filter((t) => now - t < 15 * 60 * 1000)
    if (entry.timestamps.length === 0) store.delete(key)
  }
}, CLEANUP_INTERVAL_MS)

export interface RateLimitOptions {
  /** Jumlah maksimal request yang diizinkan dalam satu window */
  max: number
  /** Durasi window dalam milidetik */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  /** Sisa request yang diizinkan dalam window saat ini */
  remaining: number
  /** Waktu reset dalam detik (epoch) */
  resetAt: number
}

/**
 * checkRateLimit — cek apakah key (biasanya IP) masih dalam batas rate limit.
 *
 * @param key - Identifier unik (IP address, user ID, dll.)
 * @param options - max dan windowMs
 *
 * @example
 * const ip = req.headers.get("x-forwarded-for") ?? "unknown"
 * const { allowed, remaining } = checkRateLimit(`login:${ip}`, { max: 5, windowMs: 60_000 })
 * if (!allowed) return fail("Terlalu banyak percobaan login. Coba lagi dalam 1 menit.", 429)
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const { max, windowMs } = options
  const now = Date.now()

  if (!store.has(key)) {
    store.set(key, { timestamps: [] })
  }

  const entry = store.get(key)!

  // Hapus timestamp yang sudah di luar window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)

  const count = entry.timestamps.length

  if (count >= max) {
    // Ambil timestamp tertua dalam window untuk hitung reset time
    const oldest = entry.timestamps[0]
    const resetAt = Math.ceil((oldest + windowMs) / 1000)
    return { allowed: false, remaining: 0, resetAt }
  }

  // Catat request ini
  entry.timestamps.push(now)

  return {
    allowed: true,
    remaining: max - entry.timestamps.length,
    resetAt: Math.ceil((now + windowMs) / 1000),
  }
}
