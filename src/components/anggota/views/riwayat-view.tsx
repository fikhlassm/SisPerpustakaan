"use client"

import { useEffect, useMemo, useState } from "react"
import { useApp } from "@/lib/store"
import { api, ApiError, formatDate, formatRupiah } from "@/lib/api-client"
import type { Peminjaman } from "@/lib/types"
import { PageHeader } from "@/components/shared/shell-layout"
import { EmptyState, StatusBadge } from "@/components/shared/ui-helpers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  History,
  CalendarDays,
  CalendarClock,
  CalendarCheck,
  BookText,
  CircleDollarSign,
} from "lucide-react"

type Filter = "all" | "Selesai" | "Dipinjam"

export function RiwayatView() {
  const user = useApp((s) => s.user)
  const setAnggotaView = useApp((s) => s.setAnggotaView)
  const myId = user?.id

  const [riwayat, setRiwayat] = useState<Peminjaman[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    if (!myId) return
    ;(async () => {
      try {
        const res = await api.get<Peminjaman[]>(`/api/peminjaman/anggota/${myId}`)
        if (mounted) {
          // newest first
          setRiwayat(
            [...res].sort(
              (a, b) =>
                new Date(b.tanggalPinjam).getTime() -
                new Date(a.tanggalPinjam).getTime(),
            ),
          )
        }
      } catch (err) {
        if (mounted) {
          toast.error(err instanceof ApiError ? err.message : "Gagal memuat riwayat")
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [myId])

  const filtered = useMemo(() => {
    return riwayat.filter((p) => {
      // active = Dipinjam OR has any Belum detail (covers in-progress returns)
      if (p.statusPinjam === "Dipinjam") {
        return true
      }
      return true
    })
  }, [riwayat])

  const byTab = (tab: Filter) => {
    if (tab === "all") return filtered
    return filtered.filter((p) => p.statusPinjam === tab)
  }

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Riwayat Peminjaman"
          description="Semua transaksi peminjaman Anda."
        />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (riwayat.length === 0) {
    return (
      <div>
        <PageHeader
          title="Riwayat Peminjaman"
          description="Semua transaksi peminjaman Anda."
        />
        <EmptyState
          icon={History}
          title="Belum ada riwayat peminjaman"
          description="Mulai pinjam buku dari katalog untuk melihat riwayat di sini."
          action={<Button onClick={() => setAnggotaView("katalog")}>Jelajah Katalog</Button>}
        />
      </div>
    )
  }

  const renderList = (items: Peminjaman[]) => {
    if (items.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-8">
          Tidak ada data pada tab ini.
        </p>
      )
    }
    return (
      <div className="space-y-4">
        {items.map((p) => {
          const totalDenda = (p.detail || []).reduce(
            (sum, d) => sum + (d.denda?.totalDenda || 0),
            0,
          )
          const hasDenda = totalDenda > 0
          const statusPembayaran =
            (p.detail || []).find((d) => d.denda)?.denda?.statusPembayaran
          return (
            <Card key={p.idPeminjaman}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-base">
                    ID: <span className="font-mono">{p.idPeminjaman}</span>
                  </CardTitle>
                  <StatusBadge status={p.statusPinjam} />
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  Pinjam: {formatDate(p.tanggalPinjam)}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border bg-card/50 p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="size-3" /> Tgl Pinjam
                    </p>
                    <p className="font-medium text-sm mt-1">
                      {formatDate(p.tanggalPinjam)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card/50 p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarClock className="size-3" /> Jatuh Tempo
                    </p>
                    <p className="font-medium text-sm mt-1">
                      {formatDate(p.tanggalJatuhTempo)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card/50 p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarCheck className="size-3" /> Tgl Kembali
                    </p>
                    <p className="font-medium text-sm mt-1">
                      {p.statusPinjam === "Selesai"
                        ? formatDate(
                            (p.detail || []).find((d) => d.tanggalKembali)
                              ?.tanggalKembali ?? null,
                          )
                        : "—"}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Books */}
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <BookText className="size-4 text-muted-foreground" />
                    Buku ({p.detail?.length ?? 0})
                  </p>
                  <div className="space-y-2">
                    {p.detail?.map((d) => (
                      <div
                        key={d.idDetail}
                        className="flex items-center justify-between gap-3 rounded-lg border bg-card/40 p-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {d.buku?.judulBuku || "—"}
                          </p>
                          {d.buku?.pengarang && (
                            <p className="text-xs text-muted-foreground truncate">
                              {d.buku.pengarang}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={d.statusKembali} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Denda */}
                {hasDenda && (
                  <>
                    <Separator />
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CircleDollarSign className="size-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-sm font-medium">Denda</span>
                        </div>
                        <span className="font-bold text-amber-700 dark:text-amber-400">
                          {formatRupiah(totalDenda)}
                        </span>
                      </div>
                      {statusPembayaran && (
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            Status Pembayaran
                          </span>
                          <StatusBadge status={statusPembayaran} />
                        </div>
                      )}
                      {statusPembayaran === "Belum Bayar" && (
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                          Bayar di loket perpustakaan.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Riwayat Peminjaman"
        description="Semua transaksi peminjaman Anda."
      />
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            Semua
            <Badge variant="secondary" className="ml-1.5">
              {filtered.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="Dipinjam">Dipinjam</TabsTrigger>
          <TabsTrigger value="Selesai">Selesai</TabsTrigger>
        </TabsList>
        <TabsContent value="all">{renderList(byTab("all"))}</TabsContent>
        <TabsContent value="Dipinjam">{renderList(byTab("Dipinjam"))}</TabsContent>
        <TabsContent value="Selesai">{renderList(byTab("Selesai"))}</TabsContent>
      </Tabs>
    </div>
  )
}
