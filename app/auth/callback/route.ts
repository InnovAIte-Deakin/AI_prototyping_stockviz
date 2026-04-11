import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback route handler.
 *
 * Supabase password-reset (and email confirmation) emails contain a `code`
 * query parameter that must be exchanged server-side for a session. This
 * route performs that exchange, then redirects to the intended page
 * (e.g. /reset-password) with a valid session already set in cookies.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // If code exchange failed or no code was provided, send to login
  return NextResponse.redirect(new URL("/login", origin));
}
