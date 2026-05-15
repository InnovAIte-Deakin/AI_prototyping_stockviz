import { NextResponse } from "next/server";

import { upstreamErrorResponse } from "@/lib/api/upstream-errors";
import { validateQuoteSymbol } from "@/lib/finnhub/quote";
import { enforceRateLimit } from "@/lib/rate-limit";

const FINNHUB_AGGREGATE_TECHNICAL_URL =
  "https://finnhub.io/api/v1/scan/technical-indicator";

const VALID_RESOLUTIONS = new Set(["1", "5", "15", "30", "60", "D", "W", "M"]);

export async function GET(request: Request) {
  const limited = enforceRateLimit(request);
  if (limited) {
    return limited;
  }

  const token = process.env.FINNHUB_API_KEY?.trim();
  if (!token) {
    return NextResponse.json(
      { error: "FINNHUB_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const symbol = validateQuoteSymbol(searchParams.get("symbol"));
  if (!symbol) {
    return NextResponse.json(
      { error: "Missing or invalid query parameter symbol" },
      { status: 400 },
    );
  }

  const requestedResolution = (
    searchParams.get("resolution") ?? "D"
  ).trim().toUpperCase();
  const resolution = VALID_RESOLUTIONS.has(requestedResolution)
    ? requestedResolution
    : "D";
  const params = new URLSearchParams({
    resolution,
    symbol,
    token,
  });

  const upstream = await fetch(`${FINNHUB_AGGREGATE_TECHNICAL_URL}?${params}`, {
    next: { revalidate: 300 },
  });
  const body = await upstream.text();

  if (!upstream.ok) {
    return upstreamErrorResponse({
      body,
      publicMessage: "Finnhub aggregate technical request failed",
      service: "Finnhub aggregate technical",
      status: upstream.status,
    });
  }

  try {
    return NextResponse.json(JSON.parse(body) as unknown);
  } catch {
    return upstreamErrorResponse({
      body,
      publicMessage: "Invalid Finnhub aggregate technical response",
      service: "Finnhub aggregate technical",
      status: 502,
    });
  }
}
