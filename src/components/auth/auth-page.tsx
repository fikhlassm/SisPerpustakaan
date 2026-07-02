"use client"

import { useState } from "react"
import { api, ApiError } from "@/lib/api-client"
import { useApp } from "@/lib/store"
import type { SessionUser } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Library, LogIn, UserPlus, ShieldCheck, Users, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function AuthPage() {
  const { setUser } = useApp()
  const [tab, setTab] = useState<"login" | "register">("login")

  // login state
  const [loginRole, setLoginRole] = useState<"admin" | "anggota">("admin")
  const [loginIdentifier, setLoginIdentifier] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  // register state
  const [reg, setReg] = useState({
    namaAnggota: "",
    jenisKelamin: "L" as "L" | "P",
    alamat: "",
    noTelepon: "",
    email: "",
    password: "",
    tanggalLahir: "",
  })
  const [regLoading, setRegLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    try {
      const res = await api.post<SessionUser>("/api/auth/login", {
        role: loginRole,
        identifier: loginIdentifier,
        password: loginPassword,
      })
      setUser(res)
      toast.success(`Selamat datang, ${res.nama}!`)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Login gagal"
      toast.error(msg)
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setRegLoading(true)
    try {
      const res = await api.post<SessionUser & { message?: string }>("/api/auth/register", {
        namaAnggota: reg.namaAnggota,
        jenisKelamin: reg.jenisKelamin,
        alamat: reg.alamat,
        noTelepon: reg.noTelepon,
        email: reg.email,
        password: reg.password,
        tanggalLahir: reg.tanggalLahir || undefined,
      })
      setUser(res)
      toast.success(res.message || "Pendaftaran berhasil!")
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Pendaftaran gagal"
      toast.error(msg)
    } finally {
      setRegLoading(false)
    }
  }

  function fillDemo(role: "admin" | "anggota") {
    setLoginRole(role)
    if (role === "admin") {
      setLoginIdentifier("admin1")
      setLoginPassword("admin123")
    } else {
      setLoginIdentifier("siti@ub.ac.id")
      setLoginPassword("anggota123")
    }
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      {/* Branding side */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)",
          backgroundSize: "48px 48px, 36px 36px",
        }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="size-12 rounded-xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center">
            <Library className="size-7" />
          </div>
          <div>
            <p className="font-semibold text-lg leading-tight">Perpustakaan UNAIR</p>
            <p className="text-sm text-primary-foreground/80">Sistem Informasi Peminjaman Buku</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Kelola koleksi, anggota,<br />dan peminjaman buku dalam satu sistem.
          </h1>
          <p className="text-primary-foreground/85 text-lg max-w-md">
            Platform terpadu untuk admin perpustakaan dan anggota — dari pencatatan katalog,
            verifikasi anggota, hingga pelacakan pengembalian dan denda.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-md pt-4">
            <Feature icon={<BookOpen className="size-5" />} title="Katalog" desc="Pencarian buku cepat" />
            <Feature icon={<Users className="size-5" />} title="Anggota" desc="Verifikasi & kelola" />
            <Feature icon={<ShieldCheck className="size-5" />} title="Denda" desc="Otomatis & akurat" />
          </div>
        </div>

        <p className="relative z-10 text-sm text-primary-foreground/70">
          Kelompok 9 · S1 Sistem Informasi · Universitas Airlangga 2026
        </p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
              <Library className="size-6" />
            </div>
            <div>
              <p className="font-semibold leading-tight">Perpustakaan UNAIR</p>
              <p className="text-xs text-muted-foreground">Sistem Peminjaman Buku</p>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login"><LogIn className="size-4 mr-2" />Masuk</TabsTrigger>
              <TabsTrigger value="register"><UserPlus className="size-4 mr-2" />Daftar</TabsTrigger>
            </TabsList>

            {/* LOGIN */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Masuk ke Akun</CardTitle>
                  <CardDescription>Pilih peran lalu masukkan kredensial Anda.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Masuk sebagai</Label>
                      <Select value={loginRole} onValueChange={(v) => setLoginRole(v as "admin" | "anggota")}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin Perpustakaan</SelectItem>
                          <SelectItem value="anggota">Anggota</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="identifier">
                        {loginRole === "admin" ? "Username" : "Email"}
                      </Label>
                      <Input
                        id="identifier"
                        type={loginRole === "admin" ? "text" : "email"}
                        placeholder={loginRole === "admin" ? "admin1" : "siti@ub.ac.id"}
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loginLoading}>
                      {loginLoading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <LogIn className="size-4 mr-2" />}
                      Masuk
                    </Button>
                  </form>

                  <div className="mt-5 pt-5 border-t">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                      <AlertCircle className="size-3.5" />Akun demo — klik untuk isi otomatis:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => fillDemo("admin")}>
                        Admin
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => fillDemo("anggota")}>
                        Anggota
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* REGISTER */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Daftar Anggota Baru</CardTitle>
                  <CardDescription>
                    Akun baru berstatus <b>Nonaktif</b> hingga diverifikasi admin.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nama">Nama Lengkap</Label>
                      <Input id="nama" required value={reg.namaAnggota} onChange={(e) => setReg({ ...reg, namaAnggota: e.target.value })} placeholder="Nama lengkap Anda" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Jenis Kelamin</Label>
                        <Select value={reg.jenisKelamin} onValueChange={(v) => setReg({ ...reg, jenisKelamin: v as "L" | "P" })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="L">Laki-laki</SelectItem>
                            <SelectItem value="P">Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tgl">Tanggal Lahir</Label>
                        <Input id="tgl" type="date" value={reg.tanggalLahir} onChange={(e) => setReg({ ...reg, tanggalLahir: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" required value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} placeholder="email@ub.ac.id" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notelp">No. Telepon</Label>
                      <Input id="notelp" value={reg.noTelepon} onChange={(e) => setReg({ ...reg, noTelepon: e.target.value })} placeholder="0812xxxx" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alamat">Alamat</Label>
                      <Input id="alamat" value={reg.alamat} onChange={(e) => setReg({ ...reg, alamat: e.target.value })} placeholder="Jl. ..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regpass">Password</Label>
                      <Input id="regpass" type="password" required value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} placeholder="Minimal 6 karakter" minLength={6} />
                    </div>
                    <Button type="submit" className="w-full" disabled={regLoading}>
                      {regLoading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <UserPlus className="size-4 mr-2" />}
                      Daftar Sekarang
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg bg-primary-foreground/10 backdrop-blur p-3">
      <div className="size-9 rounded-lg bg-primary-foreground/15 flex items-center justify-center mb-2">
        {icon}
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-primary-foreground/75">{desc}</p>
    </div>
  )
}
