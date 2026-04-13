import { createBrowserClient } from '@supabase/ssr'
import { requireSupabasePublicEnv } from '@/lib/supabase/env'

export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = requireSupabasePublicEnv()

  return createBrowserClient(supabaseUrl, supabasePublishableKey)
}
