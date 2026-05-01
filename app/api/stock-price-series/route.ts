import { NextResponse } from "next/server";

import {
  buildYahooChartUrl,
  parseYahooChartResponse,
} from "@/lib/market/yahoo-finance";
import { enforceRateLimit } from "@/lib/rate-limit";

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

const validateInterval = (raw: string | null): "daily" | "monthly" | null => {
  const v = raw?.trim().toLowerCase() ?? "";
  if (v === "daily" || v === "monthly") {
    return v;
  }
  return null;
};

/** Proxies Yahoo Finance daily or monthly chart series. */
export async function GET(request: Request) {
  const limited = enforceRateLimit(request);
  if (limited) {
    return limited;
  }

  const { searchParams } = new URL(request.url);
  const symbol = validateSymbol(searchParams.get("symbol"));
  const interval = validateInterval(searchParams.get("interval"));

  if (!symbol) {
    return NextResponse.json(
      { error: "Missing or invalid query parameter symbol" },
      { status: 400 },
    );
  }

  if (!interval) {
    return NextResponse.json(
      { error: "Missing or invalid query parameter interval (daily|monthly)" },
      { status: 400 },
    );
  }

  const url = buildYahooChartUrl(symbol, interval);
  const revalidate = interval === "daily" ? 120 : 3600;

  const upstream = await fetch(url, {
    next: { revalidate },
  });

  if (!upstream.ok) {
    const body = await upstream.text();
    return NextResponse.json(
      { error: "Yahoo Finance chart request failed", details: body },
      { status: upstream.status },
    );
  }

  const raw: unknown = await upstream.json();
  const parsed = parseYahooChartResponse(raw);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 422 });
  }

  return NextResponse.json({ series: parsed.series });
}
