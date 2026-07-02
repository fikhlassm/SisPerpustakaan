"use client"

import { useApp } from "@/lib/store"
import { ShellLayout } from "@/components/shared/shell-layout"
import type { AdminView } from "@/lib/types"
import {
  LayoutDashboard,
  BookCopy,
  Tags,
  Users,
  ArrowRightLeft,
  Undo2,
  CircleDollarSign,
  FileBarChart,
} from "lucide-react"
import { DashboardView } from "./views/dashboard-view"
import { BukuView } from "./views/buku-view"
import { KategoriView } from "./views/kategori-view"
import { AnggotaView } from "./views/anggota-view"
import { PeminjamanView } from "./views/peminjaman-view"
import { PengembalianView } from "./views/pengembalian-view"
import { DendaView } from "./views/denda-view"
import { LaporanView } from "./views/laporan-view"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut } from "lucide-react"

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
  { key: "buku", label: "Kelola Buku", icon: <BookCopy className="size-4" /> },
  { key: "kategori", label: "Kategori", icon: <Tags className="size-4" /> },
  { key: "anggota", label: "Kelola Anggota", icon: <Users className="size-4" /> },
  { key: "peminjaman", label: "Kelola Peminjaman", icon: <ArrowRightLeft className="size-4" /> },
  { key: "pengembalian", label: "Pengembalian", icon: <Undo2 className="size-4" /> },
  { key: "denda", label: "Denda", icon: <CircleDollarSign className="size-4" /> },
  { key: "laporan", label: "Laporan", icon: <FileBarChart className="size-4" /> },
]

export function AdminShell() {
  const { user, adminView, setAdminView, logout } = useApp()

  return (
    <ShellLayout
      navItems={NAV}
      currentView={adminView}
      onChangeView={(v) => setAdminView(v as AdminView)}
      headerRight={
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Admin
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
      {adminView === "dashboard" && <DashboardView />}
      {adminView === "buku" && <BukuView />}
      {adminView === "kategori" && <KategoriView />}
      {adminView === "anggota" && <AnggotaView />}
      {adminView === "peminjaman" && <PeminjamanView />}
      {adminView === "pengembalian" && <PengembalianView />}
      {adminView === "denda" && <DendaView />}
      {adminView === "laporan" && <LaporanView />}
    </ShellLayout>
  )
}
