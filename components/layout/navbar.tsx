'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  ArrowRight,
  BarChart3,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Sun,
} from 'lucide-react'

import { signOut } from '@/app/auth/actions'
import { StockSymbolSearch } from '@/components/layout/stock-symbol-search'
import {
  isNavItemActive,
  primaryNavItems,
} from '@/components/layout/shell-navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const themeLabel =
    theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'

  return (
    <nav
      id="main-navbar"
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        isScrolled
          ? 'border-b border-[#ddd6d0] bg-[#f9f9f8]/95 shadow-[0_14px_34px_rgba(55,49,45,0.08)] backdrop-blur-md'
          : 'bg-[#f9f9f8]/88 backdrop-blur-sm'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[4.5rem] items-center gap-3 py-3">
          <div className="flex min-w-0 items-center gap-4 lg:gap-6">
            <Link href="/dashboard" className="group flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d8d1cb] bg-white text-[#5f5e5e] shadow-[0_10px_30px_rgba(55,49,45,0.07)] transition-transform duration-300 group-hover:-translate-y-0.5">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold tracking-tight text-[#4f4e4e]">
                    StockViz
                  </span>
                  <Badge className="hidden border-[#ddd6d0] bg-[#f3eeea] text-[#6a706f] lg:inline-flex">
                    Migration shell
                  </Badge>
                </div>
                <p className="hidden text-xs text-[#7b7f7f] sm:block">
                  Root app workspace
                </p>
              </div>
            </Link>

            <div className="hidden xl:flex items-center gap-1">
              {primaryNavItems.map((item) => {
                const Icon = item.icon
                const active = isNavItemActive(pathname, item)
                const statusTone =
                  item.status === 'live'
                    ? 'border-[#d4ddd8] bg-[#edf4f0] text-[#2f6b43]'
                    : 'border-[#ddd6d0] bg-[#f5f1ee] text-[#7b7f7f]'

                if (!item.href) {
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 rounded-full border border-transparent px-3 py-2 text-sm text-[#7b7f7f]"
                      aria-disabled="true"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      <Badge
                        variant="outline"
                        className={cn('rounded-full px-2 text-[11px]', statusTone)}
                      >
                        Planned
                      </Badge>
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all duration-200',
                      active
                        ? 'border-[#5f5e5e] bg-[#5f5e5e] text-white shadow-[0_10px_24px_rgba(55,49,45,0.12)]'
                        : 'border-transparent text-[#5a6060] hover:border-[#ddd6d0] hover:bg-white hover:text-[#2d3433]'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'rounded-full px-2 text-[11px]',
                        active
                          ? 'border-white/25 bg-white/10 text-white'
                          : statusTone
                      )}
                    >
                      Live
                    </Badge>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="hidden min-w-0 flex-1 justify-center md:flex">
            <StockSymbolSearch className="max-w-xl" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Badge className="hidden border-[#d7dfdb] bg-[#eef4f1] text-[#2f6b43] lg:inline-flex">
              Protected workspace
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  id="theme-toggle"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full border border-transparent text-[#5a6060] hover:border-[#ddd6d0] hover:bg-white hover:text-[#2d3433]"
                >
                  {getThemeIcon()}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setTheme('light')}
                  className="cursor-pointer"
                >
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme('dark')}
                  className="cursor-pointer"
                >
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme('system')}
                  className="cursor-pointer"
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <form action={signOut} className="hidden lg:block">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-9 rounded-full border-[#d8d1cb] bg-white px-4 text-[#5f5e5e] hover:bg-[#f3efeb]"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </form>

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  id="mobile-menu-toggle"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full border border-[#ddd6d0] bg-white text-[#5f5e5e] lg:hidden"
                >
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[320px] border-l-[#ddd6d0] bg-[#f9f9f8] sm:w-[380px]"
              >
                <SheetHeader className="px-0 pt-10">
                  <SheetTitle>Workspace navigation</SheetTitle>
                  <SheetDescription>
                    Access the live routes now and keep the upcoming migration
                    surfaces visible without linking to unfinished pages.
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 px-4">
                  <div className="rounded-[22px] border border-[#e2dbd4] bg-white p-4 shadow-[0_12px_28px_rgba(55,49,45,0.05)]">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#7b7f7f]">
                      Global search
                    </p>
                    <StockSymbolSearch className="max-w-none" />
                  </div>

                  <div className="space-y-2">
                    {primaryNavItems.map((item) => {
                      const Icon = item.icon
                      const statusText =
                        item.status === 'live' ? 'Live now' : 'Planned'
                      const statusTone =
                        item.status === 'live'
                          ? 'border-[#d7dfdb] bg-[#eef4f1] text-[#2f6b43]'
                          : 'border-[#ddd6d0] bg-[#f5f1ee] text-[#7b7f7f]'
                      const active = isNavItemActive(pathname, item)

                      if (!item.href) {
                        return (
                          <div
                            key={item.label}
                            className="rounded-[20px] border border-[#e2dbd4] bg-white px-4 py-3 text-left"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 rounded-2xl bg-[#f3eeea] p-2 text-[#5f5e5e]">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="font-medium text-[#4f4e4e]">
                                    {item.label}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'rounded-full px-2 text-[11px]',
                                      statusTone
                                    )}
                                  >
                                    {statusText}
                                  </Badge>
                                </div>
                                <p className="mt-1 text-sm leading-6 text-[#6a706f]">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            'block rounded-[20px] border px-4 py-3 transition-colors',
                            active
                              ? 'border-[#5f5e5e] bg-[#5f5e5e] text-white'
                              : 'border-[#e2dbd4] bg-white hover:bg-[#f6f3f0]'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'mt-0.5 rounded-2xl p-2',
                                active
                                  ? 'bg-white/10 text-white'
                                  : 'bg-[#f3eeea] text-[#5f5e5e]'
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-medium">{item.label}</p>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'rounded-full px-2 text-[11px]',
                                    active
                                      ? 'border-white/20 bg-white/10 text-white'
                                      : statusTone
                                  )}
                                >
                                  {statusText}
                                </Badge>
                              </div>
                              <p
                                className={cn(
                                  'mt-1 text-sm leading-6',
                                  active ? 'text-white/80' : 'text-[#6a706f]'
                                )}
                              >
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                <SheetFooter className="gap-3 border-t border-[#e2dbd4] px-4 pb-4 pt-4">
                  <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[#4f4e4e]">
                        Theme
                      </p>
                      <p className="text-xs text-[#6a706f]">{themeLabel}</p>
                    </div>
                    <div className="text-[#5f5e5e]">{getThemeIcon()}</div>
                  </div>
                  <form action={signOut}>
                    <Button
                      type="submit"
                      className="h-11 w-full rounded-full bg-[#5f5e5e] text-white hover:bg-[#4f4e4e]"
                    >
                      Sign out
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
