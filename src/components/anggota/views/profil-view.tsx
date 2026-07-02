"use client"

import { useApp } from "@/lib/store"
import { PageHeader } from "@/components/shared/shell-layout"
import { StatusBadge } from "@/components/shared/ui-helpers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  UserCircle,
  Mail,
  Hash,
  ShieldCheck,
  CircleUser,
  Info,
  CheckCircle2,
  AlertCircle,
  UserCog,
} from "lucide-react"

export function ProfilView() {
  const user = useApp((s) => s.user)

  if (!user) {
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

  const isActive = user.status === "Aktif"

  return (
    <div>
      <PageHeader title="Profil Saya" description="Informasi akun anggota perpustakaan." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CircleUser className="size-4 text-muted-foreground" />
              Informasi Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Identity header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shrink-0">
                {user.nama?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold truncate">{user.nama}</h2>
                <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  {user.email}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="secondary" className="gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Anggota
                  </Badge>
                  <StatusBadge status={user.status || "Nonaktif"} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                icon={<Hash className="size-4" />}
                label="ID Anggota"
                value={<span className="font-mono">{user.id}</span>}
              />
              <InfoRow
                icon={<UserCircle className="size-4" />}
                label="Nama Lengkap"
                value={user.nama}
              />
              <InfoRow
                icon={<Mail className="size-4" />}
                label="Email"
                value={user.email}
              />
              <InfoRow
                icon={<ShieldCheck className="size-4" />}
                label="Status Akun"
                value={<StatusBadge status={user.status || "Nonaktif"} />}
              />
            </div>

            {/* Status alert */}
            {isActive ? (
              <Alert className="border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                <AlertTitle>Akun Aktif</AlertTitle>
                <AlertDescription>
                  Akun aktif. Anda dapat meminjam buku.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400">
                <AlertCircle className="size-4" />
                <AlertTitle>Akun Belum Diverifikasi</AlertTitle>
                <AlertDescription>
                  Akun Anda belum diverifikasi. Hubungi admin perpustakaan untuk
                  mengaktifkan akun.
                </AlertDescription>
              </Alert>
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
                Untuk mengubah data profil, silakan hubungi admin perpustakaan.
              </p>
              <Separator />
              <p className="flex items-start gap-2">
                <UserCog className="size-4 mt-0.5 shrink-0" />
                <span>
                  Verifikasi akun, perubahan data diri, dan penanganan denda
                  diproses oleh petugas perpustakaan.
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
