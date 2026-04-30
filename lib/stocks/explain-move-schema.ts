import * as z from "zod"

export const MOVE_CATEGORIES = [
  "earnings",
  "guidance",
  "analyst_rating",
  "merger_acquisition",
  "product_news",
  "legal_regulatory",
  "biotech_trial",
  "financing_dilution",
  "macro_sector",
  "short_squeeze_momentum",
  "no_clear_reason",
  "other",
] as const

export type MoveCategory = (typeof MOVE_CATEGORIES)[number]

export const explainMoveRequestSchema = z.object({
  symbol: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[\w.:^-]+$/i, "Invalid symbol"),
  companyName: z.string().min(1).max(256),
  direction: z.enum(["gainer", "loser"]),
  price: z.number().finite(),
  change: z.number().finite(),
  changesPercentage: z.number().finite(),
  exchange: z.string().max(64).optional().nullable(),
})

export type ExplainMoveRequest = z.infer<typeof explainMoveRequestSchema>

const evidenceItemSchema = z.object({
  headline: z.string().min(1),
  source: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  publishedDate: z.string().optional().nullable(),
  relevance: z.string().min(1),
})

export const explainMoveResponseSchema = z.object({
  symbol: z.string(),
  companyName: z.string(),
  direction: z.enum(["gainer", "loser"]),
  likelyReason: z.string().min(1),
  category: z.enum(MOVE_CATEGORIES),
  confidence: z.enum(["low", "medium", "high"]),
  evidence: z.array(evidenceItemSchema),
  caveat: z.string().min(1),
})

export type ExplainMoveResponse = z.infer<typeof explainMoveResponseSchema>

/** JSON Schema subset for Gemini `responseJsonSchema` (aligned with explainMoveResponseSchema). */
export const explainMoveGeminiJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    symbol: { type: "string" },
    companyName: { type: "string" },
    direction: { type: "string", enum: ["gainer", "loser"] },
    likelyReason: { type: "string" },
    category: { type: "string", enum: [...MOVE_CATEGORIES] },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    evidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          headline: { type: "string" },
          source: { type: "string" },
          url: { type: "string" },
          publishedDate: { type: "string" },
          relevance: { type: "string" },
        },
        required: ["headline", "relevance"],
      },
    },
    caveat: { type: "string" },
  },
  required: [
    "symbol",
    "companyName",
    "direction",
    "likelyReason",
    "category",
    "confidence",
    "evidence",
    "caveat",
  ],
} as const
