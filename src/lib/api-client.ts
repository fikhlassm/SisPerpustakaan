"use client"

// =====================================================
// API client sisi client — wrapper fetch dengan error handling
// Hanya berisi HTTP client. Formatters dipindah ke lib/formatters.ts
// sehingga bisa diimport tanpa "use client" dari server code.
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

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
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

// Re-export formatters untuk backward compatibility — komponen lama yang
// sudah import dari api-client tidak perlu diupdate satu per satu
export {
  formatRupiah,
  formatDate,
  formatDateTime,
  hariTerlambat,
} from "@/lib/formatters"
