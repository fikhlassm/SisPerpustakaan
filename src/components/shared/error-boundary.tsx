"use client"

import React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: React.ReactNode
  /** Fallback UI kustom. Jika tidak diisi, tampilkan fallback default. */
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * ErrorBoundary — menangkap runtime error di subtree React dan menampilkan
 * UI fallback daripada membuat seluruh halaman unmount (blank screen).
 *
 * Digunakan di:
 *   - Root page.tsx (mencakup seluruh app)
 *   - Bisa juga dipakai per-view untuk isolasi yang lebih granular
 *
 * Catatan: Error Boundary harus berupa class component karena
 * `componentDidCatch` dan `getDerivedStateFromError` belum ada di hooks API.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Di production, integrasikan dengan error monitoring (Sentry, dll.)
    console.error("[ErrorBoundary] Uncaught error:", error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="mx-auto size-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="size-7 text-destructive" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Terjadi Kesalahan</h2>
              <p className="text-sm text-muted-foreground">
                Aplikasi mengalami masalah yang tidak terduga. Silakan refresh halaman atau coba
                lagi.
              </p>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-left text-xs bg-muted rounded-lg p-3">
                <summary className="cursor-pointer font-medium text-destructive mb-1">
                  Detail Error (hanya tampil di development)
                </summary>
                <pre className="whitespace-pre-wrap break-words text-muted-foreground">
                  {this.state.error.message}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={this.handleReset} className="gap-2">
                <RefreshCw className="size-4" />
                Coba Lagi
              </Button>
              <Button onClick={() => window.location.reload()}>Refresh Halaman</Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
