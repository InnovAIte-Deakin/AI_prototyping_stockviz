'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { LogOut, User as UserIcon } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/auth/actions'
import type { User } from '@supabase/supabase-js'

export function UserNav() {
  const router = useRouter()
  const [user, setUser] = React.useState<User | null>(null)
  const [profile, setProfile] = React.useState<Record<string, unknown> | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        setProfile(profile)
      }
    }
    getUser()
  }, [supabase])

  if (!user) return null

  const name = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 p-0 hover:bg-muted rounded-full transition-all flex items-center justify-center border border-border/20">
          <UserIcon className="h-5 w-5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mt-2 border-border/20 bg-card shadow-xl" align="end" forceMount>
        <DropdownMenuLabel className="font-normal px-2 py-1.5">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none text-foreground">{name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-muted-foreground/10" />
        <DropdownMenuItem
          className="flex items-center px-2 py-2 text-sm font-medium text-muted-foreground! cursor-pointer transition-colors focus:bg-muted! focus:text-foreground! data-[highlighted]:bg-muted! data-[highlighted]:text-foreground!"
          onClick={() => router.push('/portfolio')}
        >
          <UserIcon className="mr-2 h-4 w-4 text-foreground! stroke-[var(--foreground)]!" />
          <span className="text-inherit!">View Portfolio</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-muted-foreground/10" />
        <form action={signOut}>
          <DropdownMenuItem
            variant="destructive"
            className="flex items-center px-2 py-2 text-sm font-bold text-destructive! cursor-pointer transition-colors focus:bg-destructive/10! focus:text-destructive! data-[highlighted]:bg-destructive/10! data-[highlighted]:text-destructive!"
            asChild
          >
            <button type="submit" className="w-full flex items-center text-left text-destructive!">
              <LogOut className="mr-2 h-4 w-4 text-inherit!" />
              <span className="text-inherit!">Sign out</span>
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
