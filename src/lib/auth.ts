import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import crypto from "crypto"

// =====================================================
// Sesi & Autentikasi (Ref: DFD 3.0, Use Case Login/Daftar)
// Pendekatan: signed cookie berisi payload JSON + HMAC-SHA256.
// =====================================================

const SESSION_COOKIE = "perpus_session"
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 hari dalam milidetik

// SECRET wajib diset via environment variable.
// Jika tidak diset, aplikasi langsung crash — lebih baik fail-fast daripada
// diam-diam menggunakan kunci publik yang diketahui semua orang.
function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error(
      "[auth] SESSION_SECRET tidak ditemukan di environment variables. " +
        "Set SESSION_SECRET di file .env Anda. " +
        "Generate dengan: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"",
    )
  }
  if (secret.length < 32) {
    throw new Error(
      "[auth] SESSION_SECRET terlalu pendek (minimal 32 karakter). " +
        "Gunakan string acak yang panjang.",
    )
  }
  return secret
}

export type SessionUser = {
  id: string
  role: "admin" | "anggota"
  nama: string
  email: string
  username?: string
}

// Payload internal yang disimpan di cookie (termasuk metadata keamanan)
type SessionPayload = SessionUser & {
  iat: number // issued at — unix timestamp ms
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex")
}

export async function createSession(user: SessionUser) {
  const payload: SessionPayload = { ...user, iat: Date.now() }
  const encoded = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url")
  const signature = sign(encoded)
  const token = `${encoded}.${signature}`
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000, // cookie maxAge dalam detik
  })
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const dotIndex = token.lastIndexOf(".")
  if (dotIndex === -1) return null
  const encoded = token.slice(0, dotIndex)
  const signature = token.slice(dotIndex + 1)

  // Verifikasi signature
  if (sign(encoded) !== signature) return null

  let payload: SessionPayload
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"))
  } catch {
    return null
  }

  // Verifikasi expiry — tolak sesi yang sudah kedaluwarsa
  if (!payload.iat || Date.now() - payload.iat > SESSION_MAX_AGE_MS) {
    return null
  }

  return {
    id: payload.id,
    role: payload.role,
    nama: payload.nama,
    email: payload.email,
    username: payload.username,
  }
}

export async function destroySession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new AuthError("Akses ditolak. Hanya admin.", 401)
  }
  return session
}

export async function requireAnggota(): Promise<SessionUser> {
  const session = await getSession()
  if (!session || session.role !== "anggota") {
    throw new AuthError("Akses ditolak. Silakan login sebagai anggota.", 401)
  }
  return session
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    throw new AuthError("Akses ditolak. Silakan login.", 401)
  }
  return session
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
