import { NextResponse } from "next/server";

const FINNHUB_API = "https://finnhub.io/api/v1/stock/market-status";

/** Proxies Finnhub market status so the API key stays server-side. */
export async function GET() {
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
    return NextResponse.json(
      { error: "Finnhub market status request failed", details: body },
      { status: upstream.status },
    );
  }

  const data: unknown = await upstream.json();
  return NextResponse.json(data);
}
