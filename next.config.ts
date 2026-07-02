import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",

  // TypeScript build errors sekarang aktif — tidak ada yang lolos ke production
  typescript: {
    ignoreBuildErrors: false,
  },

  // React Strict Mode aktif — mendeteksi side effects & anti-pattern lebih awal
  reactStrictMode: true,

  // Security headers untuk semua route
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Cegah browser meng-sniff content type
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Cegah clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Matikan XSS auditor lama (modern browser tidak perlu, tapi defensif)
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Jangan kirim Referer ke situs lain
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Batasi fitur browser sensitif
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // HSTS — paksa HTTPS (aktifkan di production, komentari untuk dev lokal jika perlu)
          // { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ]
  },
}

export default nextConfig
