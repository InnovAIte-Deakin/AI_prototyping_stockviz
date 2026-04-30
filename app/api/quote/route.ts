import { NextResponse } from "next/server";

import { enforceRateLimit } from "@/lib/rate-limit";

const FINNHUB_API = "https://finnhub.io/api/v1/quote";

const validateSymbol = (raw: string | null): string | null => {
  const s = raw?.trim() ?? "";
  if (!s || s.length > 32) {
    return null;
  }
  if (!/^[\w.:^-]+$/i.test(s)) {
    return null;
  }
  return s;
};

/** Proxies Finnhub `GET /quote`. */
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
  const symbol = validateSymbol(searchParams.get("symbol"));
  if (!symbol) {
    return NextResponse.json(
      { error: "Missing or invalid query parameter symbol" },
      { status: 400 },
    );
  }

  const params = new URLSearchParams({ symbol, token });
  const url = `${FINNHUB_API}?${params}`;
  const upstream = await fetch(url, {
    next: { revalidate: 30 },
  });

  if (!upstream.ok) {
    const body = await upstream.text();
    return NextResponse.json(
      { error: "Finnhub quote request failed", details: body },
      { status: upstream.status },
    );
  }

  const data: unknown = await upstream.json();
  return NextResponse.json(data);
}
