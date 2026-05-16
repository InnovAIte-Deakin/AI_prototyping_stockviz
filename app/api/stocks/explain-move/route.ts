/**
 * POST /api/stocks/explain-move
 *
 * Environment:
 * - FMP_API_KEY — Financial Modeling Prep API key (server only).
 * - GEMINI_API_KEY — Google AI Studio / Gemini API key (server only).
 * - GEMINI_EXPLAIN_MODEL — Optional preferred model id. If omitted, we try fast
 *   flash models in order (2.0 → 2.5) and fall back when Google returns 503
 *   overload / UNAVAILABLE.
 */

import { ApiError, GoogleGenAI } from "@google/genai"
import { NextResponse } from "next/server"

import { fetchFmpStockNews } from "@/lib/fmp/stock-news"
import {
  explainMoveGeminiJsonSchema,
  explainMoveRequestSchema,
  explainMoveResponseSchema,
  type ExplainMoveResponse,
} from "@/lib/stocks/explain-move-schema"

const SERVER_CACHE_TTL_MS = 30 * 60 * 1000
const serverResultCache = new Map<
  string,
  { value: ExplainMoveResponse; expiresAt: number }
>()

const buildCacheKey = (
  symbol: string,
  changesPercentage: number,
  direction: string
): string => {
  const day = new Date().toISOString().slice(0, 10)
  return `${symbol.toUpperCase()}|${day}|${changesPercentage.toFixed(2)}|${direction}`
}

const trimNewsForPrompt = (
  articles: Awaited<ReturnType<typeof fetchFmpStockNews>>,
  max = 8
) => articles.slice(0, max)

const buildUserPrompt = (params: {
  symbol: string
  companyName: string
  direction: "gainer" | "loser"
  price: number
  change: number
  changesPercentage: number
  exchange: string | null
  asOfIso: string
  news: ReturnType<typeof trimNewsForPrompt>
}): string => {
  const newsBlock =
    params.news.length === 0
      ? "(No recent news articles were returned for this symbol.)"
      : params.news
          .map((a, i) => {
            const lines = [
              `Article ${i + 1}:`,
              `  headline: ${a.title ?? "(no title)"}`,
              `  source: ${a.site ?? "(unknown)"}`,
              `  url: ${a.url ?? ""}`,
              `  publishedDate: ${a.publishedDate ?? ""}`,
              `  snippet: ${(a.text ?? "").slice(0, 600)}`,
            ]
            return lines.join("\n")
          })
          .join("\n\n")

  return `Stock move data (as of ${params.asOfIso} UTC):
- symbol: ${params.symbol}
- companyName: ${params.companyName}
- direction: ${params.direction}
- current price: ${params.price}
- absolute price change (from data): ${params.change}
- percentage change: ${params.changesPercentage}%
- exchange: ${params.exchange ?? "unknown"}

Recent FMP news (same order as supplied; may be empty):
${newsBlock}

Return JSON only matching the requested schema.`
}

const SYSTEM_INSTRUCTION = `You are explaining a stock's large price move today for a market dashboard.

Use only the supplied stock move data and supplied recent news. Do not invent facts. Do not claim certainty unless the evidence is very strong. Prefer language like 'appears linked to', 'likely related to', or 'may be due to'.

If there is no clear relevant news, say the reason is unclear and set confidence to low.

Classify the move into exactly one category:
earnings | guidance | analyst_rating | merger_acquisition | product_news | legal_regulatory | biotech_trial | financing_dilution | macro_sector | short_squeeze_momentum | no_clear_reason | other

Return JSON only in the exact schema requested.`

/** Fast models, in try order: prefer 2.0 flash first (often less overloaded than 2.5). */
const FLASH_MODEL_FALLBACKS = ["gemini-2.0-flash", "gemini-2.5-flash"] as const

const resolveModelCandidates = (): string[] => {
  const preferred = process.env.GEMINI_EXPLAIN_MODEL?.trim()
  const ordered = preferred
    ? [preferred, ...FLASH_MODEL_FALLBACKS]
    : [...FLASH_MODEL_FALLBACKS]
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ordered) {
    if (!seen.has(id)) {
      seen.add(id)
      out.push(id)
    }
  }
  return out
}

const isRetryableCapacityError = (err: unknown): boolean => {
  if (!(err instanceof ApiError)) return false
  const m = (err.message ?? "").toLowerCase()
  if (err.status === 429) return true
  if (err.status === 503) return true
  return (
    m.includes("unavailable") ||
    m.includes("high demand") ||
    m.includes("overloaded") ||
    m.includes("resource exhausted")
  )
}

const isModelNotFoundError = (err: unknown): boolean => {
  if (!(err instanceof ApiError)) return false
  const m = (err.message ?? "").toLowerCase()
  return err.status === 404 || (m.includes("not found") && m.includes("model"))
}

