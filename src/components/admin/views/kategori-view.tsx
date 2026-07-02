"use client"

import { useCallback, useEffect, useState } from "react"
import { api, ApiError } from "@/lib/api-client"
import type { Kategori } from "@/lib/types"
import { PageHeader } from "@/components/shared/shell-layout"
import { EmptyState } from "@/components/shared/ui-helpers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Pencil, Trash2, Tags, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"

const emptyForm = { namaKategori: "", deskripsi: "" }

export function KategoriView() {
  const [list, setList] = useState<Kategori[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [refresh, setRefresh] = useState(0)

  // Create / Edit dialog
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Kategori | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Kategori | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<Kategori[]>("/api/kategori")
      setList(data)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal memuat kategori"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList, refresh])

  const filtered = list.filter((k) =>
    k.namaKategori.toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(k: Kategori) {
    setEditing(k)
    setForm({ namaKategori: k.namaKategori, deskripsi: k.deskripsi || "" })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.namaKategori.trim()) {
      toast.error("Nama kategori wajib diisi")
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        namaKategori: form.namaKategori.trim(),
        deskripsi: form.deskripsi.trim() || null,
      }
      if (editing) {
        await api.put(`/api/kategori/${editing.idKategori}`, payload)
        toast.success("Kategori diperbarui")
      } else {
        await api.post("/api/kategori", payload)
        toast.success("Kategori ditambahkan")
      }
      setOpen(false)
      setRefresh((r) => r + 1)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menyimpan kategori"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.del(`/api/kategori/${deleteTarget.idKategori}`)
      toast.success("Kategori dihapus")
      setDeleteTarget(null)
      setRefresh((r) => r + 1)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menghapus kategori"
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Kategori Buku"
        description="Kelola kategori koleksi buku perpustakaan."
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" /> Tambah Kategori
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategori ID</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead className="text-center">Jumlah Buku</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="p-0">
                  <EmptyState
                    icon={Tags}
                    title="Belum ada kategori"
                    description="Tambahkan kategori pertama untuk mulai mengelola koleksi buku perpustakaan."
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((k) => (
                <TableRow key={k.idKategori}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {k.idKategori}
                  </TableCell>
                  <TableCell className="font-medium">{k.namaKategori}</TableCell>
                  <TableCell className="max-w-xs text-muted-foreground">
                    <span className="line-clamp-1 block">
                      {k.deskripsi || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{k._count?.buku ?? 0}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(k)}
                        title="Edit kategori"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(k)}
                        title="Hapus kategori"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Kategori" : "Tambah Kategori"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Perbarui informasi kategori buku."
                : "Isi data kategori baru untuk koleksi buku."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="namaKategori">Nama Kategori</Label>
              <Input
                id="namaKategori"
                value={form.namaKategori}
                onChange={(e) =>
                  setForm({ ...form, namaKategori: e.target.value })
                }
                placeholder="cth: Pendidikan"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Textarea
                id="deskripsi"
                value={form.deskripsi}
                onChange={(e) =>
                  setForm({ ...form, deskripsi: e.target.value })
                }
                placeholder="Deskripsi singkat kategori..."
                rows={3}
              />
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
                {editing ? "Simpan Perubahan" : "Tambah Kategori"}
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
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kategori{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.namaKategori}
              </span>
              ? Tindakan ini tidak dapat dibatalkan. Kategori yang masih memiliki
              buku tidak dapat dihapus.
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
