import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Auth callback route handler.
 *
 * Supabase password-reset (and email confirmation) emails contain a `code`
 * query parameter that must be exchanged server-side for a session. This
 * route performs that exchange, then redirects to the intended page
 * (e.g. /reset-password) with a valid session already set in cookies.
 *
 * We build the Supabase client directly here (instead of using the shared
 * createClient helper) because we need to write session cookies onto the
 * NextResponse.redirect() object. The shared helper uses cookies() from
 * next/headers, which doesn't attach to custom NextResponse objects.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  console.log(`[Auth Callback] Code: ${code ? "PRESENT" : "MISSING"}, Origin: ${origin}, Next: ${next}`);

  if (code) {
    const redirectUrl = new URL(next, origin);
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error(`[Auth Callback] Exchange Error: ${error.message}`);
    } else {
      console.log(`[Auth Callback] Success! Redirecting to ${next}`);
      return response;
    }
  }

  // Pass through any error from Supabase (e.g. expired link) so the login
  // page can display a helpful message instead of a silent redirect.
  const errorDescription = searchParams.get("error_description");
  const loginUrl = new URL("/login", origin);
  if (errorDescription) {
    loginUrl.searchParams.set("error", errorDescription);
  }
  return NextResponse.redirect(loginUrl);
}
