import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { requireSupabaseServiceEnv } from "@/lib/supabase/env";

export function createAdminClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = requireSupabaseServiceEnv();

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export const createServiceRoleClient = createAdminClient;
