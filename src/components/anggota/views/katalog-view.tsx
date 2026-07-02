"use client"

import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useApp } from "@/lib/store"
import { api, ApiError, formatDate } from "@/lib/api-client"
import type { Buku, Kategori, Peminjaman, SessionUser } from "@/lib/types"
import { PageHeader } from "@/components/shared/shell-layout"
import { EmptyState } from "@/components/shared/ui-helpers"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  Search,
  BookOpen,
  AlertCircle,
  Info,
  CheckCircle2,
  Loader2,
  ShoppingCart,
  ArrowUpDown,
  Eye,
  XCircle,
  BookMarked,
  Library,
  Calendar,
  User,
  Hash,
} from "lucide-react"

const MAX_BUKU = 3

// =====================================================
// Fitur 2 — Sort/Urutan (Ref: DFD 4.5 Filter & Pilih Buku Katalog)
// =====================================================
type SortKey =
  | "default"
  | "judul-asc"
  | "judul-desc"
  | "pengarang-asc"
  | "tahun-desc"
  | "tahun-asc"
  | "stok-desc"
  | "stok-asc"

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "Urutan Bawaan" },
  { value: "judul-asc", label: "Judul A-Z" },
  { value: "judul-desc", label: "Judul Z-A" },
  { value: "pengarang-asc", label: "Pengarang A-Z" },
  { value: "tahun-desc", label: "Tahun Terbaru" },
  { value: "tahun-asc", label: "Tahun Terlama" },
  { value: "stok-desc", label: "Stok Terbanyak" },
  { value: "stok-asc", label: "Stok Tersedikit" },
]

function parseSort(key: SortKey): { sort?: string; order?: "asc" | "desc" } {
  if (key === "default") return {}
  const [sort, order] = key.split("-")
  return { sort, order: order as "asc" | "desc" }
}

// =====================================================
// Tipe lokal — detail buku mengembalikan relasi admin (Ref: GET /api/buku/[id])
// =====================================================
type BukuDetail = Buku & {
  admin?: { namaAdmin: string }
}

// Small helper component for the info grid inside the detail dialog
function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        <span>{label}</span>
      </div>
      <div className="text-sm">{children}</div>
    </div>
  )
}

