import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const DASHBOARD_PATH = "/dashboard";
const LOGIN_PATH = "/login";
const ROOT_PATH = "/";

const AUTH_FLOW_PAGES = new Set(["/auth/callback", "/reset-password"]);
const PUBLIC_AUTH_PAGES = new Set([LOGIN_PATH, "/register", "/forgot-password"]);

const PUBLIC_PREFIXES = ["/api"];

const PROTECTED_PREFIXES = [
  "/admin",
  "/analysis",
  DASHBOARD_PATH,
  "/market",
  "/portfolio",
  "/stock",
];

const isPathMatch = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

const isPublicPath = (pathname: string) =>
  AUTH_FLOW_PAGES.has(pathname) ||
  PUBLIC_AUTH_PAGES.has(pathname) ||
  PUBLIC_PREFIXES.some((prefix) => isPathMatch(pathname, prefix));

const isProtectedPath = (pathname: string) =>
  PROTECTED_PREFIXES.some((prefix) => isPathMatch(pathname, prefix));

export const handleAuthProxy = async (request: NextRequest) => {
  const { supabase, response } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

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

  if (AUTH_FLOW_PAGES.has(pathname)) {
    return response;
  }

  if (user && PUBLIC_AUTH_PAGES.has(pathname)) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
  }

  if (!user && isProtectedPath(pathname)) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicPath(pathname) || !isProtectedPath(pathname)) {
    return response;
  }

  return response;
};
