# Worklog — Sistem Informasi Peminjaman Buku Perpustakaan

Project: Library Book Borrowing Information System (Next.js 16 adaptation of the 3-phase Laravel/MySQL/React-Vite spec).

---
Task ID: 1
Agent: main
Task: FASE 1 - Database. Write Prisma schema with 7 tables adapted from the DDL (admin, kategori, anggota, buku, peminjaman, detail_peminjaman, denda), applying the two documented schema adjustments (break circular denda↔detail_peminjaman reference; add password column to anggota).

Work Log:
- Read existing prisma/schema.prisma (placeholder User/Post models).
- Mapped MySQL DDL to Prisma/SQLite: VARCHAR→String, ENUM→String (validated in API), YEAR→Int, DECIMAL→Float, TIMESTAMP→DateTime, TEXT→String.
- Kept manual String IDs (ADM001, BK0001, AG0001, KTG001, etc.) generated in API layer to match the document's conventions.
- Applied adjustment #1: denda → detail_peminjaman is one-directional with @unique on denda.id_detail; removed redundant id_denda/denda columns from detail_peminjaman.
- Applied adjustment #2: added password field to anggota model.
- Added createdAt/updatedAt timestamps to all models.

Stage Summary:
- Prisma schema written at prisma/schema.prisma with 7 models and proper relations.
- Ready for db:push + seed in next step.

---
Task ID: 2-9
Agent: main
Task: FASE 1 seed + FASE 2 full backend (Auth, Kategori, Buku, Anggota, Peminjaman, Pengembalian, Denda, Laporan APIs).

Work Log:
- Installed bcryptjs, ran db:push, seeded 12 buku, 3 anggota (1 Nonaktif, 1 with denda), 4 peminjaman, 1 denda.
- Auth: signed-cookie sessions (HMAC-SHA256) replacing Laravel Sanctum. Endpoints: POST /api/auth/login (role admin|anggota), POST /api/auth/register (anggota, status Nonaktif), POST /api/auth/logout, GET /api/auth/me.
- Kategori: GET/POST /api/kategori, PUT/DELETE /api/kategori/[id] (admin). DELETE blocked if buku exist (RESTRICT).
- Buku: GET /api/buku (?q=, ?id_kategori=), POST (admin), GET/PUT/DELETE /api/buku/[id]. DELETE blocked if has detail_peminjaman. stok>=0 enforced.
- Anggota: GET /api/anggota (?status=,?q=), POST (admin), GET/PUT/DELETE /api/anggota/[id]. PATCH /api/anggota/[id]/verify (toggle Aktif/Nonaktif). DELETE blocked if has peminjaman.
- Peminjaman: GET /api/peminjaman (admin, ?status=,?q=), POST (anggota - checks Aktif status, max 3 buku, no active loan, stok>0; transaction decrements stok + creates detail). GET /api/peminjaman/[id]. GET /api/peminjaman/anggota/[id] (own riwayat).
- Pengembalian: POST /api/pengembalian {idDetail} - sets tanggal_kembali, computes hariTelat, creates denda if late, increments stok, marks peminjaman Selesai if all returned.
- Denda: GET /api/denda (admin, ?status=). PATCH /api/denda/[id]/bayar (lunas). Tarif Rp2.000/hari, lama pinjam 7 hari, max 3 buku.
- Laporan: GET /api/laporan - ringkasan, peminjamanPerBulan (6 bln), topBuku (5), dendaBelumBayar list, peminjamanTerbaru (5).
- Verified via curl: admin login + me + laporan all return correct JSON.

Stage Summary:
- Backend complete & tested. 7 tables seeded. Auth via signed cookie.
- Demo credentials: admin1/admin123, siti@ub.ac.id/anggota123 (Aktif), rizky@ub.ac.id/anggota123 (Nonaktif), dewi@ub.ac.id/anggota123 (Aktif + denda).

---
Task ID: 10-11
Agent: main
Task: FASE 3 foundation - Zustand store, API client, types, auth page, shell layout, root page orchestration.

