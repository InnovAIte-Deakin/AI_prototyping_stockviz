import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type ProxySupabaseClient = {
  supabase: ReturnType<typeof createServerClient>;
  getResponse: () => NextResponse;
};

const getSupabaseEnv = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
  };
};

export const createProxySupabaseClient = (request: NextRequest): ProxySupabaseClient => {
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
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  return {
    supabase,
    getResponse: () => response,
  };
};
