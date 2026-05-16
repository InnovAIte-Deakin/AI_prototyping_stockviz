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
        <Button variant="ghost" className="relative h-9 w-9 p-0 hover:bg-[#f2f4f3] rounded-full transition-all flex items-center justify-center border border-[#adb3b2]/20">
          <UserIcon className="h-5 w-5 text-[#5a6060]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mt-2 border-[#adb3b2]/20 bg-white shadow-xl" align="end" forceMount>
        <DropdownMenuLabel className="font-normal px-2 py-1.5">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none text-[#2d3433]">{name}</p>
            <p className="text-xs leading-none text-[#5a6060]">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#adb3b2]/10" />
        <DropdownMenuItem 
          className="flex items-center px-2 py-2 text-sm font-medium text-[#5a6060]! cursor-pointer transition-colors focus:bg-[#f2f4f3]! focus:text-[#2d3433]! data-[highlighted]:bg-[#f2f4f3]! data-[highlighted]:text-[#2d3433]!"
          onClick={() => router.push('/portfolio')}
        >
          <UserIcon className="mr-2 h-4 w-4 text-[#2d3433]! stroke-[#2d3433]!" />
          <span className="text-inherit!">View Portfolio</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#adb3b2]/10" />
        <form action={signOut}>
          <DropdownMenuItem 
            variant="destructive"
            className="flex items-center px-2 py-2 text-sm font-bold text-[#752121]! cursor-pointer transition-colors focus:bg-red-50! focus:text-[#752121]! data-[highlighted]:bg-red-50! data-[highlighted]:text-[#752121]!"
            asChild
          >
            <button type="submit" className="w-full flex items-center text-left text-[#752121]!">
              <LogOut className="mr-2 h-4 w-4 text-inherit!" />
              <span className="text-inherit!">Sign out</span>
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
