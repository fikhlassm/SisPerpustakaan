"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { api, ApiError } from "@/lib/api-client"

export type FetchState<T> =
  | { status: "idle"; data: null; error: null; loading: false }
  | { status: "loading"; data: null; error: null; loading: true }
  | { status: "success"; data: T; error: null; loading: false }
  | { status: "error"; data: null; error: string; loading: false }

/**
 * useFetch<T> — hook generik untuk data fetching dengan loading/error state.
 *
 * Menghilangkan pola duplikat berikut yang sebelumnya ada di 12+ komponen:
 *   const [data, setData] = useState<T[]>([])
 *   const [loading, setLoading] = useState(true)
 *   const [error, setError] = useState<string | null>(null)
 *   useEffect(() => { ... api.get().then().catch().finally() ... }, [])
 *
 * @param url - URL endpoint API, atau null untuk menonaktifkan fetch
 * @param deps - Dependency array tambahan yang men-trigger refetch (default: [])
 *
 * @example
 * const { data, loading, error, refetch } = useFetch<Buku[]>("/api/buku")
 * const { data } = useFetch<Anggota[]>(`/api/anggota?status=${filter}`, [filter])
 */
export function useFetch<T>(url: string | null, deps: unknown[] = []) {
  const [state, setState] = useState<FetchState<T>>({
    status: "idle",
    data: null,
    error: null,
    loading: false,
  })
  // Ref untuk membatalkan update state setelah komponen unmount
  const mountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    if (!url) return

    setState({ status: "loading", data: null, error: null, loading: true })

    try {
      const data = await api.get<T>(url)
      if (mountedRef.current) {
        setState({ status: "success", data, error: null, loading: false })
      }
    } catch (err) {
      if (mountedRef.current) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Terjadi kesalahan. Coba lagi."
        setState({ status: "error", data: null, error: message, loading: false })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps])

  useEffect(() => {
    mountedRef.current = true
    fetchData()
    return () => {
      mountedRef.current = false
    }
  }, [fetchData])

  return {
    ...state,
    /** Panggil refetch() untuk memuat ulang data secara manual */
    refetch: fetchData,
  }
}
