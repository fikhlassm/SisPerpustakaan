"use client"

import { useEffect, useState } from "react"
import { api, ApiError, formatRupiah, formatDate } from "@/lib/api-client"
import type {
  Laporan,
  LaporanPeminjaman,
  LaporanDenda,
  LaporanAnggota,
  LaporanAnggotaItem,
  Peminjaman,
  Denda,
} from "@/lib/types"
import { PageHeader } from "@/components/shared/shell-layout"
import { StatCard, EmptyState, StatusBadge } from "@/components/shared/ui-helpers"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BookCopy,
  Users,
  UserCheck,
  History,
  ArrowRightLeft,
  CircleDollarSign,
  Printer,
  BookOpen,
  FileBarChart,
  CalendarDays,
  CheckCheck,
  Wallet,
  UserX,
  ListChecks,
  Timer,
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
import { toast } from "sonner"

// =====================================================
// Helpers tanggal (YYYY-MM-DD, lokal)
// =====================================================
function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}
function startOfYearISO(): string {
  return `${new Date().getFullYear()}-01-01`
}

// =====================================================
// Tipe union hasil Generate Laporan
// =====================================================
type JenisLaporan = "peminjaman" | "denda" | "anggota"
type HasilLaporan = LaporanPeminjaman | LaporanDenda | LaporanAnggota | null

