"use client"

import { useEffect, useState } from "react"
import { api, ApiError, formatRupiah, formatDate } from "@/lib/api-client"
import type { Notifikasi } from "@/lib/types"
import { PageHeader } from "@/components/shared/shell-layout"
import { EmptyState } from "@/components/shared/ui-helpers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useApp } from "@/lib/store"
import {
  Bell,
  AlertTriangle,
  Clock,
  CircleDollarSign,
  RefreshCw,
  BookMarked,
  Calendar,
} from "lucide-react"

// =====================================================
// NotifikasiView — implementasi DFD 3.4.7 Proses Notifikasi (7.1-7.2)
//   7.1 Cek Jatuh Tempo           (baca D3 Data Peminjaman)
//   7.2 Kirim Notifikasi Jatuh Tempo (peringatan ke Anggota)
//   Use Case: "menerima notifikasi otomatis terkait jatuh tempo atau denda"
// =====================================================

export function NotifikasiView() {
  const setAnggotaView = useApp((s) => s.setAnggotaView)
  const [notifs, setNotifs] = useState<Notifikasi[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const data = await api.get<Notifikasi[]>("/api/notifikasi")
      setNotifs(data)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal memuat notifikasi"
      console.error(msg)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    setLoading(true)
    await load()
  }

  const dangerCount = notifs.filter((n) => n.level === "danger").length
  const warningCount = notifs.filter((n) => n.level === "warning").length

  return (
    <div>
      <PageHeader
        title="Notifikasi"
        description="Peringatan jatuh tempo, keterlambatan, dan denda yang perlu Anda perhatikan."
        action={
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`size-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Segarkan
          </Button>
        }
      />

      {/* Summary cards */}
      {!loading && notifs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dangerCount}</p>
                <p className="text-xs text-muted-foreground">Perlu Tindakan</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{warningCount}</p>
                <p className="text-xs text-muted-foreground">Mendekati Jatuh Tempo</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Bell className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifs.length}</p>
                <p className="text-xs text-muted-foreground">Total Notifikasi</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Notification list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-start gap-3">
                <Skeleton className="size-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <Card>
          <CardContent className="py-2">
            <EmptyState
              icon={Bell}
              title="Tidak ada notifikasi"
              description="Anda tidak memiliki peminjaman yang jatuh tempo, terlambat, maupun denda tertunggak. Terima kasih telah tertib mengembalikan buku."
              action={
                <Button onClick={() => setAnggotaView("katalog")}>
                  <BookMarked className="size-4 mr-1.5" />
                  Jelajah Katalog
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifs.map((n) => (
            <NotifCard key={n.id} notif={n} onViewStatus={() => setAnggotaView("status")} />
          ))}
        </div>
      )}
    </div>
  )
}

function NotifCard({
  notif,
  onViewStatus,
}: {
  notif: Notifikasi
  onViewStatus: () => void
}) {
  const config = {
    danger: {
      border: "border-red-500/30",
      bg: "bg-red-500/5",
      iconBg: "bg-red-500/10 text-red-600 dark:text-red-400",
      badge: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      label: "Mendesak",
    },
    warning: {
      border: "border-amber-500/30",
      bg: "bg-amber-500/5",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      label: "Peringatan",
    },
    info: {
      border: "border-primary/30",
      bg: "bg-primary/5",
      iconBg: "bg-primary/10 text-primary",
      badge: "bg-primary/10 text-primary border-primary/20",
      label: "Info",
    },
  }[notif.level]

  const icon = {
    jatuh_tempo: <Clock className="size-5" />,
    terlambat: <AlertTriangle className="size-5" />,
    denda: <CircleDollarSign className="size-5" />,
  }[notif.jenis]

  return (
    <Card className={`${config.border} ${config.bg}`}>
      <CardContent className="p-4 flex items-start gap-4">
        <div className={`size-10 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm leading-snug">{notif.judul}</h3>
            <Badge variant="outline" className={`${config.badge} shrink-0`}>
              {config.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{notif.pesan}</p>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookMarked className="size-3.5" />
              ID Peminjaman: <span className="font-mono">{notif.idPeminjaman}</span>
            </span>
            {notif.tanggalJatuhTempo && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                Jatuh Tempo: {formatDate(notif.tanggalJatuhTempo)}
              </span>
            )}
            {notif.totalDenda !== undefined && (
              <span className="flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                <CircleDollarSign className="size-3.5" />
                {formatRupiah(notif.totalDenda)}
              </span>
            )}
          </div>
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={onViewStatus}>
              Lihat Peminjaman Aktif
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
