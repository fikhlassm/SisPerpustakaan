import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import crypto from "crypto"

// =====================================================
// Sesi & Autentikasi (Ref: DFD 3.0, Use Case Login/Daftar)
// Pendekatan: signed cookie berisi payload JSON + HMAC-SHA256.
// Menggantikan Laravel Sanctum token pada stack asli.
// =====================================================

const SESSION_COOKIE = "perpus_session"
const SECRET = process.env.SESSION_SECRET || "perpustakaan-kelompok-9-secret-key-2026"

export type SessionUser = {
  id: string
  role: "admin" | "anggota"
  nama: string
  email: string
  username?: string
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex")
}

export async function createSession(user: SessionUser) {
  const payload = JSON.stringify({ ...user, iat: Date.now() })
  const encoded = Buffer.from(payload, "utf-8").toString("base64url")
  const signature = sign(encoded)
  const token = `${encoded}.${signature}`
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  })
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  const [encoded, signature] = token.split(".")
  if (!encoded || !signature) return null
  if (sign(encoded) !== signature) return null
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"))
    return {
      id: payload.id,
      role: payload.role,
      nama: payload.nama,
      email: payload.email,
      username: payload.username,
    }
  } catch {
    return null
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

export { hashPassword, verifyPassword }

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