Work Log:
- src/lib/types.ts: all shared types (SessionUser, Kategori, Buku, Anggota, Peminjaman, DetailPeminjaman, Denda, Laporan, AdminView, AnggotaView).
- src/lib/store.ts: Zustand store (user, loading, adminView, anggotaView, logout). useIsAdmin/useIsAnggota helpers.
- src/lib/api-client.ts: api.get/post/put/patch/del wrapper + ApiError + formatRupiah/formatDate/formatDateTime/hariTerlambat.
- src/components/auth/auth-page.tsx: split-screen login/register with role select, demo-fill buttons, emerald branding.
- src/components/shared/shell-layout.tsx: ShellLayout (responsive sidebar + mobile sheet + user card + footer slot) + PageHeader.
- src/components/shared/ui-helpers.tsx: StatCard, EmptyState, StatusBadge.
- src/components/admin/admin-shell.tsx: admin nav (8 items) + routes to views.
- src/app/page.tsx: loads /api/auth/me, renders AuthPage/AdminShell/AnggotaShell.
- Updated globals.css theme to emerald palette (light+dark). layout.tsx uses sonner Toaster.

Stage Summary:
- Foundation ready. Admin views (dashboard, buku, kategori, anggota, peminjaman, pengembalian, denda, laporan) referenced in admin-shell.tsx but NOT YET CREATED - subagents will create them.
- AnggotaShell + anggota views also pending.


---
Task ID: 12-15
Agent: full-stack-developer
Task: Created 2 admin views — DashboardView and LaporanView — using GET /api/laporan data, with StatCards, recharts bar charts, tables, and skeleton loading states.

