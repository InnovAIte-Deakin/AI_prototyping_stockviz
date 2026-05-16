'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { StockSymbolSearch } from '@/components/layout/stock-symbol-search'
import { UserNav } from '@/components/layout/user-nav'
import { cn } from '@/lib/utils'
import { Briefcase } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/theme-toggle'


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
        className="sticky top-0 z-50 w-full border-b border-border/20 bg-card/80 backdrop-blur-md"
      >
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-[7rem] shrink-0 items-center">
            <Link
              href="/dashboard"
              className="text-xl font-bold tracking-tight text-foreground transition-colors hover:text-primary"
            >
              StockViz
            </Link>
          </div>

          <div className="flex min-w-0 flex-1 justify-center">
            <StockSymbolSearch />
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <Link
              href="/portfolio"
              className={cn(
                "hidden sm:flex items-center gap-1.5 text-sm font-bold transition-all hover:text-foreground",
                pathname === "/portfolio" ? "text-foreground border-b-2 border-border pb-0.5" : "text-primary"
              )}
            >
              <Briefcase className="size-4" />
              <span>Portfolio</span>
            </Link>
            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  )
}
