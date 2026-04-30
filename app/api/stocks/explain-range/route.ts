/**
 * POST /api/stocks/explain-range
 *
 * Server-only: FMP_API_KEY, GEMINI_API_KEY.
 * Optional GEMINI_EXPLAIN_MODEL — otherwise tries gemini-3-flash-preview then flash fallbacks.
 */

import { ApiError, GoogleGenAI } from "@google/genai"
import { NextResponse } from "next/server"

import { filterAndRankFmpNewsForRange } from "@/lib/fmp/filter-news-by-range"
import { fetchFmpStockNews } from "@/lib/fmp/stock-news"
import {
  explainRangeGeminiJsonSchema,
  explainRangeRequestSchema,
  explainRangeResponseSchema,
  type ExplainRangeRequest,
  type RangeExplanation,
} from "@/lib/stocks/explain-range-schema"

const MODEL_FALLBACKS = [
  "gemini-3-flash-preview",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
] as const

const resolveModelCandidates = (): string[] => {
  const preferred = process.env.GEMINI_EXPLAIN_MODEL?.trim()
  const ordered = preferred
    ? [preferred, ...MODEL_FALLBACKS]
    : [...MODEL_FALLBACKS]
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

const buildUserPrompt = (input: ExplainRangeRequest, newsForModel: ReturnType<typeof filterAndRankFmpNewsForRange>): string => {
  const stats = JSON.stringify(
    {
      symbol: input.symbol.toUpperCase(),
      companyName: input.companyName ?? null,
      from: input.from,
      to: input.to,
      startClose: input.startClose,
      endClose: input.endClose,
      absoluteChange: input.absoluteChange,
      percentageChange: input.percentageChange,
      direction: input.direction,
      highestClose: input.highestClose ?? null,
      lowestClose: input.lowestClose ?? null,
      biggestUpDay: input.biggestUpDay ?? null,
      biggestDownDay: input.biggestDownDay ?? null,
      volumeSpikes: input.volumeSpikes ?? null,
    },
    null,
    2
  )

  const newsBlock =
    newsForModel.length === 0
      ? "(No news articles in the selected date range were returned from FMP.)"
      : newsForModel
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

  return `Selected range price statistics (JSON):
${stats}

FMP news in range (ordered by relevance; may be empty):
${newsBlock}

Return JSON only matching the requested schema.`
}

const SYSTEM_INSTRUCTION = `You are explaining why a stock moved over a selected historical date range for a market dashboard.

Use only the supplied price data and supplied news/events.
Do not invent facts.
Do not claim certainty.
Prefer phrases like 'appears linked to', 'may be related to', and 'likely contributed to'.
If the evidence is weak or no relevant news is found, say the reason is unclear and use low confidence where appropriate.
This is not financial advice.
Return JSON only.`

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
            "Gemini rejected the API key (401). Confirm GEMINI_API_KEY in .env.local, then restart the dev server.",
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
            "Gemini blocked this API key’s project (403). Check Google AI Studio / Cloud project settings.",
        },
        { status: 403 }
      )
    }
    if (err.status === 429) {
      return NextResponse.json(
        {
          error:
            "Gemini rate limit reached (429). Wait and try again.",
        },
        { status: 429 }
      )
    }
    if (err.status === 503 || msg.includes("high demand") || msg.includes("unavailable")) {
      return NextResponse.json(
        {
          error: "Gemini is temporarily overloaded (503). Try again shortly.",
        },
        { status: 503 }
      )
    }
  }
  console.error("[explain-range] gemini error")
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

  const parsed = explainRangeRequestSchema.safeParse(bodyJson)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const input = parsed.data
  const signal = request.signal

  let newsRaw: Awaited<ReturnType<typeof fetchFmpStockNews>> = []
  try {
    newsRaw = await fetchFmpStockNews(input.symbol, fmpKey, {
      limit: 100,
      signal,
      cache: "no-store",
    })
  } catch {
    newsRaw = []
  }

  const newsForModel = filterAndRankFmpNewsForRange(newsRaw, {
    from: input.from,
    to: input.to,
    symbol: input.symbol,
    companyName: input.companyName,
    maxItems: 8,
  })

  const userPrompt = buildUserPrompt(input, newsForModel)
  const modelCandidates = resolveModelCandidates()

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey })
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
            responseJsonSchema: explainRangeGeminiJsonSchema,
          },
        })

        const rawText = response.text?.trim()
        if (!rawText) {
          continue
        }

        let jsonUnknown: unknown
        try {
          jsonUnknown = JSON.parse(rawText)
        } catch {
          continue
        }

        const outParsed = explainRangeResponseSchema.safeParse(jsonUnknown)
        if (!outParsed.success) {
          continue
        }

        const value: RangeExplanation = {
          ...outParsed.data,
          symbol: input.symbol.toUpperCase(),
          companyName: input.companyName ?? outParsed.data.companyName,
          from: input.from,
          to: input.to,
          direction: input.direction,
        }

        return NextResponse.json(value)
      } catch (err) {
        lastError = err
        if (signal.aborted) {
          return new NextResponse(null, { status: 408 })
        }
        if (isRetryableCapacityError(err) || isModelNotFoundError(err)) {
          continue
        }
        return geminiFailureResponse(err)
      }
    }

    console.error("[explain-range] all model candidates failed")
    return NextResponse.json(
      {
        error:
          "Gemini could not complete this request. Wait a moment and retry, or set GEMINI_EXPLAIN_MODEL.",
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
