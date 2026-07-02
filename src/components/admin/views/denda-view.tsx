"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { api, ApiError, formatDate, formatRupiah } from "@/lib/api-client"
import type { Denda } from "@/lib/types"
import { PageHeader } from "@/components/shared/shell-layout"
import { EmptyState, StatCard, StatusBadge } from "@/components/shared/ui-helpers"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  CircleDollarSign,
  Wallet,
  CheckCircle2,
  Check,
  Clock,
  RotateCcw,
  Receipt,
} from "lucide-react"

type StatusFilter = "Semua" | "Belum Bayar" | "Sudah Bayar"

export function DendaView() {
  const [data, setData] = useState<Denda[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusFilter>("Semua")
  const [refresh, setRefresh] = useState(0)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (status !== "Semua") params.set("status", status)
    api
      .get<Denda[]>(`/api/denda?${params.toString()}`)
      .then((res) => {
        if (active) setData(res)
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof ApiError ? e.message : "Gagal memuat data denda")
          setData([])
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [status, refresh])

  // Statistik dihitung dari seluruh denda (tanpa filter) — fetch ulang ringan saat filter tidak "Semua"
  const [allDenda, setAllDenda] = useState<Denda[]>([])
  useEffect(() => {
    api
      .get<Denda[]>(`/api/denda`)
      .then(setAllDenda)
      .catch(() => {
        /* statistik opsional, abaikan */
      })
  }, [refresh])

  const summary = useMemo(() => {
    const total = allDenda.length
    const belum = allDenda.filter((d) => d.statusPembayaran === "Belum Bayar")
    const sudah = allDenda.filter((d) => d.statusPembayaran === "Sudah Bayar")
    const sumBelum = belum.reduce((s, d) => s + d.totalDenda, 0)
    return {
      total,
      belumCount: belum.length,
      belumSum: sumBelum,
      sudahCount: sudah.length,
    }
  }, [allDenda])

  async function handleBayar(id: number) {
    setSubmitting(true)
    try {
      await api.patch<Denda>(`/api/denda/${id}/bayar`)
      toast.success("Denda berhasil ditandai lunas")
      setConfirmId(null)
      setRefresh((n) => n + 1)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal memproses pembayaran denda"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Denda" description="Kelola pembayaran denda keterlambatan." />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={CircleDollarSign}
          label="Total Denda"
          value={summary.total}
          hint="Seluruh catatan denda"
          loading={loading && allDenda.length === 0}
        />
        <StatCard
          icon={Wallet}
          label="Belum Lunas"
          value={summary.belumCount}
          hint={summary.belumSum > 0 ? `${formatRupiah(summary.belumSum)} tertunggak` : "Tidak ada tunggakan"}
          tone="danger"
          loading={loading && allDenda.length === 0}
        />
        <StatCard
          icon={CheckCircle2}
          label="Sudah Lunas"
          value={summary.sudahCount}
          hint="Denda telah dibayar"
          tone="success"
          loading={loading && allDenda.length === 0}
        />
      </div>

      {/* Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Filter status denda">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Semua">Semua Status</SelectItem>
              <SelectItem value="Belum Bayar">Belum Bayar</SelectItem>
              <SelectItem value="Sudah Bayar">Sudah Bayar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <Card className="p-0">
          <div className="p-4 space-y-3">
            <Skeleton className="h-8 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      )}

      {!loading && !error && data.length === 0 && (
        <Card className="p-0">
          <EmptyState
            icon={CircleDollarSign}
            title="Belum ada catatan denda"
            description="Tidak ada denda yang sesuai dengan filter saat ini."
          />
        </Card>
      )}

      {!loading && !error && data.length > 0 && (
        <Card className="p-0">
          <div className="max-h-[32rem] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="pl-4">ID Denda</TableHead>
                  <TableHead>Anggota</TableHead>
                  <TableHead>Buku</TableHead>
                  <TableHead className="text-center">Hari Telat</TableHead>
                  <TableHead className="text-right">Tarif/Hari</TableHead>
                  <TableHead className="text-right">Total Denda</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tgl Pembayaran</TableHead>
                  <TableHead className="text-right pr-4">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => {
                  const anggota = d.detailPeminjaman?.peminjaman?.anggota
                  const buku = d.detailPeminjaman?.buku
                  const lunas = d.statusPembayaran === "Sudah Bayar"
                  return (
                    <TableRow key={d.idDenda}>
                      <TableCell className="pl-4 font-mono text-xs">#{d.idDenda}</TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {anggota?.namaAnggota ?? "-"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {anggota?.idAnggota ?? ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm truncate max-w-[16rem] inline-block align-bottom">
                          {buku?.judulBuku ?? "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-sm">
                          <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
                          {d.jumlahHariTelat}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatRupiah(d.tarifPerhari)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {formatRupiah(d.totalDenda)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={d.statusPembayaran} />
                      </TableCell>
                      <TableCell>
                        {lunas && d.tanggalPembayaran ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                            {formatDate(d.tanggalPembayaran)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        {lunas ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <Receipt className="size-3.5" />
                            Lunas
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-primary/30 text-primary hover:bg-primary/10"
                            onClick={() => setConfirmId(d.idDenda)}
                          >
                            <Check className="size-4 mr-1.5" />
                            Tandai Lunas
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Confirm dialog */}
      <AlertDialog open={confirmId !== null} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tandai Denda Lunas</AlertDialogTitle>
            <AlertDialogDescription>
              Konfirmasi pembayaran denda. Setelah ditandai lunas, status akan berubah menjadi
              &ldquo;Sudah Bayar&rdquo; dan tanggal pembayaran akan dicatat. Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={(e) => {
                e.preventDefault()
                if (confirmId !== null) handleBayar(confirmId)
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {submitting ? (
                <>
                  <RotateCcw className="size-4 mr-1.5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Check className="size-4 mr-1.5" />
                  Ya, Tandai Lunas
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
