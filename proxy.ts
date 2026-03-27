import type { NextRequest } from "next/server";
import { handleAuthProxy } from "@/utils/supabase/proxy-auth";

export const proxy = async (request: NextRequest) => {
  return handleAuthProxy(request);
};

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
