"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Library, LogOut, Menu } from "lucide-react"
import { cn } from "@/lib/utils"

export type NavItem = {
  key: string
  label: string
  icon: React.ReactNode
}

export function ShellLayout({
  navItems,
  currentView,
  onChangeView,
  headerRight,
  children,
  footer,
}: {
  navItems: NavItem[]
  currentView: string
  onChangeView: (v: string) => void
  headerRight?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  const { user, logout } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar (mobile) */}
      <header className="lg:hidden flex items-center justify-between gap-3 px-4 h-14 border-b bg-card sticky top-0 z-30">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto">
                <NavList
                  navItems={navItems}
                  currentView={currentView}
                  onChangeView={onChangeView}
                  onPick={() => setMobileOpen(false)}
                />
              </div>
              <UserCard user={user} logout={logout} />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <Library className="size-4" />
          </div>
          <span className="font-semibold text-sm">Perpustakaan UNAIR</span>
        </div>
        <div className="w-9" />
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-sidebar sticky top-0 h-screen">
          <div className="flex-1 overflow-y-auto">
            <NavList
              navItems={navItems}
              currentView={currentView}
              onChangeView={onChangeView}
            />
          </div>
          <UserCard user={user} logout={logout} />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 flex flex-col">
          {headerRight && (
            <div className="hidden lg:flex items-center justify-end gap-3 px-8 h-16 border-b bg-card/50 backdrop-blur sticky top-0 z-20">
              {headerRight}
            </div>
          )}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
            {children}
          </div>
          {footer && <div className="mt-auto">{footer}</div>}
        </main>
      </div>
    </div>
  )
}

function NavList({
  navItems,
  currentView,
  onChangeView,
  onPick,
}: {
  navItems: NavItem[]
  currentView: string
  onChangeView: (v: string) => void
  onPick?: () => void
}) {
  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      <div className="flex items-center gap-3 px-2 py-3 mb-2">
        <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shrink-0">
          <Library className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold leading-tight truncate">Perpustakaan UNAIR</p>
          <p className="text-xs text-muted-foreground truncate">Sistem Peminjaman Buku</p>
        </div>
      </div>

      <div className="px-2 mb-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Menu</p>
      </div>

      {navItems.map((item) => (
        <button
          key={item.key}
          onClick={() => {
            onChangeView(item.key)
            onPick?.()
          }}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
            currentView === item.key
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          {item.icon}
          <span className="truncate">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

function UserCard({
  user,
  logout,
}: {
  user: { nama?: string; role?: string; username?: string; email?: string } | null
  logout: () => void
}) {
  return (
    <div className="p-3 border-t border-sidebar-border">
      <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
        <div className="size-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold shrink-0">
          {user?.nama?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{user?.nama}</p>
          <p className="text-xs text-muted-foreground truncate">
            {user?.role === "admin" ? `@${user?.username}` : user?.email}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={logout}
          title="Keluar"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}
