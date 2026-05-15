import { ApiError, GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

import { filterAndRankFmpNewsForRange } from "@/lib/fmp/filter-news-by-range";
import { fetchFmpStockNews } from "@/lib/fmp/stock-news";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  explainRangeGeminiJsonSchema,
  explainRangeRequestSchema,
  explainRangeResponseSchema,
  type ExplainRangeRequest,
  type RangeExplanation,
} from "@/lib/stocks/explain-range-schema";

const MODEL_FALLBACKS = [
  "gemini-3-flash-preview",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
] as const;

const SYSTEM_INSTRUCTION = `You explain why a stock moved over a selected historical date range for a market dashboard.

Use only the supplied price data and supplied news/events.
Do not invent facts.
Do not claim certainty.
Prefer phrases like "appears linked to", "may be related to", and "likely contributed to".
If evidence is weak or no relevant news is found, say the reason is unclear and use low confidence where appropriate.
This is not financial advice.
Return JSON only.`;

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

const buildUserPrompt = (
  input: ExplainRangeRequest,
  newsForModel: ReturnType<typeof filterAndRankFmpNewsForRange>,
): string => {
  const stats = JSON.stringify(
    {
      absoluteChange: input.absoluteChange,
      biggestDownDay: input.biggestDownDay ?? null,
      biggestUpDay: input.biggestUpDay ?? null,
      companyName: input.companyName ?? null,
      direction: input.direction,
      endClose: input.endClose,
      from: input.from,
      highestClose: input.highestClose ?? null,
      lowestClose: input.lowestClose ?? null,
      percentageChange: input.percentageChange,
      startClose: input.startClose,
      symbol: input.symbol.toUpperCase(),
      to: input.to,
      volumeSpikes: input.volumeSpikes ?? null,
    },
    null,
    2,
  );

  const newsBlock =
    newsForModel.length === 0
      ? "(No FMP news articles in the selected date range were returned.)"
      : newsForModel
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

  return `Selected range price statistics (JSON):
${stats}

FMP news in range (ordered by relevance; may be empty):
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

  console.error("[explain-range] Gemini request failed");
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

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = explainRangeRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { details: parsed.error.flatten(), error: "Invalid request body" },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const signal = request.signal;
  let newsRaw: Awaited<ReturnType<typeof fetchFmpStockNews>> = [];

  try {
    newsRaw = await fetchFmpStockNews(input.symbol, fmpKey, {
      cache: "no-store",
      limit: 100,
      signal,
    });
  } catch {
    newsRaw = [];
  }

  const newsForModel = filterAndRankFmpNewsForRange(newsRaw, {
    companyName: input.companyName,
    from: input.from,
    maxItems: 8,
    symbol: input.symbol,
    to: input.to,
  });

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const userPrompt = buildUserPrompt(input, newsForModel);

  for (const model of resolveModelCandidates()) {
    if (signal.aborted) {
      return new NextResponse(null, { status: 408 });
    }

    try {
      const response = await ai.models.generateContent({
        config: {
          abortSignal: signal,
          responseJsonSchema: explainRangeGeminiJsonSchema,
          responseMimeType: "application/json",
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.35,
        },
        contents: userPrompt,
        model,
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        continue;
      }

      const output = explainRangeResponseSchema.safeParse(JSON.parse(rawText));
      if (!output.success) {
        continue;
      }

      const value: RangeExplanation = {
        ...output.data,
        companyName: input.companyName ?? output.data.companyName,
        direction: input.direction,
        from: input.from,
        symbol: input.symbol.toUpperCase(),
        to: input.to,
      };

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
