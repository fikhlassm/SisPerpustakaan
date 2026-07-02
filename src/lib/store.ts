"use client"

import { create } from "zustand"
import type { SessionUser, AdminView, AnggotaView } from "./types"

// =====================================================
// Global client store (Zustand)
//  - auth: user sesi + status load
//  - admin view / anggota view: navigasi sisi client (route / saja)
// =====================================================

type AppState = {
  user: SessionUser | null
  loading: boolean
  setUser: (u: SessionUser | null) => void
  setLoading: (b: boolean) => void
  logout: () => Promise<void>

  adminView: AdminView
  setAdminView: (v: AdminView) => void

  anggotaView: AnggotaView
  setAnggotaView: (v: AnggotaView) => void
}

export const useApp = create<AppState>((set) => ({
  user: null,
  loading: true,
  setUser: (u) => set({ user: u }),
  setLoading: (b) => set({ loading: b }),

  logout: async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" })
      if (!res.ok) {
        // Server gagal menghapus sesi — tetap logout di client agar tidak stuck,
        // tapi log error supaya bisa diinvestigasi
        console.error("[logout] Server gagal menghapus sesi:", res.status)
      }
    } catch (err) {
      // Network error — tetap logout di client (UX lebih penting daripada sesi
      // server yang mungkin sudah kedaluwarsa sendiri setelah 7 hari)
      console.error("[logout] Network error saat logout:", err)
    } finally {
      // Reset state client apapun yang terjadi di server
      set({ user: null, adminView: "dashboard", anggotaView: "katalog" })
    }
  },

  adminView: "dashboard",
  setAdminView: (v) => set({ adminView: v }),

  anggotaView: "katalog",
  setAnggotaView: (v) => set({ anggotaView: v }),
}))

// Helper hooks
export function useIsAdmin() {
  return useApp((s) => s.user?.role === "admin")
}

export function useIsAnggota() {
  return useApp((s) => s.user?.role === "anggota")
}