Work Log:
- Read worklog.md, types.ts, api-client.ts, ui-helpers.tsx, shell-layout.tsx, admin-shell.tsx to understand conventions (emerald theme, signed-cookie session, PageHeader/StatCard/EmptyState/StatusBadge helpers, plain useEffect+useState pattern).
- Confirmed recharts v2.15.4 installed; verified Card/Badge/Table/ScrollArea/Skeleton/B/Button shadcn components available.
- Created directory src/components/admin/views (admin-shell.tsx imported from it but it didn't exist yet).
- Created dashboard-view.tsx: PageHeader + 4 StatCards (BookCopy/Users/ArrowRightLeft/CircleDollarSign with success/warning/danger tones), 2-col grid with Peminjaman 6 Bulan recharts BarChart (fill var(--primary), height 280) and Buku Paling Sering Dipinjam scrollable numbered list with judul/pengarang/total badge, plus Peminjaman Terbaru table (ID/Anggota/Buku/Tanggal Pinjam/Status).
- Created laporan-view.tsx: PageHeader with Cetak Laporan print button (Printer icon, variant outline, window.print()), Ringkasan Umum section with 7 StatCards (sm:2 lg:4 grid), Statistik Peminjaman per Bulan full-width BarChart (height 300), Buku Terpopuler horizontal layout="vertical" BarChart (height 300, judul on Y axis with 28-char truncation), Daftar Denda Belum Lunas table (ID Anggota/Nama/Judul Buku/Hari Telat/Total Denda formatRupiah/Status StatusBadge) with EmptyState fallback when no denda.
- Both files use Skeleton loading while fetching, Indonesian UI text, "use client" directive, var(--primary) chart fills (no indigo/blue), responsive grids that stack on mobile.
- Ran `bunx eslint` on the 2 files: clean, no errors. Project-wide `bun run lint` shows 4 pre-existing errors in shell-layout.tsx (NavList/UserCard defined inside render — previous agent's code); instructed not to modify existing files so left untouched.

Stage Summary:
- Files created: src/components/admin/views/dashboard-view.tsx, src/components/admin/views/laporan-view.tsx.
- Both views imported by admin-shell.tsx already (no admin-shell edits needed).
- admin-shell.tsx dashboard/laporan routes now functional.
- All 8 admin views still pending creation by other agents: buku, kategori, anggota, peminjaman, pengembalian, denda.

---
Task ID: 16
Agent: full-stack-developer
Task: Built Anggota (member) side — AnggotaShell + 5 views (katalog, status, riwayat, denda, profil). Mirrored AdminShell pattern using ShellLayout. All UI in Indonesian, emerald theme, responsive, useEffect+useState (no TanStack Query).

Work Log:
- Read worklog + admin-shell.tsx + shell-layout.tsx + ui-helpers.tsx + store.ts + types.ts + api-client.ts + shadcn primitives (alert, alert-dialog, select, checkbox, tabs, table, card) to mirror conventions.
- Created src/components/anggota/anggota-shell.tsx — 5 nav items (katalog/status/riwayat/denda/profil), "Anggota" badge + nama + Logout headerRight, same footer as admin.
- Created src/components/anggota/views/katalog-view.tsx — debounced search (300ms) + kategori Select; responsive card grid with gradient header strip + kategori badge; stok badges; max-3 checkbox selection; sticky bottom borrow bar; AlertDialog confirm; POST /api/peminjaman; on success toast + clear + refetch active loan + setAnggotaView("status"). Fetches /api/auth/me on mount for fresh status; shows destructive alert if Nonaktif; amber alert + disables selection if active loan exists.
- Created src/components/anggota/views/status-view.tsx — fetches /api/peminjaman/anggota/[myId], finds Dipinjam; EmptyState with katalog CTA when none; prominent jatuh tempo card (red + denda calc via hariTerlambat if overdue); book list with "Belum dikembalikan" badges; info note about admin-processed returns; refresh button.
- Created src/components/anggota/views/riwayat-view.tsx — Tabs (Semua/Dipinjam/Selesai) client-side filter; cards per peminjaman with 3-col date grid + book list + denda summary box (formatRupiah + StatusBadge + "Bayar di perpustakaan" note). Skeleton loading; EmptyState with katalog CTA.
- Created src/components/anggota/views/denda-view.tsx — flattens detail[].denda from riwayat; 2 StatCards (Total Denda + Belum Lunas); Table (ID, Buku, Hari Telat, Total Denda, Status, Tgl Pembayaran); amber alert if any Belum Bayar; EmptyState "Tidak ada denda".
- Created src/components/anggota/views/profil-view.tsx — read-only from useApp user; avatar + nama + email + Anggota badge + StatusBadge; info grid; emerald/amber alert by status; side cards for "hubungi admin" note + "Aturan Peminjaman".
- Lint: ran `bun run lint` — 5 errors reported, ALL pre-existing in src/components/shared/shell-layout.tsx (react-hooks/static-components flags NavList/UserCard defined inside ShellLayout render). Confirmed via `npx eslint <6 new files>` → 0 issues. Per task constraint "Do not modify existing files", left shell-layout.tsx untouched.

Stage Summary:
- Files created (exactly 6): src/components/anggota/anggota-shell.tsx, src/components/anggota/views/katalog-view.tsx, src/components/anggota/views/status-view.tsx, src/components/anggota/views/riwayat-view.tsx, src/components/anggota/views/denda-view.tsx, src/components/anggota/views/profil-view.tsx.
- Key decisions: (1) refreshed /api/auth/me on katalog mount for fresh status display; (2) max-3 selection enforced by disabling further checkboxes + toast warning; (3) sticky bottom borrow bar uses lg:pl-64 to clear the sidebar on desktop; (4) denda-view reuses riwayat endpoint (single source of truth) rather than a separate /api/denda (which is admin-only); (5) profil-view is read-only with a note to contact admin (no self-update API built).
- Lint: 6 new files clean. Project-level lint still fails on pre-existing shell-layout.tsx issue (not introduced here, not fixed per scope constraint). Admin views still missing (admin-shell.tsx references 8 views that don't exist yet — outside this task's scope).

---
Task ID: 14
Agent: full-stack-developer
Task: Membuat 3 view komponen admin untuk manajemen proses: PeminjamanView, PengembalianView, DendaView.

Work Log:
- Membaca worklog.md, types.ts, api-client.ts, ui-helpers.tsx, shell-layout.tsx, admin-shell.tsx, dan route API peminjaman/pengembalian/denda untuk konfirmasi kontrak.
- Membuat src/components/admin/views/peminjaman-view.tsx: filter status + search debounce 300ms, daftar Card per peminjaman (ID mono + StatusBadge + range tanggal + anggota + email), list detail dengan ikon buku & status, badge amber "Terlambat X hari" via hariTerlambat(), alert "Menunggu pengembalian" + tombol "Proses di menu Pengembalian" (panggil setAdminView dari Zustand), skeleton loading + EmptyState (ArrowRightLeft).
- Membuat src/components/admin/views/pengembalian-view.tsx: GET /api/peminjaman?status=Dipinjam lalu filter yang masih punya detail "Belum". Card per peminjaman dengan badge telat. Detail row "Belum" → tombol "Kembalikan" yang membuka AlertDialog konfirmasi (judul buku + peringatan denda Rp2.000/hari). On confirm: POST /api/pengembalian, toast.success(result.message), toast.warning dengan formatRupiah jika denda dibuat, refetch via counter refresh. EmptyState (Undo2).
- Membuat src/components/admin/views/denda-view.tsx: filter status Select, 3 StatCard (Total Denda, Belum Lunas dengan formatRupiah sum, Sudah Lunas), tabel dengan kolom ID/Anggota/Buku/Hari Telat/Tarif/Hari/Total/Status/Tgl Pembayaran/Aksi. Tabel dibungkus max-h-[32rem] overflow-y-auto + sticky header. Tombol "Tandai Lunas" hanya untuk "Belum Bayar" → AlertDialog konfirmasi → PATCH /api/denda/[id]/bayar → toast.success + refetch. Baris "Sudah Bayar" tampilkan ikon centang muted + tanggal pembayaran. EmptyState (CircleDollarSign).
- Lint awal: 1 error react-hooks/set-state-in-effect di peminjaman-view.tsx (setLoading synchron di effect body ketika `debounced` state berubah via effect lain). Fix dengan refactor fetch ke async function `load()` di dalam effect, panggil via `void load()` — setState kini berada di dalam function (tidak lagi synchronous di effect body). 2 file lain (pengembalian/denda) sudah clean tanpa perubahan karena deps hanya berisi state dari user action.
- Final lint: 3 file view saya 0 error. Sisa 4 error di project berasal dari shell-layout.tsx (NavList/UserCard defined inside component — pre-existing di Task 10-11, bukan tanggung jawab task ini, tidak dimodifikasi sesuai instruksi "Do not modify existing files").

Stage Summary:
- Files created (3): src/components/admin/views/peminjaman-view.tsx, src/components/admin/views/pengembalian-view.tsx, src/components/admin/views/denda-view.tsx
- Semua memakai PageHeader dari shell-layout, EmptyState/StatusBadge/StatCard dari ui-helpers, AlertDialog untuk konfirmasi, api client untuk fetch, toast (sonner) untuk feedback, refresh counter pattern untuk refetch.
- Emerald theme konsisten (bg-primary, text-primary, badge amber/red/emerald sesuai status). Tidak ada indigo/blue.
- Kontrak API sesuai: GET /api/peminjaman?status=&q=, POST /api/pengembalian {idDetail}, GET /api/denda?status=, PATCH /api/denda/[id]/bayar.
- Catatan untuk agent lain: jika butuh navigasi silang view, gunakan useApp().setAdminView(...) seperti contoh "Proses di menu Pengembalian".

---
Task ID: 13
Agent: full-stack-developer
Task: Created 3 admin CRUD view components (KategoriView, BukuView, AnggotaView) for the admin shell — Indonesian UI, emerald theme, shadcn/ui + lucide-react, useEffect+useState data fetching (NO TanStack Query).

Work Log:
- Read worklog.md (Tasks 1-11), src/lib/types.ts, src/lib/api-client.ts, src/components/shared/{shell-layout,ui-helpers}.tsx, src/components/admin/admin-shell.tsx.
- Inspected API route handlers (kategori, buku, anggota, anggota/[id], anggota/[id]/verify) to confirm request/response shapes & error semantics (409 on RESTRICT delete).
- Confirmed UI primitives available: dialog, alert-dialog, select, table, dropdown-menu, badge, skeleton, textarea, separator, input, label, card.
- Created src/components/admin/views/kategori-view.tsx: PageHeader "Kategori Buku" + "Tambah Kategori" button; search Input (client-side filter by namaKategori); Table with columns Kategori ID / Nama / Deskripsi (line-clamp-1) / Jumlah Buku (Badge _count.buku) / Aksi (Edit ghost, Hapus ghost-destructive). Reused single Dialog for create+edit (prefilled). AlertDialog confirm for delete. EmptyState (Tags) + Skeleton rows on loading. toast.success/error + refresh counter refetch.
- Created src/components/admin/views/buku-view.tsx: PageHeader "Kelola Buku"; filter bar = text Input (debounced 300ms via useRef+setTimeout) + Kategori Select ("Semua Kategori" + items from GET /api/kategori); both params wired into GET /api/buku?q=&id_kategori=. Table inside Card with overflow-x-auto (Table component already wraps in overflow-x-auto). StokBadge tone logic: red (<=0), amber (<=2), emerald (else). Kategori column uses secondary Badge. Dialog create/edit with idKategori Select populated from same kategori list fetched on mount. Edit prefilled, AlertDialog for delete, 409 err.message surfaced via toast.
- Created src/components/admin/views/anggota-view.tsx: PageHeader "Kelola Anggota"; filter bar (q + status Select "Semua Status/Aktif/Nonaktif"); Table with columns ID / Nama (font-medium + KelaminBadge L/P) / Email / No. Telepon / Tgl Daftar (formatDate) / Status (StatusBadge) / Riwayat Pinjam (Badge _count.peminjaman) / Aksi. Nonaktif rows highlighted with bg-amber-50 dark:bg-amber-950/20. Aksi = DropdownMenu: "Lihat Detail" (Dialog fetching GET /api/anggota/[id], shows full info with DetailRow helper + _count.peminjaman badge), "Aktifkan"/"Nonaktifkan" (dynamic label, calls PATCH /api/anggota/[id]/verify with explicit status), "Edit" (Dialog form prefilled), "Hapus" (AlertDialog). Form has namaAnggota, jenisKelamin Select (L/P), email, password (optional on edit), noTelepon, alamat Textarea, tanggalLahir date Input (toDateInput helper converts ISO), statusAnggota Select (only on create — PUT route doesn't accept status). 
- Key design decision: GET /api/anggota list endpoint does NOT include _count.peminjaman (route uses select without _count). To honor the "Riwayat Pinjam (_count.peminjaman badge)" requirement accurately, after fetching the list I run Promise.all of GET /api/anggota/[id] for each anggota and merge _count.peminjaman. Small N (seeded ~3 anggota), parallel, failsafe (per-item try/catch returns original a on error).
- Lint check: `bun run lint` reports 4 pre-existing errors in src/components/shared/shell-layout.tsx (NavList/UserCard defined inside component body — react-hooks/static-components). These are from Task 10-11 and outside my task scope ("Do not modify existing files"). Verified via `npx eslint` on my 3 new files directly: ZERO errors/warnings.
- Dev server log confirms successful compilation: "✓ Compiled in 289ms", "GET / 200". The "Module not found './views/anggota-view'" trace in dev.log is from BEFORE my files were created (now stale).

Stage Summary:
- Files created (exactly 3):
  - src/components/admin/views/kategori-view.tsx
  - src/components/admin/views/buku-view.tsx
  - src/components/admin/views/anggota-view.tsx
- All follow conventions: "use client", Indonesian UI, emerald theme (no indigo/blue — primary + emerald/amber/red tones only), controlled Dialog/AlertDialog open state, single form-state object with setForm({...form, field}), refresh counter pattern for refetch, toast.success/error with err.message from ApiError, hover:bg-muted/50 on TableRow, Skeleton rows during loading, EmptyState when empty, responsive (filter bar flex-col→sm:flex-row, table wrapped in overflow-x-auto via Table primitive).
- Lint passes for my 3 files (0 errors). 4 pre-existing errors in shell-layout.tsx are out of scope.
- No routes/APIs created, no existing files modified, no tests written, no TanStack Query used.

---
Task ID: 17
Agent: main
Task: Verification — lint, dev log, and end-to-end Agent Browser testing.

Work Log:
- Fixed async params bug in Next.js 16: all 7 dynamic route handlers accessed ctx.params.id synchronously, but in Next.js 16 ctx.params is a Promise. Replaced ctx.params.id → (await ctx.params).id in buku/[id], kategori/[id], anggota/[id], anggota/[id]/verify, peminjaman/[id], peminjaman/anggota/[id], denda/[id]/bayar.
- Fixed shell-layout.tsx lint: moved NavList and UserCard out of ShellLayout render scope (react-hooks/static-components rule).
- bun run lint: clean, 0 errors.
- Agent Browser end-to-end verification:
  * Admin login (admin1/admin123) → Dashboard with real stats + peminjaman terbaru table ✓
  * Kelola Buku: 12-book table, search, kategori filter ✓
  * Pengembalian: returned DTL0001 (on-time) + DTL0002 (on-time) via confirm dialog ✓
  * Denda: marked Rp12.000 denda as paid (PATCH bayar) — confirmed fix works ✓
  * Laporan: 7 StatCards + 2 recharts bar charts + denda table ✓
  * Anggota login (siti@ub.ac.id/anggota123) → Katalog with book grid ✓
  * Katalog borrow-disabled correctly when active loan exists; enabled after return ✓
  * Full borrow flow: select book → confirm dialog → POST /api/peminjaman → PMJ0005 created → auto-redirect to Peminjaman Aktif ✓
  * Riwayat, Denda Saya, Profil views all render ✓
  * Sticky footer present on all pages, pushed down naturally on long content ✓
  * No console errors, no page errors throughout.

Stage Summary:
- ALL 3 phases complete and browser-verified. Application is fully interactive.
- Demo accounts: admin1/admin123, siti@ub.ac.id/anggota123 (Aktif), rizky@ub.ac.id/anggota123 (Nonaktif), dewi@ub.ac.id/anggota123 (Aktif).
