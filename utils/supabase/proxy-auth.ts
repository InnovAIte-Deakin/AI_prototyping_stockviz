import { NextResponse, type NextRequest } from "next/server";
import { createProxySupabaseClient } from "@/utils/supabase/server";

const DASHBOARD_PATH = "/dashboard";
const LOGIN_PATH = "/login";
const AUTH_PAGES = new Set([LOGIN_PATH, "/register"]);

export const handleAuthProxy = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;
  const { supabase, getResponse } = createProxySupabaseClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && AUTH_PAGES.has(pathname)) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
  }

  if (!user && !AUTH_PAGES.has(pathname)) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  return getResponse();
};
