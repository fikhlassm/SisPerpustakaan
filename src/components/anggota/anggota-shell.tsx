"use client"

import { useEffect, useState } from "react"
import { useApp } from "@/lib/store"
import { ShellLayout } from "@/components/shared/shell-layout"
import type { AnggotaView, Notifikasi } from "@/lib/types"
import { api } from "@/lib/api-client"
import {
  BookOpen,
  BookMarked,
  History,
  CircleDollarSign,
  UserCircle,
  LogOut,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { KatalogView } from "./views/katalog-view"
import { StatusView } from "./views/status-view"
import { RiwayatView } from "./views/riwayat-view"
import { DendaView } from "./views/denda-view"
import { NotifikasiView } from "./views/notifikasi-view"
import { ProfilView } from "./views/profil-view"

const NAV = [
  { key: "katalog", label: "Katalog Buku", icon: <BookOpen className="size-4" /> },
  { key: "status", label: "Peminjaman Aktif", icon: <BookMarked className="size-4" /> },
  { key: "riwayat", label: "Riwayat Pinjam", icon: <History className="size-4" /> },
  { key: "denda", label: "Denda Saya", icon: <CircleDollarSign className="size-4" /> },
  { key: "notifikasi", label: "Notifikasi", icon: <Bell className="size-4" /> },
  { key: "profil", label: "Profil Saya", icon: <UserCircle className="size-4" /> },
]

export function AnggotaShell() {
  const { user, anggotaView, setAnggotaView, logout } = useApp()
  const [notifCount, setNotifCount] = useState(0)
  const [notifPreview, setNotifPreview] = useState<Notifikasi[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)

  // Fetch notifikasi count untuk badge bell (poll setiap 60 detik)
  async function loadNotifCount() {
    try {
      const data = await api.get<Notifikasi[]>("/api/notifikasi")
      setNotifCount(data.length)
      setNotifPreview(data.slice(0, 5))
    } catch {
      // silent fail
    }
  }

  useEffect(() => {
    let mounted = true
    async function init() {
      if (!mounted) return
      await loadNotifCount()
    }
    init()
    const interval = setInterval(() => {
      loadNotifCount()
    }, 60000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  // Saat bell dibuka, refresh preview
  async function handleBellOpen(open: boolean) {
    setBellOpen(open)
    if (open) {
      setNotifLoading(true)
      await loadNotifCount()
      setNotifLoading(false)
    }
  }

  return (
    <ShellLayout
      navItems={NAV}
      currentView={anggotaView}
      onChangeView={(v) => setAnggotaView(v as AnggotaView)}
      headerRight={
        <div className="flex items-center gap-3">
          {/* Notifikasi bell (Ref: DFD 7.1-7.2) */}
          <Popover open={bellOpen} onOpenChange={handleBellOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifikasi">
                <Bell className="size-5" />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <Bell className="size-4" />
                  Notifikasi
                </p>
                {notifCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {notifCount} baru
                  </Badge>
                )}
              </div>
              <ScrollArea className="max-h-80">
                {notifLoading ? (
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : notifPreview.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    <Bell className="size-8 mx-auto mb-2 opacity-40" />
                    Tidak ada notifikasi
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifPreview.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          setBellOpen(false)
                          setAnggotaView("notifikasi")
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-accent transition-colors block"
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`size-2 rounded-full mt-1.5 shrink-0 ${
                              n.level === "danger"
                                ? "bg-red-500"
                                : n.level === "warning"
                                  ? "bg-amber-500"
                                  : "bg-primary"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-snug truncate">
                              {n.judul}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {n.pesan}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {notifCount > 0 && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setBellOpen(false)
                      setAnggotaView("notifikasi")
                    }}
                  >
                    Lihat Semua Notifikasi
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <Badge variant="secondary" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Anggota
          </Badge>
          <span className="text-sm text-muted-foreground hidden sm:inline">{user?.nama}</span>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="size-4 mr-1.5" />Keluar
          </Button>
        </div>
      }
      footer={
        <footer className="border-t bg-card/50 px-6 py-4 text-center text-xs text-muted-foreground">
          Sistem Informasi Peminjaman Buku Perpustakaan · Kelompok 9 · S1 Sistem Informasi UNAIR 2026
        </footer>
      }
    >
      {anggotaView === "katalog" && <KatalogView />}
      {anggotaView === "status" && <StatusView />}
      {anggotaView === "riwayat" && <RiwayatView />}
      {anggotaView === "denda" && <DendaView />}
      {anggotaView === "notifikasi" && <NotifikasiView />}
      {anggotaView === "profil" && <ProfilView />}
    </ShellLayout>
  )
}
