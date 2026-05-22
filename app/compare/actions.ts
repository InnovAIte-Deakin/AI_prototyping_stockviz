"use server"

import { GoogleGenAI } from "@google/genai"
export type CompareAiResponse = {
  summary: string
  error?: string
}

export type CompareAiPayloadStock = {
  symbol: string
  price: number | string
  dailyChange: number | string
  marketCap: number | string
  peRatio: number | string
  eps: number | string
  rsi: number | string
  macd: string
  analystSentiment: string
}

export async function generateComparisonSummary(dataPayload: CompareAiPayloadStock[]): Promise<CompareAiResponse> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim()
  if (!geminiKey) {
    return { summary: "", error: "GEMINI_API_KEY not configured" }
  }

  // Construct a prompt summarizing the metrics for all symbols
  const stocksText = dataPayload.map((stock) => {
    return `
Symbol: ${stock.symbol}
Price: $${stock.price}
Daily Change: ${stock.dailyChange}%
Market Cap: ${stock.marketCap}M
P/E Ratio: ${stock.peRatio}
EPS: ${stock.eps}
RSI (14): ${stock.rsi}
MACD: ${stock.macd}
Analyst Sentiment: ${stock.analystSentiment}
    `.trim()
  }).join("\n\n")

  const prompt = `
You are a financial analyst summarizing a comparison between ${dataPayload.length} stocks for a retail dashboard.

Data:
${stocksText}

Write a structured, helpful product insight comparing these stocks (about 4-5 sentences).
Discuss which stock has the strongest profitability (e.g. highest EPS/PE ratio balance), which might be comparatively cheaper, which is largest by market cap, and how recent price momentum (RSI/MACD) or analyst sentiment plays a role.
Provide a clear, actionable synthesis comparing their relative strengths.

Do not use markdown formatting (like bolding or lists). Return the output as JSON matching the schema {"summary": "string"}.
  `.trim()

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey })

    // We try gemini-2.5-pro first, then fallback to flash
    const modelsToTry = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"]

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: "You are an expert financial analyst. Be concise, objective, and clear.",
            temperature: 0.3,
            responseMimeType: "application/json",
            responseJsonSchema: {
              type: "object",
              properties: {
                summary: { type: "string" }
              },
              required: ["summary"]
            }
          },
        })

        const rawText = response.text?.trim()
        if (!rawText) continue

        const parsed = JSON.parse(rawText)
        if (parsed && typeof parsed.summary === "string") {
          return { summary: parsed.summary }
        }
      } catch (err) {
        console.warn(`[compare] model "${model}" failed, trying next:`, err)
        continue
      }
    }

    return { summary: "", error: "AI comparison failed due to rate limits or model unavailability." }

  } catch (err) {
    console.error("[compare] AI summary generation error:", err)
    return { summary: "", error: "An unexpected error occurred while generating the comparison." }
  }
}
