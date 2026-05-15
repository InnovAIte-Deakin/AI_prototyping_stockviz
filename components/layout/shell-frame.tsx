'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { StockSymbolSearch } from '@/components/layout/stock-symbol-search'


const SHELLLESS_ROUTES = new Set(['/login', '/register', '/forgot-password', '/reset-password'])

export default function ShellFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const hideShell = pathname ? SHELLLESS_ROUTES.has(pathname) : false

  if (hideShell) {
    return <>{children}</>
  }

  return (
    <>
      <header
        className='border-b border-border/50 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80'

      >
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <div className="flex min-w-[7rem] shrink-0 items-center">
            <Link
              href="/dashboard"
              className="text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              StockViz
            </Link>
          </div>

          <div className="flex min-w-0 flex-1 justify-center">
            <StockSymbolSearch />
          </div>

          <div className="min-w-[7rem] shrink-0" aria-hidden />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  )
}
