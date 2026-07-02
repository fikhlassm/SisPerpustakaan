"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { api, ApiError, formatDate, formatRupiah, hariTerlambat } from "@/lib/api-client"
import type { Peminjaman, DetailPeminjaman, Denda } from "@/lib/types"
import { PageHeader } from "@/components/shared/shell-layout"
import { EmptyState, StatusBadge } from "@/components/shared/ui-helpers"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
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
  Undo2,
  BookCopy,
  CalendarClock,
  User,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react"

type PengembalianResult = {
  message: string
  detail: DetailPeminjaman
  denda: Denda | null
}

export function PengembalianView() {
  const [data, setData] = useState<Peminjaman[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [confirmDetail, setConfirmDetail] = useState<DetailPeminjaman | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    api
      .get<Peminjaman[]>(`/api/peminjaman?status=Dipinjam`)
      .then((res) => {
        if (active) {
          // Hanya tampilkan peminjaman yang masih punya detail "Belum"
          const filtered = res.filter(
            (p) => (p.detail ?? []).some((d) => d.statusKembali === "Belum"),
          )
          setData(filtered)
        }
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof ApiError ? e.message : "Gagal memuat data peminjaman")
          setData([])
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [refresh])

  async function handleKembalikan(detail: DetailPeminjaman) {
    setSubmitting(true)
    try {
      const result = await api.post<PengembalianResult>("/api/pengembalian", {
        idDetail: detail.idDetail,
      })
      toast.success(result.message)
      if (result.denda) {
        toast.warning(
          `Denda dibuat: ${formatRupiah(result.denda.totalDenda)} (${result.denda.jumlahHariTelat} hari telat)`,
        )
      }
      setConfirmDetail(null)
      setRefresh((n) => n + 1)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal memproses pengembalian"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengembalian Buku"
        description="Proses pengembalian buku dan hitung denda keterlambatan."
      />

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-40" />
              </div>
              <Skeleton className="h-4 w-56 mt-3" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <Card className="p-0">
          <EmptyState
            icon={Undo2}
            title="Tidak ada buku yang menunggu pengembalian"
            description="Semua peminjaman aktif sudah diproses pengembaliannya."
          />
        </Card>
      )}

      {!loading && !error && data.length > 0 && (
        <div className="space-y-4">
          {data.map((p) => (
            <PengembalianCard key={p.idPeminjaman} peminjaman={p} onConfirm={setConfirmDetail} />
          ))}
        </div>
      )}

      {/* Confirm dialog */}
      <AlertDialog
        open={confirmDetail !== null}
        onOpenChange={(o) => !o && setConfirmDetail(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pengembalian</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <span className="space-y-2 block">
                <span className="block">
                  Anda akan menandai buku berikut sebagai sudah dikembalikan:
                </span>
                <span className="block font-medium text-foreground">
                  &ldquo;{confirmDetail?.buku?.judulBuku ?? "Buku"}&rdquo;
                </span>
                <span className="block">
                  Jika melebihi jatuh tempo, denda keterlambatan akan dibuat otomatis
                  sebesar Rp2.000/hari.
                </span>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={(e) => {
                e.preventDefault()
                if (confirmDetail) handleKembalikan(confirmDetail)
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
                  <CheckCircle2 className="size-4 mr-1.5" />
                  Ya, Kembalikan
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PengembalianCard({
  peminjaman,
  onConfirm,
}: {
  peminjaman: Peminjaman
  onConfirm: (d: DetailPeminjaman) => void
}) {
  const details = peminjaman.detail ?? []
  const telat = hariTerlambat(peminjaman.tanggalJatuhTempo)

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
              Pinjam {formatDate(peminjaman.tanggalPinjam)} · Jatuh tempo{" "}
              {formatDate(peminjaman.tanggalJatuhTempo)}
            </span>
          </div>
        </div>
        <div className="sm:text-right text-sm">
          <div className="flex sm:justify-end items-center gap-1.5 font-medium">
            <User className="size-3.5 text-muted-foreground" />
            <span className="truncate">{peminjaman.anggota?.namaAnggota ?? "-"}</span>
          </div>
        </div>
      </div>

      {/* Detail list */}
      <div className="rounded-lg border divide-y">
        {details.map((d) => (
          <div
            key={d.idDetail}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${d.statusKembali === "Sudah"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-primary/10 text-primary"
                  }`}
              >
                {d.statusKembali === "Sudah" ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <BookCopy className="size-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {d.buku?.judulBuku ?? "Buku tidak diketahui"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {d.statusKembali === "Sudah"
                    ? `Dikembalikan ${formatDate(d.tanggalKembali)}`
                    : "Menunggu pengembalian"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:shrink-0 pl-11 sm:pl-0">
              {d.statusKembali === "Sudah" ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                >
                  <CheckCircle2 className="size-3" />
                  Selesai
                </Badge>
              ) : (
                <Button size="sm" onClick={() => onConfirm(d)}>
                  <Undo2 className="size-4 mr-1.5" />
                  Kembalikan
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
