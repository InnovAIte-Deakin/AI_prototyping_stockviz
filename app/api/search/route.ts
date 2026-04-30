import type { NextRequest } from "next/server";

import runtime from "@/lib/analysis/runtime";
import { enforceRateLimit } from "@/lib/rate-limit";

const { searchService } = runtime;

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request);
  if (limited) {
    return limited;
  }

  const query = request.nextUrl.searchParams.get("query") || "";
  const response = await searchService.searchSymbols(query);

  return Response.json(response, {
    status: response.status === "error" ? 400 : 200,
  });
}
