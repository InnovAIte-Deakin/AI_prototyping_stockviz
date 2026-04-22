import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublicEnv } from "@/lib/supabase/env";

import type { Database } from "@/lib/database.types";

export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = requireSupabasePublicEnv();

  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}
