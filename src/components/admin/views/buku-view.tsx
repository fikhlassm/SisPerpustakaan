"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { api, ApiError } from "@/lib/api-client"
import type { Buku, Kategori } from "@/lib/types"
import { PageHeader } from "@/components/shared/shell-layout"
import { EmptyState } from "@/components/shared/ui-helpers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2, BookCopy, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type FormState = {
  idKategori: string
  judulBuku: string
  pengarang: string
  penerbit: string
  tahunTerbit: string
  stok: string
}

const emptyForm: FormState = {
  idKategori: "",
  judulBuku: "",
  pengarang: "",
  penerbit: "",
  tahunTerbit: String(new Date().getFullYear()),
  stok: "1",
}

function StokBadge({ stok }: { stok: number }) {
  const tone =
    stok <= 0
      ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
      : stok <= 2
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        tone,
      )}
    >
      {stok} eks.
    </span>
  )
}

export function BukuView() {
  const [list, setList] = useState<Buku[]>([])
  const [kategoriList, setKategoriList] = useState<Kategori[]>([])
  const [loading, setLoading] = useState(true)
  const [katLoading, setKatLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)

  // Filter state
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [idKategoriFilter, setIdKategoriFilter] = useState<string>("all")

  // Create / Edit dialog
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Buku | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Buku | null>(null)
  const [deleting, setDeleting] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce text search 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQ(q), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [q])

  const loadKategori = useCallback(async () => {
    setKatLoading(true)
    try {
      const data = await api.get<Kategori[]>("/api/kategori")
      setKategoriList(data)
    } catch {
      // silent; kategori select will be empty
    } finally {
      setKatLoading(false)
    }
  }, [])

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedQ.trim()) params.set("q", debouncedQ.trim())
      if (idKategoriFilter !== "all") params.set("id_kategori", idKategoriFilter)
      const qs = params.toString()
      const data = await api.get<Buku[]>(`/api/buku${qs ? `?${qs}` : ""}`)
      setList(data)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal memuat buku"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [debouncedQ, idKategoriFilter])

  useEffect(() => {
    loadKategori()
  }, [loadKategori])

  useEffect(() => {
    loadList()
  }, [loadList, refresh])

  function openCreate() {
    setEditing(null)
    setForm({
      ...emptyForm,
      idKategori: kategoriList[0]?.idKategori ?? "",
    })
    setOpen(true)
  }

  function openEdit(b: Buku) {
    setEditing(b)
    setForm({
      idKategori: b.idKategori,
      judulBuku: b.judulBuku,
      pengarang: b.pengarang,
      penerbit: b.penerbit,
      tahunTerbit: String(b.tahunTerbit),
      stok: String(b.stok),
    })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.idKategori) {
      toast.error("Kategori wajib dipilih")
      return
    }
    if (!form.judulBuku.trim() || !form.pengarang.trim() || !form.penerbit.trim()) {
      toast.error("Judul, pengarang, dan penerbit wajib diisi")
      return
    }
    const tahun = Number(form.tahunTerbit)
    const stok = Number(form.stok)
    if (!Number.isFinite(tahun) || tahun <= 0) {
      toast.error("Tahun terbit tidak valid")
      return
    }
    if (!Number.isFinite(stok) || stok < 0) {
      toast.error("Stok tidak boleh negatif")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        idKategori: form.idKategori,
        judulBuku: form.judulBuku.trim(),
        pengarang: form.pengarang.trim(),
        penerbit: form.penerbit.trim(),
        tahunTerbit: tahun,
        stok,
      }
      if (editing) {
        await api.put(`/api/buku/${editing.idBuku}`, payload)
        toast.success("Buku diperbarui")
      } else {
        await api.post("/api/buku", payload)
        toast.success("Buku ditambahkan")
      }
      setOpen(false)
      setRefresh((r) => r + 1)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menyimpan buku"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.del(`/api/buku/${deleteTarget.idBuku}`)
      toast.success("Buku dihapus")
      setDeleteTarget(null)
      setRefresh((r) => r + 1)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menghapus buku"
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Kelola Buku"
        description="Manajemen katalog buku perpustakaan."
        action={
          <Button onClick={openCreate} className="gap-2" disabled={katLoading}>
            <Plus className="size-4" /> Tambah Buku
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari judul / pengarang / penerbit..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={idKategoriFilter}
          onValueChange={(v) => setIdKategoriFilter(v)}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {kategoriList.map((k) => (
              <SelectItem key={k.idKategori} value={k.idKategori}>
                {k.namaKategori}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Buku</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead>Pengarang</TableHead>
              <TableHead>Penerbit</TableHead>
              <TableHead>Tahun</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-center">Stok</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : list.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="p-0">
                  <EmptyState
                    icon={BookCopy}
                    title="Belum ada buku"
                    description="Tambahkan buku ke katalog atau ubah kata kunci pencarian."
                  />
                </TableCell>
              </TableRow>
            ) : (
              list.map((b) => (
                <TableRow key={b.idBuku}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {b.idBuku}
                  </TableCell>
                  <TableCell className="font-medium max-w-xs">
                    <span className="line-clamp-2">{b.judulBuku}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.pengarang}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.penerbit}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.tahunTerbit}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {b.kategori?.namaKategori ?? "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <StokBadge stok={b.stok} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(b)}
                        title="Edit buku"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(b)}
                        title="Hapus buku"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog Create / Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Buku" : "Tambah Buku"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Perbarui informasi buku dalam katalog."
                : "Lengkapi data buku baru untuk katalog perpustakaan."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="idKategori">Kategori</Label>
              <Select
                value={form.idKategori}
                onValueChange={(v) => setForm({ ...form, idKategori: v })}
              >
                <SelectTrigger id="idKategori" className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {kategoriList.map((k) => (
                    <SelectItem key={k.idKategori} value={k.idKategori}>
                      {k.namaKategori}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="judulBuku">Judul Buku</Label>
              <Input
                id="judulBuku"
                value={form.judulBuku}
                onChange={(e) => setForm({ ...form, judulBuku: e.target.value })}
                placeholder="cth: Pengantar Sistem Informasi"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pengarang">Pengarang</Label>
                <Input
                  id="pengarang"
                  value={form.pengarang}
                  onChange={(e) =>
                    setForm({ ...form, pengarang: e.target.value })
                  }
                  placeholder="cth: Jogiyanto HM"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="penerbit">Penerbit</Label>
                <Input
                  id="penerbit"
                  value={form.penerbit}
                  onChange={(e) => setForm({ ...form, penerbit: e.target.value })}
                  placeholder="cth: Andi Yogyakarta"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tahunTerbit">Tahun Terbit</Label>
                <Input
                  id="tahunTerbit"
                  type="number"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  value={form.tahunTerbit}
                  onChange={(e) =>
                    setForm({ ...form, tahunTerbit: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stok">Stok</Label>
                <Input
                  id="stok"
                  type="number"
                  min={0}
                  value={form.stok}
                  onChange={(e) => setForm({ ...form, stok: e.target.value })}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {editing ? "Simpan Perubahan" : "Tambah Buku"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Buku?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus buku{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.judulBuku}
              </span>
              ? Tindakan ini tidak dapat dibatalkan. Buku yang memiliki riwayat
              peminjaman tidak dapat dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
