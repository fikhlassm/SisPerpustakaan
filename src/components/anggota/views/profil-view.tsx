"use client"

import { useEffect, useState } from "react"
import { useApp } from "@/lib/store"
import { api, ApiError, formatDate } from "@/lib/api-client"
import type { AnggotaProfil } from "@/lib/types"
import { PageHeader } from "@/components/shared/shell-layout"
import { StatusBadge } from "@/components/shared/ui-helpers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  UserCircle,
  Mail,
  Hash,
  ShieldCheck,
  CircleUser,
  Info,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Save,
  X,
  Loader2,
  KeyRound,
  BookMarked,
} from "lucide-react"
import { toast } from "sonner"

// =====================================================
// ProfilView — implementasi Sequence Diagram 8.2.8 "Edit Profil Anggota"
//   lihatProfil()      -> GET  /api/anggota/me
//   updateProfil(data) -> PUT  /api/anggota/me
// Status akun TIDAK bisa diubah sendiri (hanya admin via /verify)
// =====================================================

export function ProfilView() {
  const user = useApp((s) => s.user)
  const setUser = useApp((s) => s.setUser)
  const [profil, setProfil] = useState<AnggotaProfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // form state
  const [form, setForm] = useState({
    namaAnggota: "",
    jenisKelamin: "L" as "L" | "P",
    alamat: "",
    noTelepon: "",
    email: "",
    tanggalLahir: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)

  async function loadProfil() {
    setLoading(true)
    try {
      const data = await api.get<AnggotaProfil>("/api/anggota/me")
      setProfil(data)
      setForm({
        namaAnggota: data.namaAnggota,
        jenisKelamin: data.jenisKelamin,
        alamat: data.alamat || "",
        noTelepon: data.noTelepon || "",
        email: data.email,
        tanggalLahir: data.tanggalLahir ? data.tanggalLahir.split("T")[0] : "",
        password: "",
      })
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal memuat profil"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfil()
  }, [])

  function startEdit() {
    if (profil) {
      setForm({
        namaAnggota: profil.namaAnggota,
        jenisKelamin: profil.jenisKelamin,
        alamat: profil.alamat || "",
        noTelepon: profil.noTelepon || "",
        email: profil.email,
        tanggalLahir: profil.tanggalLahir ? profil.tanggalLahir.split("T")[0] : "",
        password: "",
      })
    }
    setShowPassword(false)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setShowPassword(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profil) return
    if (!form.namaAnggota.trim()) {
      toast.error("Nama lengkap wajib diisi")
      return
    }
    if (!form.email.trim()) {
      toast.error("Email wajib diisi")
      return
    }
    if (form.password && form.password.length < 6) {
      toast.error("Password baru minimal 6 karakter")
      return
    }
    setSaving(true)
    try {
      // Hanya kirim field yang diubah; password hanya jika diisi
      const body: Record<string, unknown> = {
        namaAnggota: form.namaAnggota,
        jenisKelamin: form.jenisKelamin,
        alamat: form.alamat,
        noTelepon: form.noTelepon,
        email: form.email,
        tanggalLahir: form.tanggalLahir || null,
      }
      if (form.password) body.password = form.password

      const updated = await api.put<AnggotaProfil>("/api/anggota/me", body)
      setProfil(updated)
      setEditing(false)
      setShowPassword(false)
      // Update nama di session store kalau berubah
      if (updated.namaAnggota !== user?.nama || updated.email !== user?.email) {
        setUser({ ...(user as any), nama: updated.namaAnggota, email: updated.email })
      }
      toast.success("Profil berhasil diperbarui")
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal menyimpan profil"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Profil Saya" description="Informasi akun anggota perpustakaan." />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!profil) {
    return (
      <div>
        <PageHeader title="Profil Saya" description="Informasi akun anggota perpustakaan." />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Data pengguna tidak ditemukan.
          </CardContent>
        </Card>
      </div>
    )
  }

  const isActive = profil.statusAnggota === "Aktif"

  return (
    <div>
      <PageHeader
        title="Profil Saya"
        description="Informasi akun anggota perpustakaan."
        action={
          !editing ? (
            <Button onClick={startEdit}>
              <Pencil className="size-4 mr-1.5" />
              Edit Profil
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main card: read or edit mode */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CircleUser className="size-4 text-muted-foreground" />
              {editing ? "Edit Informasi Akun" : "Informasi Akun"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!editing ? (
              <div className="space-y-5">
                {/* Identity header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shrink-0">
                    {profil.namaAnggota.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold truncate">{profil.namaAnggota}</h2>
                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                      <Mail className="size-3.5" />
                      {profil.email}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="secondary" className="gap-1.5">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Anggota
                      </Badge>
                      <StatusBadge status={profil.statusAnggota} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow
                    icon={<Hash className="size-4" />}
                    label="ID Anggota"
                    value={<span className="font-mono">{profil.idAnggota}</span>}
                  />
                  <InfoRow
                    icon={<UserCircle className="size-4" />}
                    label="Nama Lengkap"
                    value={profil.namaAnggota}
                  />
                  <InfoRow
                    icon={<Mail className="size-4" />}
                    label="Email"
                    value={profil.email}
                  />
                  <InfoRow
                    icon={<UserCircle className="size-4" />}
                    label="Jenis Kelamin"
                    value={profil.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                  />
                  <InfoRow
                    icon={<Info className="size-4" />}
                    label="No. Telepon"
                    value={profil.noTelepon || "—"}
                  />
                  <InfoRow
                    icon={<Info className="size-4" />}
                    label="Tanggal Lahir"
                    value={profil.tanggalLahir ? formatDate(profil.tanggalLahir) : "—"}
                  />
                  <InfoRow
                    icon={<BookMarked className="size-4" />}
                    label="Tanggal Daftar"
                    value={formatDate(profil.tanggalDaftar)}
                  />
                  <InfoRow
                    icon={<BookMarked className="size-4" />}
                    label="Total Peminjaman"
                    value={<span className="font-semibold">{profil._count?.peminjaman ?? 0} transaksi</span>}
                  />
                </div>

                {/* Alamat full width */}
                <div className="rounded-lg border bg-card/50 p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                    <Info className="size-4" />
                    Alamat
                  </p>
                  <p className="text-sm font-medium">{profil.alamat || "—"}</p>
                </div>

                {/* Status alert */}
                {isActive ? (
                  <Alert className="border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    <AlertTitle>Akun Aktif</AlertTitle>
                    <AlertDescription>
                      Akun Anda aktif. Anda dapat meminjam buku hingga 3 eksemplar sekaligus.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400">
                    <AlertCircle className="size-4" />
                    <AlertTitle>Akun Belum Diverifikasi</AlertTitle>
                    <AlertDescription>
                      Akun Anda berstatus Nonaktif. Hubungi admin perpustakaan untuk mengaktifkan
                      akun agar dapat melakukan peminjaman buku.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              // ===== EDIT MODE =====
              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b">
                  <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shrink-0">
                    {form.namaAnggota.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Hash className="size-3.5" />
                      ID Anggota: <span className="font-mono">{profil.idAnggota}</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Status: <StatusBadge status={profil.statusAnggota} />{" "}
                      <span className="text-xs">(hanya admin yang dapat mengubah status)</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama Lengkap</Label>
                    <Input
                      id="nama"
                      value={form.namaAnggota}
                      onChange={(e) => setForm({ ...form, namaAnggota: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis Kelamin</Label>
                    <Select
                      value={form.jenisKelamin}
                      onValueChange={(v) => setForm({ ...form, jenisKelamin: v as "L" | "P" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Laki-laki</SelectItem>
                        <SelectItem value="P">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telp">No. Telepon</Label>
                    <Input
                      id="telp"
                      value={form.noTelepon}
                      onChange={(e) => setForm({ ...form, noTelepon: e.target.value })}
                      placeholder="0812xxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lahir">Tanggal Lahir</Label>
                    <Input
                      id="lahir"
                      type="date"
                      value={form.tanggalLahir}
                      onChange={(e) => setForm({ ...form, tanggalLahir: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alamat">Alamat</Label>
                  <Textarea
                    id="alamat"
                    value={form.alamat}
                    onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                    placeholder="Alamat lengkap"
                    rows={2}
                  />
                </div>

                {/* Password change (optional) */}
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="flex items-center gap-1.5">
                      <KeyRound className="size-4" />
                      Password Baru (opsional)
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? "Sembunyikan" : "Ubah Password"}
                    </Button>
                  </div>
                  {showPassword && (
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Minimal 6 karakter"
                      minLength={6}
                    />
                  )}
                  {!showPassword && (
                    <p className="text-xs text-muted-foreground">
                      Password tidak diubah. Klik "Ubah Password" untuk mengganti.
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>
                    <X className="size-4 mr-1.5" />
                    Batal
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <Loader2 className="size-4 mr-1.5 animate-spin" />
                    ) : (
                      <Save className="size-4 mr-1.5" />
                    )}
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Side notes */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="size-4 text-muted-foreground" />
                Catatan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Anda dapat mengubah data profil sendiri (nama, email, telepon, alamat, tanggal
                lahir, dan password) kapan saja.
              </p>
              <Separator />
              <p className="flex items-start gap-2">
                <ShieldCheck className="size-4 mt-0.5 shrink-0" />
                <span>
                  Status keanggotaan (Aktif/Nonaktif) hanya dapat diubah oleh admin perpustakaan
                  melalui proses verifikasi.
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aturan Peminjaman</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Maksimal 3 buku per peminjaman.</p>
              <p>• Lama peminjaman 7 hari.</p>
              <p>• Denda Rp2.000/hari keterlambatan.</p>
              <p>• Hanya 1 peminjaman aktif pada satu waktu.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card/50 p-3">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <div className="mt-1 font-medium text-sm break-all">{value}</div>
    </div>
  )
}
