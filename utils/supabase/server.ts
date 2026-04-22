import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { requireSupabasePublicEnv } from "@/lib/supabase/env";

type ProxySupabaseClient = {
  supabase: ReturnType<typeof createServerClient>;
  getResponse: () => NextResponse;
};

const getSupabaseEnv = () => {
  return requireSupabasePublicEnv();
};

export const createProxySupabaseClient = (
  request: NextRequest,
): ProxySupabaseClient => {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv();
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  return {
    supabase,
    getResponse: () => response,
  };
};
