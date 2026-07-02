"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { api, ApiError, formatDate } from "@/lib/api-client"
import type { Anggota } from "@/lib/types"
import { PageHeader } from "@/components/shared/shell-layout"
import { EmptyState, StatusBadge } from "@/components/shared/ui-helpers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  Loader2,
  Users,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldX,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type FormState = {
  namaAnggota: string
  jenisKelamin: "L" | "P"
  email: string
  password: string
  noTelepon: string
  alamat: string
  tanggalLahir: string
  statusAnggota: "Aktif" | "Nonaktif"
}

const emptyForm: FormState = {
  namaAnggota: "",
  jenisKelamin: "L",
  email: "",
  password: "",
  noTelepon: "",
  alamat: "",
  tanggalLahir: "",
  statusAnggota: "Aktif",
}

function toDateInput(s?: string | null): string {
  if (!s) return ""
  const d = new Date(s)
  if (isNaN(d.getTime())) return ""
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function KelaminBadge({ jk }: { jk: "L" | "P" }) {
  const tone =
    jk === "L"
      ? "bg-primary/10 text-primary border-primary/20"
      : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        tone,
      )}
    >
      {jk === "L" ? "Laki-laki" : "Perempuan"}
    </span>
  )
}

export function AnggotaView() {
  const [list, setList] = useState<Anggota[]>([])
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)

  // Filter
  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Create / Edit dialog
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Anggota | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // Detail dialog
  const [detailTarget, setDetailTarget] = useState<Anggota | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailData, setDetailData] = useState<Anggota | null>(null)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Anggota | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Verify in-flight tracking (by id)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)

  const detailOpen = useRef(false)

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (q.trim()) params.set("q", q.trim())
      const qs = params.toString()
      const data = await api.get<Anggota[]>(`/api/anggota${qs ? `?${qs}` : ""}`)
      // GET /api/anggota does not return _count.peminjaman, so enrich via
      // parallel detail fetches (small N, parallel).
      const enriched = await Promise.all(
        data.map(async (a) => {
          try {
            const detail = await api.get<Anggota>(`/api/anggota/${a.idAnggota}`)
            return { ...a, _count: detail._count }
          } catch {
            return a
          }
        }),
      )
      setList(enriched)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal memuat anggota"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [q, statusFilter])

  useEffect(() => {
    loadList()
  }, [loadList, refresh])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(a: Anggota) {
    setEditing(a)
    setForm({
      namaAnggota: a.namaAnggota,
      jenisKelamin: a.jenisKelamin,
      email: a.email,
      password: "",
      noTelepon: a.noTelepon ?? "",
      alamat: a.alamat ?? "",
      tanggalLahir: toDateInput(a.tanggalLahir),
      statusAnggota: a.statusAnggota,
    })
    setOpen(true)
  }

  async function handleOpenDetail(a: Anggota) {
    setDetailTarget(a)
    setDetailData(null)
    detailOpen.current = true
    setDetailLoading(true)
    try {
      const data = await api.get<Anggota>(`/api/anggota/${a.idAnggota}`)
      setDetailData(data)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal memuat detail"
      toast.error(msg)
      setDetailTarget(null)
      detailOpen.current = false
    } finally {
      setDetailLoading(false)
    }
  }

  function closeDetail() {
    setDetailTarget(null)
    setDetailData(null)
    detailOpen.current = false
  }

  async function handleVerify(a: Anggota) {
    const newStatus: "Aktif" | "Nonaktif" =
      a.statusAnggota === "Aktif" ? "Nonaktif" : "Aktif"
    setVerifyingId(a.idAnggota)
    try {
      await api.patch(`/api/anggota/${a.idAnggota}/verify`, {
        status: newStatus,
      })
      toast.success(
        newStatus === "Aktif"
          ? `Anggota ${a.namaAnggota} diaktifkan`
          : `Anggota ${a.namaAnggota} dinonaktifkan`,
      )
      setRefresh((r) => r + 1)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal memverifikasi"
      toast.error(msg)
    } finally {
      setVerifyingId(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.namaAnggota.trim()) {
      toast.error("Nama anggota wajib diisi")
      return
    }
    if (!form.email.trim()) {
      toast.error("Email wajib diisi")
      return
    }
    if (!editing && !form.password) {
      toast.error("Password wajib diisi")
      return
    }

    setSubmitting(true)
    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          namaAnggota: form.namaAnggota.trim(),
          jenisKelamin: form.jenisKelamin,
          email: form.email.trim(),
          noTelepon: form.noTelepon.trim() || null,
          alamat: form.alamat.trim() || null,
          tanggalLahir: form.tanggalLahir
            ? new Date(form.tanggalLahir).toISOString()
            : null,
        }
        if (form.password) payload.password = form.password
        await api.put(`/api/anggota/${editing.idAnggota}`, payload)
        toast.success("Data anggota diperbarui")
      } else {
        await api.post("/api/anggota", {
          namaAnggota: form.namaAnggota.trim(),
          jenisKelamin: form.jenisKelamin,
          email: form.email.trim(),
          password: form.password,
          noTelepon: form.noTelepon.trim() || null,
          alamat: form.alamat.trim() || null,
          tanggalLahir: form.tanggalLahir || null,
          statusAnggota: form.statusAnggota,
        })
        toast.success("Anggota ditambahkan")
      }
      setOpen(false)
      setRefresh((r) => r + 1)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menyimpan anggota"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.del(`/api/anggota/${deleteTarget.idAnggota}`)
      toast.success("Anggota dihapus")
      setDeleteTarget(null)
      setRefresh((r) => r + 1)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menghapus anggota"
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Kelola Anggota"
        description="Verifikasi dan kelola data anggota perpustakaan."
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" /> Tambah Anggota
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama / email / ID anggota..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="Aktif">Aktif</SelectItem>
            <SelectItem value="Nonaktif">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Anggota</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>No. Telepon</TableHead>
              <TableHead>Tgl Daftar</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Riwayat Pinjam</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
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
                    icon={Users}
                    title="Belum ada anggota"
                    description="Tambahkan anggota baru atau ubah filter pencarian."
                  />
                </TableCell>
              </TableRow>
            ) : (
              list.map((a) => {
                const isNonaktif = a.statusAnggota === "Nonaktif"
                return (
                  <TableRow
                    key={a.idAnggota}
                    className={cn(
                      isNonaktif &&
                        "bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100/70 dark:hover:bg-amber-950/30",
                    )}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {a.idAnggota}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{a.namaAnggota}</span>
                        <KelaminBadge jk={a.jenisKelamin} />
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.noTelepon || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(a.tanggalDaftar)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={a.statusAnggota} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {a._count?.peminjaman ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Aksi"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => handleOpenDetail(a)}
                          >
                            <Eye className="size-4 mr-2" /> Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleVerify(a)}
                            disabled={verifyingId === a.idAnggota}
                          >
                            {isNonaktif ? (
                              <>
                                <ShieldCheck className="size-4 mr-2" /> Aktifkan
                              </>
                            ) : (
                              <>
                                <ShieldX className="size-4 mr-2" /> Nonaktifkan
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(a)}>
                            <Pencil className="size-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(a)}
                          >
                            <Trash2 className="size-4 mr-2" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog Create / Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Anggota" : "Tambah Anggota"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Perbarui data anggota. Kosongkan password jika tidak ingin mengubah."
                : "Isi data anggota baru perpustakaan."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="namaAnggota">Nama Anggota</Label>
              <Input
                id="namaAnggota"
                value={form.namaAnggota}
                onChange={(e) =>
                  setForm({ ...form, namaAnggota: e.target.value })
                }
                placeholder="cth: Siti Nurhaliza"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
                <Select
                  value={form.jenisKelamin}
                  onValueChange={(v: "L" | "P") =>
                    setForm({ ...form, jenisKelamin: v })
                  }
                >
                  <SelectTrigger id="jenisKelamin" className="w-full">
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                <Input
                  id="tanggalLahir"
                  type="date"
                  value={form.tanggalLahir}
                  onChange={(e) =>
                    setForm({ ...form, tanggalLahir: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="anggota@email.com"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="noTelepon">No. Telepon</Label>
                <Input
                  id="noTelepon"
                  value={form.noTelepon}
                  onChange={(e) =>
                    setForm({ ...form, noTelepon: e.target.value })
                  }
                  placeholder="cth: 081234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password
                  {editing && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (kosongkan jika tidak diubah)
                    </span>
                  )}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder={editing ? "••••••••" : "Min. 6 karakter"}
                  required={!editing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Textarea
                id="alamat"
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                placeholder="Alamat lengkap anggota..."
                rows={2}
              />
            </div>

            {!editing && (
              <div className="space-y-2">
                <Label htmlFor="statusAnggota">Status Anggota</Label>
                <Select
                  value={form.statusAnggota}
                  onValueChange={(v: "Aktif" | "Nonaktif") =>
                    setForm({ ...form, statusAnggota: v })
                  }
                >
                  <SelectTrigger id="statusAnggota" className="w-full">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aktif">Aktif</SelectItem>
                    <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

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
                {editing ? "Simpan Perubahan" : "Tambah Anggota"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Detail */}
      <Dialog
        open={!!detailTarget}
        onOpenChange={(o) => !o && closeDetail()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Anggota</DialogTitle>
            <DialogDescription>
              Informasi lengkap anggota perpustakaan.
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          ) : detailData ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-base">
                    {detailData.namaAnggota}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {detailData.idAnggota}
                  </p>
                </div>
                <StatusBadge status={detailData.statusAnggota} />
              </div>
              <Separator />
              <DetailRow label="Jenis Kelamin">
                {detailData.jenisKelamin === "L"
                  ? "Laki-laki"
                  : "Perempuan"}
              </DetailRow>
              <DetailRow label="Email">{detailData.email}</DetailRow>
              <DetailRow label="No. Telepon">
                {detailData.noTelepon || "-"}
              </DetailRow>
              <DetailRow label="Tanggal Lahir">
                {formatDate(detailData.tanggalLahir)}
              </DetailRow>
              <DetailRow label="Tanggal Daftar">
                {formatDate(detailData.tanggalDaftar)}
              </DetailRow>
              <DetailRow label="Alamat">
                {detailData.alamat || "-"}
              </DetailRow>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Riwayat Peminjaman</span>
                <Badge variant="secondary">
                  {detailData._count?.peminjaman ?? 0} kali
                </Badge>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDetail}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Anggota?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus anggota{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.namaAnggota}
              </span>
              ? Tindakan ini tidak dapat dibatalkan. Anggota yang memiliki
              riwayat peminjaman tidak dapat dihapus.
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

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium break-words min-w-0">
        {children}
      </span>
    </div>
  )
}
