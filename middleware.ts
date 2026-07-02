import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// =====================================================
// Next.js Middleware — berjalan di edge runtime
//
// Tanggung jawab:
//   1. Tambahkan security headers ke semua response
//      (sebagai lapis kedua, next.config.ts sudah set headers statis)
//   2. Proteksi API routes:
//      - /api/auth/* → public (login, register, me, logout)
//      - /api/*      → butuh session cookie (cek keberadaan cookie saja,
//                       validasi HMAC tetap di getSession() per-route)
//
// Catatan: Middleware berjalan di Edge Runtime, tidak bisa import
//   bcrypt, Prisma, atau Node.js crypto. Cukup cek keberadaan cookie —
//   validasi penuh tetap di requireAdmin()/requireAnggota().
// =====================================================

// Route API yang boleh diakses tanpa sesi (public)
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/me",
  "/api/buku",         // katalog buku bisa dilihat tanpa login
  "/api/kategori",     // kategori publik untuk form registrasi
  "/api",              // health check route
]

const SESSION_COOKIE = "perpus_session"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const res = NextResponse.next()

  // Tambahkan security headers dinamis (melengkapi next.config.ts)
  res.headers.set("X-Content-Type-Options", "nosniff")
  res.headers.set("X-Frame-Options", "DENY")
  res.headers.set("X-XSS-Protection", "1; mode=block")
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // Hanya proteksi /api/* routes
  if (!pathname.startsWith("/api/")) {
    return res
  }

  // Izinkan public routes tanpa cek sesi
  const isPublic = PUBLIC_API_ROUTES.some((route) => {
    // Exact match atau prefix match untuk route dengan [id]
    return pathname === route || pathname.startsWith(route + "/") || pathname.startsWith(route + "?")
  })

  // /api/buku/[id] → public (detail buku)
  // /api/buku POST → perlu admin (tapi check ada di requireAdmin() per route, bukan di sini)
  // Middleware hanya blokir jika TIDAK ada cookie sama sekali
  if (isPublic) {
    return res
  }

  // Cek keberadaan session cookie
  const sessionCookie = req.cookies.get(SESSION_COOKIE)
  if (!sessionCookie?.value) {
    return NextResponse.json(
      { error: "Sesi tidak ditemukan. Silakan login terlebih dahulu." },
      { status: 401 },
    )
  }

  // Cookie ada → lanjut ke route handler (validasi penuh ada di getSession())
  return res
}

export const config = {
  // Jalankan middleware hanya untuk /api/* dan halaman utama
  // Kecualikan static assets dan Next.js internals
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|logo.svg).*)",
  ],
}
