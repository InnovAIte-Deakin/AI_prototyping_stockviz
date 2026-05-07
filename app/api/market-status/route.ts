import { NextResponse } from "next/server";

import { upstreamErrorResponse } from "@/lib/api/upstream-errors";
import { enforceRateLimit } from "@/lib/rate-limit";

const FINNHUB_API = "https://finnhub.io/api/v1/stock/market-status";

/** Proxies Finnhub market status so the API key stays server-side. */
export async function GET(request: Request) {
  const limited = enforceRateLimit(request);
  if (limited) {
    return limited;
  }

  const token = process.env.FINNHUB_API_KEY;
  if (!token) {
    return NextResponse.json(
      { error: "FINNHUB_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const url = `${FINNHUB_API}?${new URLSearchParams({
    exchange: "US",
    token,
  })}`;

  const upstream = await fetch(url, {
    next: { revalidate: 30 },
  });

  if (!upstream.ok) {
    const body = await upstream.text();
    return upstreamErrorResponse({
      body,
      publicMessage: "Finnhub market status request failed",
      service: "Finnhub market status",
      status: upstream.status,
    });
  }

  const data: unknown = await upstream.json();
  return NextResponse.json(data);
}
