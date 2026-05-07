import { NextResponse } from "next/server";

import { upstreamErrorResponse } from "@/lib/api/upstream-errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { upsertStocks } from "@/lib/stocks/upsert-stock";

const FINNHUB_API = "https://finnhub.io/api/v1/search";

/** Proxies Finnhub symbol lookup (`/search`). */
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

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json(
      { error: "Missing or empty query parameter q" },
      { status: 400 },
    );
  }

  const exchange = searchParams.get("exchange")?.trim();
  const params = new URLSearchParams({ q, token });
  if (exchange) {
    params.set("exchange", exchange);
  }

  const url = `${FINNHUB_API}?${params}`;
  const upstream = await fetch(url, {
    next: { revalidate: 0 },
  });

  if (!upstream.ok) {
    const body = await upstream.text();
    return upstreamErrorResponse({
      body,
      publicMessage: "Finnhub symbol search request failed",
      service: "Finnhub symbol search",
      status: upstream.status,
    });
  }

  const data = (await upstream.json()) as {
    count?: number;
    result?: Array<{
      symbol?: string;
      displaySymbol?: string;
      description?: string;
    }>;
  };

  // Fire-and-forget: cache search results in the stocks table
  if (Array.isArray(data?.result) && data.result.length > 0) {
    void upsertStocks(
      data.result
        .filter((r): r is typeof r & { symbol: string } =>
          Boolean(r.displaySymbol ?? r.symbol),
        )
        .map((r) => ({
          symbol: (r.displaySymbol ?? r.symbol)!,
          name: r.description,
        })),
    );
  }

  return NextResponse.json(data);
}
