import { useEffect, useState } from "react"

/**
 * useDebounce — menunda update nilai hingga `delay` ms berlalu tanpa perubahan.
 *
 * Sebelumnya logika ini duplikat di 4 komponen:
 *   buku-view.tsx, anggota-view.tsx, peminjaman-view.tsx, katalog-view.tsx
 *
 * @param value - Nilai yang ingin di-debounce
 * @param delay - Waktu tunda dalam milidetik (default: 300ms)
 * @returns Nilai yang sudah di-debounce
 *
 * @example
 * const debouncedSearch = useDebounce(searchQuery, 400)
 * useEffect(() => { fetchData(debouncedSearch) }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
