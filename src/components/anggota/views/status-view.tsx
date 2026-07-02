"use client"

import { useCallback, useEffect, useState } from "react"
import { useApp } from "@/lib/store"
import { api, ApiError, formatDate, hariTerlambat, formatRupiah } from "@/lib/api-client"
import type { Peminjaman } from "@/lib/types"
import { PageHeader } from "@/components/shared/shell-layout"
import { EmptyState, StatusBadge } from "@/components/shared/ui-helpers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  BookMarked,
  RotateCw,
  CalendarClock,
  CalendarDays,
  Info,
  AlertTriangle,
  BookText,
} from "lucide-react"

export function StatusView() {
  const user = useApp((s) => s.user)
  const setAnggotaView = useApp((s) => s.setAnggotaView)
  const myId = user?.id

  const [active, setActive] = useState<Peminjaman | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchActive = useCallback(async () => {
    if (!myId) return
    setRefreshing(true)
    try {
      const res = await api.get<Peminjaman[]>(`/api/peminjaman/anggota/${myId}`)
      const found = res.find((p) => p.statusPinjam === "Dipinjam") || null
      setActive(found)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal memuat peminjaman aktif")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [myId])

  useEffect(() => {
    fetchActive()
  }, [fetchActive])

  const telat = active ? hariTerlambat(active.tanggalJatuhTempo) : 0
  const isOverdue = telat > 0

  return (
    <div>
      <PageHeader
        title="Peminjaman Aktif"
        description="Buku yang sedang Anda pinjam saat ini."
        action={
          <Button variant="outline" size="sm" onClick={fetchActive} disabled={refreshing}>
            <RotateCw className={`size-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Segarkan
          </Button>
        }
      />

      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      ) : !active ? (
        <EmptyState
          icon={BookMarked}
          title="Tidak ada peminjaman aktif"
          description="Anda belum meminjam buku apa pun saat ini."
          action={
            <Button onClick={() => setAnggotaView("katalog")}>
              Jelajah Katalog
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  ID Peminjaman:{" "}
                  <span className="font-mono">{active.idPeminjaman}</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  Dipinjam: {formatDate(active.tanggalPinjam)}
                </p>
              </div>
              <StatusBadge status={active.statusPinjam} />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Jatuh tempo */}
            <div
              className={`rounded-xl border p-4 ${
                isOverdue
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-primary/20 bg-primary/5"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isOverdue
                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <CalendarClock className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">
                    Tanggal Jatuh Tempo
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      isOverdue
                        ? "text-red-600 dark:text-red-400"
                        : "text-foreground"
                    }`}
                  >
                    {formatDate(active.tanggalJatuhTempo)}
                  </p>
                  {isOverdue ? (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Terlambat {telat} hari — denda {formatRupiah(2000)}/hari berjalan
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      Kembalikan buku sebelum tanggal ini.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {isOverdue && (
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertTitle>Peminjaman Terlambat</AlertTitle>
                <AlertDescription>
                  Anda telat {telat} hari. Denda keterlambatan berjalan Rp2.000/hari.
                  Segera kembalikan buku ke perpustakaan.
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            {/* Book list */}
            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <BookText className="size-4 text-muted-foreground" />
                Daftar Buku ({active.detail?.length ?? 0})
              </p>
              <div className="space-y-2">
                {active.detail?.map((d) => (
                  <div
                    key={d.idDetail}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card/50 p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {d.buku?.judulBuku || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {d.buku?.pengarang}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                    >
                      Belum dikembalikan
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <Alert>
              <Info className="size-4" />
              <AlertTitle>Informasi Pengembalian</AlertTitle>
              <AlertDescription>
                Pengembalian diproses oleh admin di perpustakaan. Hubungi petugas jika
                buku sudah dikembalikan namun status belum berubah.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
