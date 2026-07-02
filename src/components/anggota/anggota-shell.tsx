"use client"

import { useApp } from "@/lib/store"
import { ShellLayout } from "@/components/shared/shell-layout"
import type { AnggotaView } from "@/lib/types"
import {
  BookOpen,
  BookMarked,
  History,
  CircleDollarSign,
  UserCircle,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KatalogView } from "./views/katalog-view"
import { StatusView } from "./views/status-view"
import { RiwayatView } from "./views/riwayat-view"
import { DendaView } from "./views/denda-view"
import { ProfilView } from "./views/profil-view"

const NAV = [
  { key: "katalog", label: "Katalog Buku", icon: <BookOpen className="size-4" /> },
  { key: "status", label: "Peminjaman Aktif", icon: <BookMarked className="size-4" /> },
  { key: "riwayat", label: "Riwayat Pinjam", icon: <History className="size-4" /> },
  { key: "denda", label: "Denda Saya", icon: <CircleDollarSign className="size-4" /> },
  { key: "profil", label: "Profil Saya", icon: <UserCircle className="size-4" /> },
]

export function AnggotaShell() {
  const { user, anggotaView, setAnggotaView, logout } = useApp()

  return (
    <ShellLayout
      navItems={NAV}
      currentView={anggotaView}
      onChangeView={(v) => setAnggotaView(v as AnggotaView)}
      headerRight={
        <div className="flex items-center gap-3">
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
      {anggotaView === "profil" && <ProfilView />}
    </ShellLayout>
  )
}
