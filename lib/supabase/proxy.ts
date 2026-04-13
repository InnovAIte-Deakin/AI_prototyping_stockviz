import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env'

export async function updateSession(request: NextRequest) {
  const supabaseUrl = getSupabaseUrl()
  const supabaseKey = getSupabasePublishableKey()

  // If Supabase is not configured, pass through without session management.
  // This allows the app to run during development without a Supabase instance.
  if (!supabaseUrl || !supabaseKey) {
    return {
      response: NextResponse.next({ request }),
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to
  // debug issues with users being randomly logged out.

  // Refresh the auth session if one exists. This keeps the user logged in.
  // No redirect logic here — that will be added in Sprint 5 (E9: Auth).
  await supabase.auth.getClaims()

  return {
    supabase,
    response: supabaseResponse,
  }
}
