"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { api, ApiError, formatDate, formatRupiah, hariTerlambat } from "@/lib/api-client"
import type { Peminjaman } from "@/lib/types"
import { PageHeader } from "@/components/shared/shell-layout"
import { EmptyState, StatusBadge } from "@/components/shared/ui-helpers"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowRightLeft,
  BookCopy,
  CalendarClock,
  Mail,
  Search,
  User,
  AlertTriangle,
  Undo2,
  Clock,
} from "lucide-react"
import { useApp } from "@/lib/store"

type StatusFilter = "Semua" | "Dipinjam" | "Selesai"

export function PeminjamanView() {
  const { setAdminView } = useApp()
  const [data, setData] = useState<Peminjaman[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusFilter>("Semua")
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [refresh, setRefresh] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search input 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebounced(search), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  useEffect(() => {
    let active = true
    const params = new URLSearchParams()
    if (status !== "Semua") params.set("status", status)
    if (debounced.trim()) params.set("q", debounced.trim())

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get<Peminjaman[]>(`/api/peminjaman?${params.toString()}`)
        if (active) setData(res)
      } catch (e) {
        if (active) {
          setError(e instanceof ApiError ? e.message : "Gagal memuat data peminjaman")
          setData([])
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [status, debounced, refresh])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Peminjaman"
        description="Pantau seluruh transaksi peminjaman buku."
      />

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari ID peminjaman atau nama anggota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Cari peminjaman"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Filter status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Semua">Semua Status</SelectItem>
              <SelectItem value="Dipinjam">Dipinjam</SelectItem>
              <SelectItem value="Selesai">Selesai</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-4 w-48 mt-3" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && data.length === 0 && (
        <Card className="p-0">
          <EmptyState
            icon={ArrowRightLeft}
            title="Belum ada peminjaman"
            description="Tidak ada data peminjaman yang cocok dengan filter saat ini."
          />
        </Card>
      )}

      {/* List */}
      {!loading && !error && data.length > 0 && (
        <div className="space-y-4">
          {data.map((p) => (
            <PeminjamanCard key={p.idPeminjaman} peminjaman={p} onGoToPengembalian={() => setAdminView("pengembalian")} />
          ))}
        </div>
      )}
    </div>
  )
}

function PeminjamanCard({
  peminjaman,
  onGoToPengembalian,
}: {
  peminjaman: Peminjaman
  onGoToPengembalian: () => void
}) {
  const details = peminjaman.detail ?? []
  const adaBelum = details.some((d) => d.statusKembali === "Belum")
  const sedangDipinjam = peminjaman.statusPinjam === "Dipinjam"
  const telat = sedangDipinjam && adaBelum ? hariTerlambat(peminjaman.tanggalJatuhTempo) : 0

  return (
    <Card className="p-5 gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold">{peminjaman.idPeminjaman}</span>
            <StatusBadge status={peminjaman.statusPinjam} />
            {telat > 0 && (
              <Badge
                variant="outline"
                className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                <AlertTriangle className="size-3" />
                Terlambat {telat} hari
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" />
            <span>
              {formatDate(peminjaman.tanggalPinjam)} → {formatDate(peminjaman.tanggalJatuhTempo)}
            </span>
          </div>
        </div>

        {/* Anggota */}
        <div className="sm:text-right text-sm">
          <div className="flex sm:justify-end items-center gap-1.5 font-medium">
            <User className="size-3.5 text-muted-foreground" />
            <span className="truncate">{peminjaman.anggota?.namaAnggota ?? "-"}</span>
          </div>
          {peminjaman.anggota?.email && (
            <div className="flex sm:justify-end items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Mail className="size-3" />
              <span className="truncate">{peminjaman.anggota.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Detail list */}
      <div className="rounded-lg border divide-y">
        {details.map((d) => (
          <div
            key={d.idDetail}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BookCopy className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{d.buku?.judulBuku ?? "Buku tidak diketahui"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {d.buku?.pengarang || "—"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:shrink-0 pl-11 sm:pl-0">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" />
                {d.statusKembali === "Sudah"
                  ? `Dikembalikan ${formatDate(d.tanggalKembali)}`
                  : "Belum dikembalikan"}
              </span>
              <StatusBadge status={d.statusKembali} />
              {d.denda && (
                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                  Denda: {formatRupiah(d.denda.totalDenda)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer alert for active loans with pending returns */}
      {sedangDipinjam && adaBelum && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-amber-800 dark:text-amber-300">
              Menunggu pengembalian
              {telat > 0 ? ` · sudah terlambat ${telat} hari` : ""}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
            onClick={onGoToPengembalian}
          >
            <Undo2 className="size-4 mr-1.5" />
            Proses di menu Pengembalian
          </Button>
        </div>
      )}
    </Card>
  )
}
