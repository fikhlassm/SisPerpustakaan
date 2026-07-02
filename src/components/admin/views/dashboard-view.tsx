"use client"

import { useEffect, useState } from "react"
import { api, formatRupiah, formatDate } from "@/lib/api-client"
import type { Laporan } from "@/lib/types"
import { PageHeader } from "@/components/shared/shell-layout"
import { StatCard, EmptyState, StatusBadge } from "@/components/shared/ui-helpers"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BookCopy,
  Users,
  UserCheck,
  ArrowRightLeft,
  History,
  CircleDollarSign,
  Printer,
  BookOpen,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export function DashboardView() {
  const [data, setData] = useState<Laporan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const d = await api.get<Laporan>("/api/laporan")
        setData(d)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const r = data?.ringkasan

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Ringkasan operasional perpustakaan hari ini."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookCopy}
          label="Total Buku"
          value={r?.totalBuku ?? 0}
          hint={`${r?.totalStokBuku ?? 0} eksemplar`}
          loading={loading}
        />
        <StatCard
          icon={Users}
          label="Anggota Aktif"
          value={r?.anggotaAktif ?? 0}
          tone="success"
          hint={`${r?.totalAnggota ?? 0} total terdaftar`}
          loading={loading}
        />
        <StatCard
          icon={ArrowRightLeft}
          label="Peminjaman Aktif"
          value={r?.peminjamanAktif ?? 0}
          tone="warning"
          loading={loading}
        />
        <StatCard
          icon={CircleDollarSign}
          label="Denda Belum Bayar"
          value={formatRupiah(r?.totalDendaBelumBayar ?? 0)}
          tone="danger"
          hint={`${r?.dendaBelumBayar ?? 0} transaksi`}
          loading={loading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        {/* Bar chart peminjaman per bulan */}
        <Card>
          <CardHeader>
            <CardTitle>Peminjaman 6 Bulan Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.peminjamanPerBulan ?? []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--background)",
                      color: "var(--foreground)",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="total"
                    fill="var(--primary)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top books list */}
        <Card>
          <CardHeader>
            <CardTitle>Buku Paling Sering Dipinjam</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (data?.topBuku?.length ?? 0) === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Belum ada data"
                description="Belum ada buku yang dipinjam."
              />
            ) : (
              <div className="max-h-[280px] overflow-y-auto pr-2">
                <ol className="space-y-2">
                  {(data?.topBuku ?? []).map((b, i) => (
                    <li
                      key={`${b.judul}-${i}`}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
                    >
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{b.judul}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {b.pengarang}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-primary/10 text-primary border-primary/20 shrink-0">
                        {b.total}× dipinjam
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Peminjaman terbaru */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Peminjaman Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (data?.peminjamanTerbaru?.length ?? 0) === 0 ? (
            <EmptyState
              icon={History}
              title="Belum ada peminjaman"
              description="Belum ada transaksi peminjaman terbaru."
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Peminjaman</TableHead>
                    <TableHead>Anggota</TableHead>
                    <TableHead>Buku</TableHead>
                    <TableHead>Tanggal Pinjam</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.peminjamanTerbaru ?? []).map((p) => (
                    <TableRow key={p.idPeminjaman}>
                      <TableCell className="font-mono text-xs">
                        {p.idPeminjaman}
                      </TableCell>
                      <TableCell className="font-medium">
                        {p.anggota?.namaAnggota ?? "-"}
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <div className="truncate text-muted-foreground">
                          {p.detail?.map((d) => d.buku?.judulBuku).join(", ") ||
                            "-"}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(p.tanggalPinjam)}</TableCell>
                      <TableCell>
                        <StatusBadge status={p.statusPinjam} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
