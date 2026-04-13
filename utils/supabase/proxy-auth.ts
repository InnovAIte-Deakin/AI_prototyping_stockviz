import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const DASHBOARD_PATH = "/dashboard";
const LOGIN_PATH = "/login";
const ROOT_PATH = "/";

/**
 * Public pages that unauthenticated users can access.
 * The auth callback route is handled separately below.
 */
const PUBLIC_PAGES = new Set([
  LOGIN_PATH,
  "/register",
  "/forgot-password",
  "/reset-password",
]);

export const handleAuthProxy = async (request: NextRequest) => {
  const { supabase, response } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // 1. Auth Flow Pages: Always allow these regardless of session.
  // /auth/callback handles the code exchange.
  // /reset-password is the landing page for recovery.
  const AUTH_FLOW_PAGES = new Set(["/auth/callback", "/reset-password"]);
  if (AUTH_FLOW_PAGES.has(pathname)) {
    return response;
  }

  // Use getUser() for the most reliable auth state check.
  // This ensures we're not relying on potentially stale or malformed cookies.
  let user = null;
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  if (pathname === ROOT_PATH) {
    const targetPath = user ? DASHBOARD_PATH : LOGIN_PATH;
    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  if (user && PUBLIC_PAGES.has(pathname)) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
  }

  if (!user && !PUBLIC_PAGES.has(pathname)) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  return response;
};
