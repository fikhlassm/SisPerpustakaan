import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Perpustakaan UNAIR — Sistem Informasi Peminjaman Buku",
  description:
    "Sistem informasi peminjaman buku perpustakaan berbasis web. Kelola katalog, anggota, peminjaman, pengembalian, dan denda dalam satu platform.",
  keywords: ["perpustakaan", "peminjaman buku", "sistem informasi", "UNAIR", "Kelompok 9"],
  authors: [{ name: "Kelompok 9 - S1 Sistem Informasi UNAIR" }],
  icons: {
    // Gunakan ikon lokal dari /public — tidak ada dependency ke CDN eksternal
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