// =====================================================
// Komponen utama — LaporanView
// Mengimplementasikan Sequence Diagram 8.2.14:
// generateLaporan(jenis, periode)
// =====================================================
export function LaporanView() {
  // --- Data ringkasan umum (overview) ---
  const [data, setData] = useState<Laporan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const d = await api.get<Laporan>("/api/laporan")
        if (active) setData(d)
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  // --- Filter untuk Generate Laporan Detail ---
  const [jenis, setJenis] = useState<JenisLaporan>("peminjaman")
  const [dari, setDari] = useState<string>(startOfYearISO())
  const [sampai, setSampai] = useState<string>(todayISO())
  const [status, setStatus] = useState<string>("Semua")

  // --- Hasil Generate ---
  const [hasil, setHasil] = useState<HasilLaporan>(null)
  const [generated, setGenerated] = useState(false)
  const [generating, setGenerating] = useState(false)

  const statusOptions: Record<JenisLaporan, string[]> = {
    peminjaman: ["Semua", "Dipinjam", "Selesai"],
    denda: ["Semua", "Belum Bayar", "Sudah Bayar"],
    anggota: ["Semua", "Aktif", "Nonaktif"],
  }

  function handleJenisChange(v: string) {
    setJenis(v as JenisLaporan)
    setStatus("Semua")
    setGenerated(false)
    setHasil(null)
  }

  function handleStatusChange(v: string) {
    setStatus(v)
    setGenerated(false)
    setHasil(null)
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const params = new URLSearchParams({
        dari,
        sampai,
      })
      if (status !== "Semua") params.set("status", status)
      const endpoint = `/api/laporan/${jenis}?${params.toString()}`
      const res = await api.get<HasilLaporan>(endpoint)
      setHasil(res)
      setGenerated(true)
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Gagal memuat laporan"
      toast.error(msg)
      setGenerated(false)
      setHasil(null)
    } finally {
      setGenerating(false)
    }
  }

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
              <Skeleton className="h-[280px] w-full" />
            ) : (data?.peminjamanPerBulan?.length ?? 0) === 0 ? (
              <EmptyState
                icon={ArrowRightLeft}
                title="Belum ada data"
                description="Belum ada peminjaman dalam 6 bulan terakhir."
              />
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
              <Skeleton className="h-[280px] w-full" />
            ) : (data?.topBuku?.length ?? 0) === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Belum ada data"
                description="Belum ada buku yang dipinjam."
              />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
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

      {/* Section: Generate Laporan Detail (Ref: Seq 8.2.14) */}
      <section className="mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Generate Laporan Detail</CardTitle>
            <CardDescription>
              Pilih jenis laporan dan periode untuk melihat detail transaksi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Filter row */}
            <div className="space-y-4 sticky top-2 z-10 rounded-lg bg-card/95 backdrop-blur p-4 border">
              {/* Jenis laporan */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Jenis Laporan
                </Label>
                <Tabs
                  value={jenis}
                  onValueChange={handleJenisChange}
                  className="w-full"
                >
                  <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
                    <TabsTrigger value="peminjaman">Peminjaman</TabsTrigger>
                    <TabsTrigger value="denda">Denda</TabsTrigger>
                    <TabsTrigger value="anggota">Anggota</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Separator />

              {/* Periode + status + generate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dari" className="text-xs text-muted-foreground">
                    Dari
                  </Label>
                  <Input
                    id="dari"
                    type="date"
                    value={dari}
                    onChange={(e) => setDari(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="sampai"
                    className="text-xs text-muted-foreground"
                  >
                    Sampai
                  </Label>
                  <Input
                    id="sampai"
                    type="date"
                    value={sampai}
                    onChange={(e) => setSampai(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Semua" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions[jenis].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 flex flex-col justify-end">
                  <Button
                    onClick={handleGenerate}
                    disabled={generating || !dari || !sampai}
                    className="w-full"
                  >
                    <FileBarChart className="size-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </div>
            </div>

            {/* Result area */}
            {!generated ? (
              generating ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <EmptyState
                  icon={FileBarChart}
                  title="Klik Generate untuk menampilkan laporan"
                  description="Pilih jenis laporan, periode, dan status lalu klik tombol Generate."
                />
              )
            ) : hasil && jenis === "peminjaman" ? (
              <HasilPeminjaman hasil={hasil as LaporanPeminjaman} />
            ) : hasil && jenis === "denda" ? (
              <HasilDenda hasil={hasil as LaporanDenda} />
            ) : hasil && jenis === "anggota" ? (
              <HasilAnggota hasil={hasil as LaporanAnggota} />
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

// =====================================================
// Sub-komponen: Hasil Peminjaman
// =====================================================
function HasilPeminjaman({ hasil }: { hasil: LaporanPeminjaman }) {
  const ring = hasil.ringkasan
  const items = hasil.items ?? []
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ListChecks}
          label="Total Transaksi"
          value={ring.totalTransaksi}
        />
        <StatCard
          icon={CheckCheck}
          label="Selesai"
          value={ring.selesai}
          tone="success"
        />
        <StatCard
          icon={Timer}
          label="Dipinjam"
          value={ring.dipinjam}
          tone="warning"
        />
        <StatCard
          icon={BookCopy}
          label="Total Buku Dipinjam"
          value={ring.totalBukuDipinjam}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={FileBarChart}
          title="Tidak ada data untuk periode & filter ini"
          description="Coba ubah periode atau status lalu klik Generate kembali."
        />
      ) : (
        <div className="max-h-[32rem] overflow-y-auto rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>ID Peminjaman</TableHead>
                <TableHead>Anggota</TableHead>
                <TableHead>Buku</TableHead>
                <TableHead>Tanggal Pinjam</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p: Peminjaman) => (
                <TableRow key={p.idPeminjaman}>
                  <TableCell className="font-mono text-xs">
                    {p.idPeminjaman}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {p.anggota?.namaAnggota ?? "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.anggota?.email ?? ""}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <span className="text-sm text-muted-foreground line-clamp-2">
                      {(p.detail ?? [])
                        .map((d) => d.buku?.judulBuku)
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(p.tanggalPinjam)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(p.tanggalJatuhTempo)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.statusPinjam} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// =====================================================
// Sub-komponen: Hasil Denda
// =====================================================
function HasilDenda({ hasil }: { hasil: LaporanDenda }) {
  const ring = hasil.ringkasan
  const items = hasil.items ?? []
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CircleDollarSign}
          label="Total Denda"
          value={ring.totalDenda}
        />
        <StatCard
          icon={Wallet}
          label="Total Nominal"
          value={formatRupiah(ring.totalNominal)}
        />
        <StatCard
          icon={Timer}
          label="Belum Bayar"
          value={ring.belumBayar}
          tone="danger"
          hint={formatRupiah(ring.nominalBelumBayar)}
        />
        <StatCard
          icon={CheckCheck}
          label="Sudah Bayar"
          value={ring.sudahBayar}
          tone="success"
          hint={formatRupiah(ring.nominalSudahBayar)}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={FileBarChart}
          title="Tidak ada data untuk periode & filter ini"
          description="Coba ubah periode atau status lalu klik Generate kembali."
        />
      ) : (
        <div className="max-h-[32rem] overflow-y-auto rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>ID Denda</TableHead>
                <TableHead>Anggota</TableHead>
                <TableHead>Buku</TableHead>
                <TableHead className="text-right">Hari Telat</TableHead>
                <TableHead className="text-right">Total Denda</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tgl Pembayaran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((d: Denda) => (
                <TableRow key={d.idDenda}>
                  <TableCell className="font-mono text-xs">
                    DND{String(d.idDenda).padStart(3, "0")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {d.detailPeminjaman?.peminjaman?.anggota?.namaAnggota ??
                        "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {d.detailPeminjaman?.peminjaman?.anggota?.email ?? ""}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[240px]">
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {d.detailPeminjaman?.buku?.judulBuku ?? "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {d.jumlahHariTelat} hari
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatRupiah(d.totalDenda)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={d.statusPembayaran} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {d.tanggalPembayaran ? formatDate(d.tanggalPembayaran) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// =====================================================
// Sub-komponen: Hasil Anggota
// =====================================================
function HasilAnggota({ hasil }: { hasil: LaporanAnggota }) {
  const ring = hasil.ringkasan
  const items = hasil.items ?? []
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Total Anggota"
          value={ring.totalAnggota}
        />
        <StatCard
          icon={UserCheck}
          label="Aktif"
          value={ring.aktif}
          tone="success"
        />
        <StatCard
          icon={UserX}
          label="Nonaktif"
          value={ring.nonaktif}
          tone="warning"
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={FileBarChart}
          title="Tidak ada data untuk periode & filter ini"
          description="Coba ubah periode atau status lalu klik Generate kembali."
        />
      ) : (
        <div className="max-h-[32rem] overflow-y-auto rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>ID Anggota</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>JK</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tgl Daftar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Total Pinjam</TableHead>
                <TableHead className="text-right">Denda Belum Bayar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a: LaporanAnggotaItem) => (
                <TableRow key={a.idAnggota}>
                  <TableCell className="font-mono text-xs">
                    {a.idAnggota}
                  </TableCell>
                  <TableCell className="font-medium">{a.namaAnggota}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        a.jenisKelamin === "L" ? "default" : "secondary"
                      }
                      className="font-semibold"
                    >
                      {a.jenisKelamin}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {a.email}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(a.tanggalDaftar)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={a.statusAnggota} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{a.totalPeminjaman}</Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      a.dendaBelumBayar > 0
                        ? "text-red-600 dark:text-red-400"
                        : ""
                    }`}
                  >
                    {formatRupiah(a.dendaBelumBayar)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
