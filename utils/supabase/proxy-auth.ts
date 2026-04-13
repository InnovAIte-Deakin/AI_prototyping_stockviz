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
  const response = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // 1. Auth Flow Pages: Always allow these regardless of session.
  // We don't want to redirect users away from these during the flow.
  const AUTH_FLOW_PAGES = new Set(["/auth/callback", "/reset-password", "/forgot-password"]);
  if (AUTH_FLOW_PAGES.has(pathname)) {
    return response;
  }

  // After updateSession, check if a session exists by reading the cookie.
  // We avoid a second Supabase network call; the session cookie presence is
  // sufficient for proxy-level gating. Server Components/Actions should still
  // call getUser() for authorization on sensitive operations.
  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

  if (pathname === ROOT_PATH) {
    const targetPath = hasSession ? DASHBOARD_PATH : LOGIN_PATH;
    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  if (hasSession && PUBLIC_PAGES.has(pathname)) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
  }

  if (!hasSession && !PUBLIC_PAGES.has(pathname)) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  return response;
};
