"use client"

// =====================================================
// API client sisi client — wrapper fetch dengan error handling
// Menggantikan axios instance pada stack asli
// =====================================================

export class ApiError extends Error {
  status: number
  details?: unknown
  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "same-origin",
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    throw new ApiError(data?.error || "Terjadi kesalahan", res.status, data?.details)
  }
  return data as T
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: "GET" }),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(url: string) => request<T>(url, { method: "DELETE" }),
}

// =====================================================
// Formatter
// =====================================================
export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n)
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "-"
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

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

export function hariTerlambat(jatuhTempo: string | Date): number {
  const j = typeof jatuhTempo === "string" ? new Date(jatuhTempo) : jatuhTempo
  const today = new Date()
  j.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diff = today.getTime() - j.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}