const geminiFailureResponse = (err: unknown): NextResponse => {
  if (err instanceof ApiError) {
    const msg = (err.message ?? "").toLowerCase()
    if (err.status === 401) {
      return NextResponse.json(
        {
          error:
            "Gemini rejected the API key (401). Confirm GEMINI_API_KEY in .env.local, then restart `next dev` so the server picks up the new value.",
        },
        { status: 401 }
      )
    }
    if (
      err.status === 403 &&
      (msg.includes("permission_denied") ||
        msg.includes("denied access") ||
        msg.includes("has been denied"))
    ) {
      return NextResponse.json(
        {
          error:
            "Gemini blocked this API key’s project (403 PERMISSION_DENIED). That is enforced by Google, not this app: the key or Cloud project may be restricted, suspended, or mis-issued. Create a fresh key at https://aistudio.google.com/apikey , try another Google account if needed, check Google Cloud billing / API restrictions, or contact Google support.",
        },
        { status: 403 }
      )
    }
    if (
      err.status === 404 ||
      (msg.includes("not found") && msg.includes("model"))
    ) {
      return NextResponse.json(
        {
          error: `Gemini model not found for this key. Set GEMINI_EXPLAIN_MODEL in .env.local (e.g. gemini-2.0-flash or gemini-2.5-flash) and restart the dev server.`,
        },
        { status: 502 }
      )
    }
    if (err.status === 429) {
      return NextResponse.json(
        {
          error:
            "Gemini rate limit reached (429). Wait a bit and try again, or check quota in Google AI Studio.",
        },
        { status: 429 }
      )
    }
    if (err.status === 503 || msg.includes("high demand") || msg.includes("unavailable")) {
      return NextResponse.json(
        {
          error:
            "Gemini is temporarily overloaded (503). Wait a minute and retry, or set GEMINI_EXPLAIN_MODEL to another flash model (e.g. gemini-2.0-flash).",
        },
        { status: 503 }
      )
    }
  }
  console.error("[explain-move]", err)
  return NextResponse.json(
    { error: "Could not generate explanation right now." },
    { status: 500 }
  )
}

export async function POST(request: Request) {
  const fmpKey = process.env.FMP_API_KEY?.trim()
  const geminiKey = process.env.GEMINI_API_KEY?.trim()

  if (!fmpKey || !geminiKey) {
    return NextResponse.json(
      {
        error:
          "Server is missing API configuration. Set FMP_API_KEY and GEMINI_API_KEY.",
      },
      { status: 503 }
    )
  }

  let bodyJson: unknown
  try {
    bodyJson = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = explainMoveRequestSchema.safeParse(bodyJson)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const input = parsed.data
  const cacheKey = buildCacheKey(
    input.symbol,
    input.changesPercentage,
    input.direction
  )
  const cached = serverResultCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.value)
  }

  const signal = request.signal

  let news: Awaited<ReturnType<typeof fetchFmpStockNews>> = []
  try {
    news = await fetchFmpStockNews(input.symbol, fmpKey, {
      limit: 30,
      signal,
      cache: "no-store",
    })
  } catch {
    news = []
  }

  const newsForModel = trimNewsForPrompt(news, 8)
  const asOfIso = new Date().toISOString()
  const userPrompt = buildUserPrompt({
    symbol: input.symbol.toUpperCase(),
    companyName: input.companyName,
    direction: input.direction,
    price: input.price,
    change: input.change,
    changesPercentage: input.changesPercentage,
    exchange: input.exchange?.trim() ?? null,
    asOfIso,
    news: newsForModel,
  })

  const modelCandidates = resolveModelCandidates()

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey })
    let lastError: unknown = null

    for (const model of modelCandidates) {
      if (signal.aborted) {
        return new NextResponse(null, { status: 408 })
      }
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            abortSignal: signal,
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.35,
            responseMimeType: "application/json",
            responseJsonSchema: explainMoveGeminiJsonSchema,
          },
        })

        const rawText = response.text?.trim()
        if (!rawText) {
          lastError = new Error("empty response")
          continue
        }

        let jsonUnknown: unknown
        try {
          jsonUnknown = JSON.parse(rawText)
        } catch {
          lastError = new SyntaxError("invalid json")
          continue
        }

        const outParsed = explainMoveResponseSchema.safeParse(jsonUnknown)
        if (!outParsed.success) {
          lastError = outParsed.error
          continue
        }

        const value: ExplainMoveResponse = {
          ...outParsed.data,
          symbol: input.symbol.toUpperCase(),
          companyName: input.companyName,
          direction: input.direction,
        }

        serverResultCache.set(cacheKey, {
          value,
          expiresAt: Date.now() + SERVER_CACHE_TTL_MS,
        })

        return NextResponse.json(value)
      } catch (err) {
        lastError = err
        if (signal.aborted) {
          return new NextResponse(null, { status: 408 })
        }
        if (
          isRetryableCapacityError(err) ||
          isModelNotFoundError(err)
        ) {
          console.warn(
            `[explain-move] model "${model}" failed, trying next:`,
            err instanceof ApiError ? err.message : err
          )
          continue
        }
        return geminiFailureResponse(err)
      }
    }

    console.error("[explain-move] all model candidates failed", lastError)
    return NextResponse.json(
      {
        error:
          "Gemini could not run any configured flash model (overload or validation). Wait a minute and retry, or set GEMINI_EXPLAIN_MODEL explicitly.",
      },
      { status: 503 }
    )
  } catch (err) {
    if (signal.aborted) {
      return new NextResponse(null, { status: 408 })
    }
    return geminiFailureResponse(err)
  }
}
