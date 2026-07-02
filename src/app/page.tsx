"use client"

import { useEffect } from "react"
import { useApp } from "@/lib/store"
import { api } from "@/lib/api-client"
import type { SessionUser } from "@/lib/types"
import { AuthPage } from "@/components/auth/auth-page"
import { AdminShell } from "@/components/admin/admin-shell"
import { AnggotaShell } from "@/components/anggota/anggota-shell"
import { Loader2, Library } from "lucide-react"

export default function Home() {
  const { user, loading, setUser, setLoading } = useApp()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await api.get<{ user: SessionUser | null }>("/api/auth/me")
        if (mounted) setUser(res.user)
      } catch {
        if (mounted) setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [setUser, setLoading])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground">
          <Library className="size-7" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Memuat sistem perpustakaan…</span>
        </div>
      </div>
    )
  }

  if (!user) return <AuthPage />
  if (user.role === "admin") return <AdminShell />
  return <AnggotaShell />
}
