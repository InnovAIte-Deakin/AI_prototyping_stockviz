'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

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
        className={cn(
          'border-b border-border/50 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80',
          'font-[family-name:var(--font-geist-sans)]'
        )}
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
            <div className="relative w-full max-w-xl">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                name="stock-search"
                placeholder="Search stocks, tickers, companies, and more…"
                className="h-9 w-full rounded-md border-border/60 bg-muted/40 pl-9 shadow-none md:text-sm"
                aria-label="Search stocks"
                autoComplete="off"
                readOnly
              />
            </div>
          </div>

          <div className="min-w-[7rem] shrink-0" aria-hidden />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  )
}
