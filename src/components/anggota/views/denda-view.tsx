"use client"

import { useEffect, useMemo, useState } from "react"
import { useApp } from "@/lib/store"
import { api, ApiError, formatDate, formatRupiah } from "@/lib/api-client"
import type { Denda, Peminjaman } from "@/lib/types"
import { PageHeader } from "@/components/shared/shell-layout"
import { EmptyState, StatCard, StatusBadge } from "@/components/shared/ui-helpers"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  CircleDollarSign,
  Wallet,
  AlertCircle,
  CalendarClock,
} from "lucide-react"

type DendaRow = {
  denda: Denda
  judulBuku: string
}

export function DendaView() {
  const user = useApp((s) => s.user)
  const myId = user?.id

  const [rows, setRows] = useState<DendaRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    if (!myId) return
    ;(async () => {
      try {
        const res = await api.get<Peminjaman[]>(`/api/peminjaman/anggota/${myId}`)
        if (!mounted) return
        const flat: DendaRow[] = []
        for (const p of res) {
          for (const d of p.detail || []) {
            if (d.denda) {
              flat.push({
                denda: d.denda,
                judulBuku: d.buku?.judulBuku || "—",
              })
            }
          }
        }
        // Sort: belum bayar first, then by idDenda desc
        flat.sort((a, b) => {
          const aBelum = a.denda.statusPembayaran === "Belum Bayar" ? 0 : 1
          const bBelum = b.denda.statusPembayaran === "Belum Bayar" ? 0 : 1
          if (aBelum !== bBelum) return aBelum - bBelum
          return b.denda.idDenda - a.denda.idDenda
        })
        setRows(flat)
      } catch (err) {
        if (mounted) {
          toast.error(err instanceof ApiError ? err.message : "Gagal memuat denda")
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [myId])

  const totals = useMemo(() => {
    const total = rows.reduce((s, r) => s + (r.denda.totalDenda || 0), 0)
    const belum = rows.filter((r) => r.denda.statusPembayaran === "Belum Bayar")
    const totalBelum = belum.reduce((s, r) => s + (r.denda.totalDenda || 0), 0)
    return { total, belumCount: belum.length, totalBelum }
  }, [rows])

  const hasBelumBayar = totals.belumCount > 0

  if (loading) {
    return (
      <div>
        <PageHeader title="Denda Saya" description="Catatan denda keterlambatan pengembalian." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <Card className="p-4">
          <Skeleton className="h-40 w-full" />
        </Card>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div>
        <PageHeader title="Denda Saya" description="Catatan denda keterlambatan pengembalian." />
        <EmptyState
          icon={CircleDollarSign}
          title="Tidak ada denda"
          description="Anda tertib mengembalikan buku. Pertahankan!"
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Denda Saya" description="Catatan denda keterlambatan pengembalian." />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={Wallet}
          label="Total Denda"
          value={formatRupiah(totals.total)}
          hint={`Dari ${rows.length} transaksi`}
          tone="default"
        />
        <StatCard
          icon={AlertCircle}
          label="Belum Lunas"
          value={totals.belumCount}
          hint={formatRupiah(totals.totalBelum)}
          tone={hasBelumBayar ? "danger" : "success"}
        />
      </div>

      {hasBelumBayar && (
        <Alert className="mb-4 border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400">
          <AlertCircle className="size-4" />
          <AlertTitle>Perlu Tindakan</AlertTitle>
          <AlertDescription>
            Silakan lakukan pembayaran di loket perpustakaan.
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">ID Denda</TableHead>
              <TableHead>Buku</TableHead>
              <TableHead className="text-center">Hari Telat</TableHead>
              <TableHead className="text-right">Total Denda</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4 text-right">Tgl Pembayaran</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.denda.idDenda}>
                <TableCell className="pl-4 font-mono text-xs">
                  #{r.denda.idDenda}
                </TableCell>
                <TableCell className="max-w-[220px]">
                  <p className="font-medium truncate">{r.judulBuku}</p>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center gap-1 text-sm">
                    <CalendarClock className="size-3.5 text-muted-foreground" />
                    {r.denda.jumlahHariTelat}
                  </span>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatRupiah(r.denda.totalDenda)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.denda.statusPembayaran} />
                </TableCell>
                <TableCell className="pr-4 text-right text-sm text-muted-foreground">
                  {formatDate(r.denda.tanggalPembayaran)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
