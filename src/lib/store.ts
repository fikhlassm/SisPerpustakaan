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

export const useApp = create<AppState>((set, get) => ({
  user: null,
  loading: true,
  setUser: (u) => set({ user: u }),
  setLoading: (b) => set({ loading: b }),

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    set({ user: null, adminView: "dashboard", anggotaView: "katalog" })
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
