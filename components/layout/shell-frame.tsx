'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { StockSymbolSearch } from '@/components/layout/stock-symbol-search'
import { UserNav } from '@/components/layout/user-nav'
import { cn } from '@/lib/utils'
import { Briefcase } from 'lucide-react'


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
        className="sticky top-0 z-50 w-full border-b border-[#adb3b2]/20 bg-white/80 backdrop-blur-md"
      >
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <div className="flex min-w-[7rem] shrink-0 items-center">
            <Link
              href="/dashboard"
              className="text-xl font-bold tracking-tight text-[#2d3433] transition-colors hover:text-[#5f5e5e]"
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
                "hidden sm:flex items-center gap-1.5 text-sm font-bold transition-all hover:text-[#2d3433]",
                pathname === "/portfolio" ? "text-[#2d3433] border-b-2 border-[#adb3b2] pb-0.5" : "text-[#5f5e5e]"
              )}
            >
              <Briefcase className="size-4" />
              <span>Portfolio</span>
            </Link>
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  )
}
