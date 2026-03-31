'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Footer from '@/components/layout/footer'
import Navbar from '@/components/layout/navbar'

const SHELLLESS_ROUTES = new Set(['/login', '/register'])

export default function ShellFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const hideShell = pathname ? SHELLLESS_ROUTES.has(pathname) : false

  if (hideShell) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
