import { ApiError, GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

import { fetchFmpStockNews } from "@/lib/fmp/stock-news";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  explainMoveGeminiJsonSchema,
  explainMoveRequestSchema,
  explainMoveResponseSchema,
  type ExplainMoveResponse,
} from "@/lib/stocks/explain-move-schema";

const SERVER_CACHE_TTL_MS = 30 * 60 * 1000;
const MODEL_FALLBACKS = ["gemini-2.0-flash", "gemini-2.5-flash"] as const;
const serverResultCache = new Map<
  string,
  { expiresAt: number; value: ExplainMoveResponse }
>();

const SYSTEM_INSTRUCTION = `You explain a stock's large price move today for a market dashboard.

Use only the supplied stock move data and supplied recent news.
Do not invent facts.
Do not claim certainty unless evidence is strong.
If there is no clear relevant news, say the reason is unclear and set confidence to low.
This is not financial advice.
Return JSON only.`;

const buildCacheKey = (
  symbol: string,
  changesPercentage: number,
  direction: string,
): string => {
  const day = new Date().toISOString().slice(0, 10);
  return `${symbol.toUpperCase()}|${day}|${changesPercentage.toFixed(
    2,
  )}|${direction}`;
};

const resolveModelCandidates = (): string[] => {
  const preferred = process.env.GEMINI_EXPLAIN_MODEL?.trim();
  const ordered = preferred
    ? [preferred, ...MODEL_FALLBACKS]
    : [...MODEL_FALLBACKS];
  const seen = new Set<string>();
  const out: string[] = [];

  for (const model of ordered) {
    if (!seen.has(model)) {
      seen.add(model);
      out.push(model);
    }
  }

  return out;
};

const buildUserPrompt = (params: {
  asOfIso: string;
  change: number;
  changesPercentage: number;
  companyName: string;
  direction: "gainer" | "loser";
  exchange: string | null;
  news: Awaited<ReturnType<typeof fetchFmpStockNews>>;
  price: number;
  symbol: string;
}): string => {
  const newsBlock =
    params.news.length === 0
      ? "(No recent FMP news articles were returned for this symbol.)"
      : params.news
          .slice(0, 8)
          .map((article, index) =>
            [
              `Article ${index + 1}:`,
              `  headline: ${article.title ?? "(no title)"}`,
              `  source: ${article.site ?? "(unknown)"}`,
              `  url: ${article.url ?? ""}`,
              `  publishedDate: ${article.publishedDate ?? ""}`,
              `  snippet: ${(article.text ?? "").slice(0, 600)}`,
            ].join("\n"),
          )
          .join("\n\n");

  return `Stock move data (as of ${params.asOfIso} UTC):
- symbol: ${params.symbol}
- companyName: ${params.companyName}
- direction: ${params.direction}
- current price: ${params.price}
- absolute price change: ${params.change}
- percentage change: ${params.changesPercentage}%
- exchange: ${params.exchange ?? "unknown"}

Recent FMP news:
${newsBlock}

Return JSON only matching the requested schema.`;
};

const isRetryableCapacityError = (error: unknown): boolean => {
  if (!(error instanceof ApiError)) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.status === 429 ||
    error.status === 503 ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("resource exhausted")
  );
};

const isModelNotFoundError = (error: unknown): boolean => {
  if (!(error instanceof ApiError)) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.status === 404 ||
    (message.includes("not found") && message.includes("model"))
  );
};

const geminiFailureResponse = (error: unknown): NextResponse => {
  if (error instanceof ApiError) {
    const message = (error.message ?? "").toLowerCase();

    if (error.status === 401) {
      return NextResponse.json(
        { error: "Gemini rejected the configured API key." },
        { status: 401 },
      );
    }
    if (
      error.status === 403 &&
      (message.includes("permission_denied") ||
        message.includes("denied access") ||
        message.includes("has been denied"))
    ) {
      return NextResponse.json(
        { error: "Gemini access is denied for this project or key." },
        { status: 403 },
      );
    }
    if (error.status === 429) {
      return NextResponse.json(
        { error: "Gemini rate limit reached. Try again shortly." },
        { status: 429 },
      );
    }
    if (
      error.status === 503 ||
      message.includes("high demand") ||
      message.includes("unavailable")
    ) {
      return NextResponse.json(
        { error: "Gemini is temporarily unavailable. Try again shortly." },
        { status: 503 },
      );
    }
  }

  console.error("[explain-move] Gemini request failed");
  return NextResponse.json(
    { error: "Could not generate explanation right now." },
    { status: 500 },
  );
};

export async function POST(request: Request) {
  const limited = enforceRateLimit(request);
  if (limited) {
    return limited;
  }

  const fmpKey = process.env.FMP_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  if (!fmpKey || !geminiKey) {
    return NextResponse.json(
      {
        error:
          "Server is missing API configuration. Set FMP_API_KEY and GEMINI_API_KEY.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = explainMoveRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { details: parsed.error.flatten(), error: "Invalid request body" },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const cacheKey = buildCacheKey(
    input.symbol,
    input.changesPercentage,
    input.direction,
  );
  const cached = serverResultCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.value);
  }

  const signal = request.signal;
  let news: Awaited<ReturnType<typeof fetchFmpStockNews>> = [];

  try {
    news = await fetchFmpStockNews(input.symbol, fmpKey, {
      cache: "no-store",
      limit: 30,
      signal,
    });
  } catch {
    news = [];
  }

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const prompt = buildUserPrompt({
    asOfIso: new Date().toISOString(),
    change: input.change,
    changesPercentage: input.changesPercentage,
    companyName: input.companyName,
    direction: input.direction,
    exchange: input.exchange?.trim() ?? null,
    news,
    price: input.price,
    symbol: input.symbol.toUpperCase(),
  });

  for (const model of resolveModelCandidates()) {
    if (signal.aborted) {
      return new NextResponse(null, { status: 408 });
    }

    try {
      const response = await ai.models.generateContent({
        config: {
          abortSignal: signal,
          responseJsonSchema: explainMoveGeminiJsonSchema,
          responseMimeType: "application/json",
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.35,
        },
        contents: prompt,
        model,
      });
      const rawText = response.text?.trim();
      if (!rawText) continue;

      const output = explainMoveResponseSchema.safeParse(JSON.parse(rawText));
      if (!output.success) continue;

      const value: ExplainMoveResponse = {
        ...output.data,
        companyName: input.companyName,
        direction: input.direction,
        symbol: input.symbol.toUpperCase(),
      };

      serverResultCache.set(cacheKey, {
        expiresAt: Date.now() + SERVER_CACHE_TTL_MS,
        value,
      });

      return NextResponse.json(value);
    } catch (error) {
      if (signal.aborted) {
        return new NextResponse(null, { status: 408 });
      }
      if (isRetryableCapacityError(error) || isModelNotFoundError(error)) {
        continue;
      }
      return geminiFailureResponse(error);
    }
  }

  return NextResponse.json(
    {
      error:
        "Gemini could not complete this request. Wait a moment and retry, or set GEMINI_EXPLAIN_MODEL.",
    },
    { status: 503 },
  );
}