export function KatalogView() {
  const user = useApp((s) => s.user)
  const setAnggotaView = useApp((s) => s.setAnggotaView)
  const myId = user?.id

  const [me, setMe] = useState<SessionUser | null>(user)
  const [buku, setBuku] = useState<Buku[]>([])
  const [kategori, setKategori] = useState<Kategori[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [idKategori, setIdKategori] = useState<string>("all")
  // Fitur 2 — sort state (Ref: DFD 4.5)
  const [sortKey, setSortKey] = useState<SortKey>("default")

  const [activeLoan, setActiveLoan] = useState<Peminjaman | null>(null)
  const [loadingActive, setLoadingActive] = useState(true)

  const [selected, setSelected] = useState<string[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Fitur 1 — Detail Buku dialog state (Ref: Sequence Diagram 8.2.4 Lihat Detail Buku)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailBook, setDetailBook] = useState<BukuDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  // Refresh /api/auth/me to get fresh status
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await api.get<{ user: SessionUser | null }>("/api/auth/me")
        if (mounted && res.user) setMe(res.user)
      } catch {
        // ignore — fall back to store user
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  // Fetch kategori once
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await api.get<Kategori[]>("/api/kategori")
        if (mounted) setKategori(res)
      } catch {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Fetch buku with filters + sort (Ref: DFD 4.5 Filter & Urutan)
  useEffect(() => {
    let mounted = true
    setLoading(true)
    const params = new URLSearchParams()
    if (debouncedQ.trim()) params.set("q", debouncedQ.trim())
    if (idKategori && idKategori !== "all") params.set("id_kategori", idKategori)
    const { sort, order } = parseSort(sortKey)
    if (sort) params.set("sort", sort)
    if (order) params.set("order", order)
    const url = `/api/buku${params.toString() ? `?${params.toString()}` : ""}`
    ;(async () => {
      try {
        const res = await api.get<Buku[]>(url)
        if (mounted) setBuku(res)
      } catch (err) {
        if (mounted) {
          setBuku([])
          toast.error(err instanceof ApiError ? err.message : "Gagal memuat katalog buku")
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [debouncedQ, idKategori, sortKey])

  // Fetch my active loan
  const fetchActiveLoan = useCallback(async () => {
    if (!myId) return
    setLoadingActive(true)
    try {
      const res = await api.get<Peminjaman[]>(`/api/peminjaman/anggota/${myId}`)
      const found = res.find((p) => p.statusPinjam === "Dipinjam") || null
      setActiveLoan(found)
    } catch {
      // ignore
    } finally {
      setLoadingActive(false)
    }
  }, [myId])

  useEffect(() => {
    fetchActiveLoan()
  }, [fetchActiveLoan])

  // Fitur 1 — Fetch detail buku when dialog dibuka (Ref: Seq 8.2.4 Lihat Detail Buku)
  useEffect(() => {
    if (!detailId) return
    let mounted = true
    setDetailLoading(true)
    setDetailError(null)
    setDetailBook(null)
    ;(async () => {
      try {
        const res = await api.get<BukuDetail>(`/api/buku/${detailId}`)
        if (mounted) setDetailBook(res)
      } catch (err) {
        if (mounted) {
          setDetailError(err instanceof ApiError ? err.message : "Gagal memuat detail buku")
        }
      } finally {
        if (mounted) setDetailLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [detailId])

  const statusAktif = (me?.status ?? user?.status) === "Aktif"
  const borrowDisabled = !statusAktif || !!activeLoan

  const selectedBuku = useMemo(
    () => buku.filter((b) => selected.includes(b.idBuku)),
    [buku, selected],
  )

  const toggleSelect = (id: string, checked: boolean) => {
    setSelected((prev) => {
      if (checked) {
        if (prev.length >= MAX_BUKU) {
          toast.warning(`Maksimal ${MAX_BUKU} buku per peminjaman`)
          return prev
        }
        return [...prev, id]
      }
      return prev.filter((x) => x !== id)
    })
  }

  const handleConfirm = async () => {
    if (selected.length === 0) return
    setSubmitting(true)
    try {
      await api.post<Peminjaman>("/api/peminjaman", { idBukuList: selected })
      toast.success("Peminjaman berhasil diajukan!")
      setSelected([])
      setConfirmOpen(false)
      await fetchActiveLoan()
      setAnggotaView("status")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal mengajukan peminjaman")
    } finally {
      setSubmitting(false)
    }
  }

  // Fitur 1 — Pinjam dari dialog: tutup dialog & ceklis buku di grid katalog
  const isDetailSelected = detailBook ? selected.includes(detailBook.idBuku) : false
  const detailStok = detailBook?.stok ?? 0
  const detailAtMax = selected.length >= MAX_BUKU && !isDetailSelected
  const canBorrowDetail =
    !!detailBook &&
    detailStok > 0 &&
    !borrowDisabled &&
    !detailAtMax

  const detailBorrowNote = !detailBook
    ? ""
    : detailStok === 0
      ? "Buku sedang tidak tersedia."
      : !statusAktif
        ? "Akun belum diverifikasi admin."
        : activeLoan
          ? "Selesaikan peminjaman aktif terlebih dahulu."
          : detailAtMax
            ? `Maksimal ${MAX_BUKU} buku per peminjaman.`
            : ""

  const handlePinjamFromDetail = () => {
    if (!detailBook) return
    if (!isDetailSelected) {
      toggleSelect(detailBook.idBuku, true)
      toast.success(`"${detailBook.judulBuku}" ditambahkan ke daftar pinjaman`)
    }
    setDetailId(null)
  }

  const hint =
    !statusAktif
      ? "Akun belum diverifikasi"
      : activeLoan
        ? "Selesaikan peminjaman aktif dahulu"
        : selected.length >= MAX_BUKU
          ? `Maks ${MAX_BUKU} buku`
          : "Pilih buku untuk dipinjam"

  return (
    <div className="pb-32">
      <PageHeader
        title="Katalog Buku"
        description="Cari, urutkan, dan pinjam buku dari koleksi perpustakaan."
      />

      {!statusAktif && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="size-4" />
          <AlertTitle>Akun belum diverifikasi</AlertTitle>
          <AlertDescription>
            Akun Anda belum diverifikasi admin. Pengajuan peminjaman akan ditolak hingga akun diaktifkan.
          </AlertDescription>
        </Alert>
      )}

      {activeLoan && (
        <Alert className="mb-4 border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400">
          <Info className="size-4" />
          <AlertTitle>Peminjaman aktif ditemukan</AlertTitle>
          <AlertDescription>
            Anda memiliki peminjaman aktif (ID: <span className="font-mono font-semibold">{activeLoan.idPeminjaman}</span>).
            Kembalikan dahulu sebelum meminjam lagi.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters — search + kategori + sort (Ref: DFD 4.1-4.5) */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari judul, pengarang, atau penerbit…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={idKategori} onValueChange={setIdKategori}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {kategori.map((k) => (
              <SelectItem key={k.idKategori} value={k.idKategori}>
                {k.namaKategori}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Fitur 2 — Sort/Urutan (Ref: DFD 4.5) */}
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-full sm:w-56">
            <ArrowUpDown className="size-4 text-muted-foreground" />
            <SelectValue placeholder="Urutan Bawaan" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden py-0 gap-0">
              <Skeleton className="h-24 w-full rounded-none" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-6 w-24" />
              </div>
            </Card>
          ))}
        </div>
      ) : buku.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Tidak ada buku ditemukan"
          description="Coba ubah kata kunci pencarian, filter kategori, atau urutan."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {buku.map((b) => {
            const isSelected = selected.includes(b.idBuku)
            const isMax = selected.length >= MAX_BUKU && !isSelected
            const stok = b.stok ?? 0
            const disabled = borrowDisabled || stok === 0 || (isMax && !isSelected)
            return (
              <Card
                key={b.idBuku}
                className={`overflow-hidden py-0 gap-0 transition-shadow ${
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
              >
                {/* Colored header strip */}
                <div className="relative h-24 bg-gradient-to-br from-primary to-primary/70 flex items-end p-3">
                  <Badge className="bg-background/90 text-foreground hover:bg-background/90">
                    {b.kategori?.namaKategori || "Umum"}
                  </Badge>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3 flex flex-col">
                  {/* Fitur 1 — judul (klik) membuka Detail Buku (Ref: Seq 8.2.4) */}
                  <button
                    type="button"
                    onClick={() => setDetailId(b.idBuku)}
                    className="space-y-1 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md -m-1 p-1"
                    aria-label={`Lihat detail ${b.judulBuku}`}
                  >
                    <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {b.judulBuku}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{b.pengarang}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.penerbit} · {b.tahunTerbit}
                    </p>
                  </button>

                  <div className="flex items-center justify-between">
                    {stok > 0 ? (
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
                        Tersedia ({stok})
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Habis</Badge>
                    )}
                    {isSelected && (
                      <CheckCircle2 className="size-4 text-primary" />
                    )}
                  </div>

                  {/* Aksi: pilih (checkbox) & lihat detail — interaksi terpisah */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Label
                      htmlFor={`sel-${b.idBuku}`}
                      className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                        disabled ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <Checkbox
                        id={`sel-${b.idBuku}`}
                        checked={isSelected}
                        disabled={disabled}
                        onCheckedChange={(c) => toggleSelect(b.idBuku, c === true)}
                      />
                      <span className="line-clamp-1">Pilih untuk dipinjam</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailId(b.idBuku)}
                      className="h-8"
                    >
                      <Eye className="size-4 mr-1.5" />
                      Detail
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Sticky bottom borrow bar */}
      {buku.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 lg:pl-64 pointer-events-none">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pb-4">
            <div className="pointer-events-auto rounded-xl border bg-card shadow-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ShoppingCart className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold leading-tight">
                    {selected.length} buku dipilih
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{hint}</p>
                </div>
              </div>
              <Button
                disabled={selected.length === 0 || borrowDisabled}
                onClick={() => setConfirmOpen(true)}
                className="sm:w-auto w-full"
              >
                Pinjam {selected.length > 0 ? `${selected.length} Buku` : "Buku"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fitur 1 — Dialog Detail Buku (Ref: Sequence Diagram 8.2.4 Lihat Detail Buku) */}
      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="sm:max-w-2xl">
          {detailLoading ? (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="sr-only">Memuat detail buku</DialogTitle>
              </DialogHeader>
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          ) : detailError ? (
            <DialogHeader>
              <DialogTitle>Gagal memuat detail</DialogTitle>
              <DialogDescription>{detailError}</DialogDescription>
            </DialogHeader>
          ) : detailBook ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl pr-8 leading-tight">
                  {detailBook.judulBuku}
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center gap-2 text-foreground">
                      <User className="size-4" />
                      <span>{detailBook.pengarang}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookMarked className="size-4" />
                      <span>{detailBook.penerbit}</span>
                      <span className="text-muted-foreground">·</span>
                      <Calendar className="size-4" />
                      <span>{detailBook.tahunTerbit}</span>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <InfoRow icon={Library} label="Kategori">
                  <Badge variant="secondary">
                    {detailBook.kategori?.namaKategori || "Umum"}
                  </Badge>
                </InfoRow>
                <InfoRow icon={BookOpen} label="Stok">
                  {detailBook.stok > 0 ? (
                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
                      Tersedia ({detailBook.stok})
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Habis</Badge>
                  )}
                </InfoRow>
                <InfoRow icon={Hash} label="ID Buku">
                  <span className="font-mono text-sm">{detailBook.idBuku}</span>
                </InfoRow>
                <InfoRow icon={User} label="Ditambahkan oleh">
                  <span>{detailBook.admin?.namaAdmin || "-"}</span>
                </InfoRow>
              </div>

              <Separator />

              {/* Status ketersediaan */}
              <div
                className={`rounded-lg border p-4 flex items-start gap-3 ${
                  detailBook.stok > 0
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-destructive/30 bg-destructive/5"
                }`}
              >
                {detailBook.stok > 0 ? (
                  <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="size-6 text-destructive shrink-0" />
                )}
                <div className="min-w-0">
                  <p
                    className={`font-semibold ${
                      detailBook.stok > 0
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-destructive"
                    }`}
                  >
                    {detailBook.stok > 0
                      ? "Tersedia untuk dipinjam"
                      : "Sedang tidak tersedia"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {detailBook.stok > 0
                      ? `Masih ada ${detailBook.stok} eksemplar di perpustakaan.`
                      : "Stok buku habis, coba lagi nanti."}
                  </p>
                </div>
              </div>

              {/* Footer — Pinjam Buku Ini atau catatan muted */}
              <DialogFooter className="pt-2">
                {canBorrowDetail ? (
                  <Button
                    onClick={handlePinjamFromDetail}
                    className="w-full sm:w-auto"
                    disabled={isDetailSelected}
                  >
                    <ShoppingCart className="size-4 mr-2" />
                    {isDetailSelected ? "Sudah dipilih" : "Pinjam Buku Ini"}
                  </Button>
                ) : isDetailSelected ? (
                  <p className="text-sm text-muted-foreground text-center sm:text-right w-full">
                    Buku ini sudah ada di daftar pinjaman Anda.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground text-center sm:text-right w-full">
                    {detailBorrowNote}
                  </p>
                )}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Peminjaman</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Anda akan meminjam buku berikut:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {selectedBuku.map((b) => (
                    <li key={b.idBuku} className="font-medium text-foreground">
                      {b.judulBuku}
                    </li>
                  ))}
                </ul>
                <p>
                  Jatuh tempo <span className="font-semibold text-foreground">7 hari</span> dari sekarang.
                  Denda <span className="font-semibold text-foreground">Rp2.000/hari</span> jika telat.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirm()
              }}
              disabled={submitting}
            >
              {submitting && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              Ajukan Peminjaman
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
