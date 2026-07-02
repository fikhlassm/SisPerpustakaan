"use client"

import { useEffect, useState } from "react"
import { api, formatRupiah } from "@/lib/api-client"
import type { Laporan } from "@/lib/types"
import { PageHeader } from "@/components/shared/shell-layout"
import { StatCard, EmptyState, StatusBadge } from "@/components/shared/ui-helpers"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
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
  History,
  ArrowRightLeft,
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

export function LaporanView() {
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
        title="Laporan"
        description="Statistik dan ringkasan operasional perpustakaan."
        action={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4 mr-2" />
            Cetak Laporan
          </Button>
        }
      />

      {/* Section: Ringkasan Umum */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Ringkasan Umum</h2>
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
            label="Total Anggota"
            value={r?.totalAnggota ?? 0}
            loading={loading}
          />
          <StatCard
            icon={UserCheck}
            label="Anggota Aktif"
            value={r?.anggotaAktif ?? 0}
            tone="success"
            hint={`${r?.anggotaNonaktif ?? 0} nonaktif`}
            loading={loading}
          />
          <StatCard
            icon={History}
            label="Total Peminjaman"
            value={r?.totalPeminjaman ?? 0}
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
            value={r?.dendaBelumBayar ?? 0}
            tone="danger"
            hint="transaksi tertunggak"
            loading={loading}
          />
          <StatCard
            icon={CircleDollarSign}
            label="Total Nilai Denda"
            value={formatRupiah(r?.totalDendaBelumBayar ?? 0)}
            tone="danger"
            loading={loading}
          />
        </div>
      </section>

      {/* Section: Statistik Peminjaman per Bulan */}
      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Statistik Peminjaman per Bulan</CardTitle>
            <CardDescription>
              Jumlah peminjaman dalam 6 bulan terakhir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (data?.peminjamanPerBulan?.length ?? 0) === 0 ? (
              <EmptyState
                icon={ArrowRightLeft}
                title="Belum ada data"
                description="Belum ada peminjaman dalam 6 bulan terakhir."
              />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
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
                    name="Peminjaman"
                    fill="var(--primary)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Section: Buku Terpopuler */}
      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Buku Terpopuler</CardTitle>
            <CardDescription>
              Buku dengan jumlah peminjaman terbanyak.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (data?.topBuku?.length ?? 0) === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Belum ada data"
                description="Belum ada buku yang dipinjam."
              />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  layout="vertical"
                  data={data?.topBuku ?? []}
                  margin={{ left: 8, right: 24 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    type="category"
                    dataKey="judul"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={180}
                    tickFormatter={(v: string) =>
                      v.length > 28 ? v.slice(0, 28) + "…" : v
                    }
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
                    name="Total Pinjam"
                    fill="var(--primary)"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Section: Daftar Denda Belum Lunas */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Daftar Denda Belum Lunas</CardTitle>
            <CardDescription>
              Denda dengan status pembayaran belum lunas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (data?.dendaBelumBayar?.length ?? 0) === 0 ? (
              <EmptyState
                icon={CircleDollarSign}
                title="Tidak ada denda tertunggak"
                description="Semua denda telah dilunasi."
              />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Anggota</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Judul Buku</TableHead>
                      <TableHead className="text-right">Hari Telat</TableHead>
                      <TableHead className="text-right">Total Denda</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.dendaBelumBayar ?? []).map((d) => (
                      <TableRow key={d.idDenda}>
                        <TableCell className="font-mono text-xs">
                          {d.detailPeminjaman?.peminjaman?.anggota?.idAnggota ??
                            "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {d.detailPeminjaman?.peminjaman?.anggota
                            ?.namaAnggota ?? "-"}
                        </TableCell>
                        <TableCell className="max-w-[260px]">
                          <span className="truncate block text-muted-foreground">
                            {d.detailPeminjaman?.buku?.judulBuku ?? "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {d.jumlahHariTelat} hari
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatRupiah(d.totalDenda)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={d.statusPembayaran} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
