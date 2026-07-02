# Task 16 — Anggota shell + 5 views (full-stack-developer)

## What I did
Built the Anggota (member) side of the Library Book Borrowing Information System: the AnggotaShell + 5 views (katalog, status, riwayat, denda, profil). Mirrored the AdminShell pattern using `ShellLayout`, `PageHeader`, `StatCard`, `EmptyState`, `StatusBadge`. All UI text in Indonesian, emerald theme, responsive.

## Files created (exactly 6)
1. `src/components/anggota/anggota-shell.tsx` — AnggotaShell mirroring AdminShell with 5 nav items (BookOpen, BookMarked, History, CircleDollarSign, UserCircle), "Anggota" badge + nama + Logout header, same footer.
2. `src/components/anggota/views/katalog-view.tsx` — browse + borrow books. Debounced search (300ms) + kategori Select filter. Responsive card grid with gradient header strip + kategori badge, judul/pengarang/penerbit, stok badge (emerald "Tersedia (n)" / red "Habis"), max-3 checkbox selection. Sticky bottom borrow bar. AlertDialog confirm. POST /api/peminjaman → toast + clear + refetch active loan + switch to "status". Fetches /api/auth/me on mount to check fresh status; shows destructive alert if Nonaktif. Shows amber alert + disables selection if active loan exists.
3. `src/components/anggota/views/status-view.tsx` — active loan display. Fetches /api/peminjaman/anggota/[myId], finds statusPinjam="Dipinjam". EmptyState with "Jelajah Katalog" CTA when none. Card with ID + Dipinjam badge + tgl pinjam, prominent jatuh tempo card (red + denda calc if overdue via hariTerlambat), book list with "Belum dikembalikan" badges, info note about admin-processed returns, refresh button (RotateCw).
4. `src/components/anggota/views/riwayat-view.tsx` — loan history. Tabs (Semua/Dipinjam/Selesai) filtering client-side. Cards per peminjaman with ID + StatusBadge, 3-col date grid (Pinjam/Jatuh Tempo/Kembali), book list with status badges, denda summary box (formatRupiah + StatusBadge statusPembayaran, "Bayar di perpustakaan" note for Belum Bayar). EmptyState with katalog CTA.
5. `src/components/anggota/views/denda-view.tsx` — own fines. Flattens detail[].denda from /api/peminjaman/anggota/[myId]. 2 StatCards (Total Denda + Belum Lunas with count+sum). Table: ID Denda, Buku (judulBuku), Hari Telat, Total Denda, Status, Tgl Pembayaran. Amber alert "Bayar di loket perpustakaan" if any Belum Bayar. EmptyState "Tidak ada denda".
6. `src/components/anggota/views/profil-view.tsx` — read-only profile from `useApp(s => s.user)`. Card with avatar initial + nama + email + Anggota badge + status badge. Info grid (ID, Nama, Email, Status). Emerald/amber alert based on status. Side cards: "Untuk mengubah data profil, hubungi admin" note + "Aturan Peminjaman" reference.

## Conventions followed
- Every file starts with `"use client"`.
- Emerald theme (bg-primary etc.) — no indigo/blue.
- p-5/p-6 card padding, gap-4/gap-6 spacing, responsive grids (sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 for katalog).
- useEffect + useState (no TanStack Query).
- AlertDialog for confirms, sonner toasts, refetch + view switch on mutations.
- `myId = useApp(s => s.user)?.id` for /api/peminjaman/anggota/[myId].
- Used shared `ShellLayout`, `PageHeader`, `StatCard`, `EmptyState`, `StatusBadge` helpers and shadcn/ui components.

## Lint result
- All 6 new files pass ESLint cleanly (`npx eslint <6 files>` → 0 issues).
- `bun run lint` still exits 1 with 5 errors, but ALL 5 errors are pre-existing in `src/components/shared/shell-layout.tsx` (created in Task 10-11): `react-hooks/static-components` flags `NavList` and `UserCard` being defined inside the `ShellLayout` render function. These are NOT introduced by this task and per instructions ("Do not modify existing files") I did not touch them. The orchestrator may want a separate task to refactor those inner components out.

## API endpoints exercised (verified by URL, not modified)
- GET /api/auth/me — refresh session status on katalog mount.
- GET /api/buku?q=&id_kategori= — katalog list.
- GET /api/kategori — kategori filter options.
- POST /api/peminjaman { idBukuList } — borrow submit.
- GET /api/peminjaman/anggota/[id] — active loan, riwayat, denda data source.

## Notes for next agents
- The pre-existing lint errors in shell-layout.tsx affect the whole-project lint exit code; if a CI gate fails on lint, that file needs an inner-component refactor (move NavList/UserCard outside ShellLayout or pass props). The runtime is unaffected (this rule is advisory and components work fine).
- Admin views referenced in admin-shell.tsx (dashboard/buku/kategori/anggota/peminjaman/pengembalian/denda/laporan) are still NOT created as of Task 16. The / page will crash if logged in as admin. (Outside my task scope.)
