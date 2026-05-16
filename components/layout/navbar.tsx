'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  Sun,
  Moon,
  Monitor,
  Menu,
  BarChart3,
  TrendingUp,
  BookOpen,
  Globe,
  Search,
  Activity,
  Sliders,
  Star,
} from 'lucide-react'
import { StockSymbolSearch } from '@/components/layout/stock-symbol-search'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/',
    label: 'Home',
    icon: BarChart3,
    description: 'Main dashboard',
  },
  {
    href: '/market',
    label: 'Market',
    icon: Globe,
    description: 'Market overview',
  },
  {
    href: '/portfolio',
    label: 'Portfolio',
    icon: TrendingUp,
    description: 'Portfolio management',
  },
  {
    href: '/learn',
    label: 'Learn',
    icon: BookOpen,
    description: 'Learning center',
  },
  {
    href: '/indicators',
    label: 'Indicators',
    icon: Activity,
    description: 'Technical indicators',
  },
  {
    href: '/wishlist',
    label: 'Wishlist',
    icon: Star,
    description: 'Your saved stocks',
  },
  {
    href: '/weights',
    label: 'Weights',
    icon: Sliders,
    description: 'Analysis weights',
  },
]

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

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <nav
      id="main-navbar"
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        isScrolled
          ? 'bg-card/95 backdrop-blur-md border-b border-border/20 shadow-md'
          : 'bg-background/80 backdrop-blur-sm'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-foreground">
                  StockViz
                </span>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold -mt-1">
                  Analysis Platform
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 relative group',
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-primary hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <StockSymbolSearch className="w-full" />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  id="theme-toggle"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 hover:bg-accent"
                >
                  {getThemeIcon()}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
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

            {/* Auth placeholder — Sprint 5 */}
            <div className="hidden sm:flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Sign Up
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  id="mobile-menu-toggle"
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-9 w-9 p-0"
                >
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-6 mt-8">
                  {/* Mobile Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search stocks..."
                      className="pl-10 bg-muted/50"
                    />
                  </div>

                  {/* Mobile Navigation */}
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200',
                          isActive(item.href)
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <div className="flex-1">
                          <div>{item.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
