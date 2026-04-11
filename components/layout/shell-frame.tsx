'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

const SHELLLESS_ROUTES = new Set(['/login', '/register', '/forgot-password', '/reset-password'])

export default function ShellFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const hideShell = pathname ? SHELLLESS_ROUTES.has(pathname) : false

  if (hideShell) {
    return <>{children}</>
  }

  return (
    <>
      <header className="border-b border-border/50 px-4 py-3">
        <p className="text-sm text-muted-foreground">Top bar stub</p>
      </header>
      <main className="flex-1">{children}</main>
    </>
  )
}
