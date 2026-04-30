import * as z from "zod"

export const RANGE_DIRECTION = ["up", "down", "flat"] as const
export type RangeDirection = (typeof RANGE_DIRECTION)[number]

export const DRIVER_CATEGORIES = [
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
  "technical_momentum",
  "no_clear_reason",
  "other",
] as const

const dayMoveSchema = z.object({
  date: z.string().min(1).max(32),
  percentageChange: z.number().finite(),
  close: z.number().finite(),
})

const volumeSpikeSchema = z.object({
  date: z.string().min(1).max(32),
  volume: z.number().finite().nonnegative(),
  close: z.number().finite(),
})

export const explainRangeRequestSchema = z.object({
  symbol: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[\w.:^-]+$/i, "Invalid symbol"),
  companyName: z.string().max(256).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startClose: z.number().finite().positive(),
  endClose: z.number().finite().positive(),
  absoluteChange: z.number().finite(),
  percentageChange: z.number().finite(),
  direction: z.enum(RANGE_DIRECTION),
  highestClose: z.number().finite().positive().optional(),
  lowestClose: z.number().finite().positive().optional(),
  biggestUpDay: dayMoveSchema.optional(),
  biggestDownDay: dayMoveSchema.optional(),
  volumeSpikes: z.array(volumeSpikeSchema).max(12).optional(),
})

export type ExplainRangeRequest = z.infer<typeof explainRangeRequestSchema>

const mainDriverSchema = z.object({
  category: z.enum(DRIVER_CATEGORIES),
  explanation: z.string().min(1),
  confidence: z.enum(["low", "medium", "high"]),
})

const importantDateSchema = z.object({
  date: z.string().min(1),
  event: z.string().min(1),
  priceAction: z.string().min(1),
  relevance: z.string().min(1),
})

const evidenceItemSchema = z.object({
  headline: z.string().min(1),
  source: z.string().optional(),
  url: z.string().optional(),
  publishedDate: z.string().optional(),
  relevance: z.string().min(1),
})

export const explainRangeResponseSchema = z.object({
  symbol: z.string(),
  companyName: z.string().optional(),
  from: z.string(),
  to: z.string(),
  direction: z.enum(RANGE_DIRECTION),
  summary: z.string().min(1),
  mainDrivers: z.array(mainDriverSchema),
  importantDates: z.array(importantDateSchema),
  evidence: z.array(evidenceItemSchema),
  confidence: z.enum(["low", "medium", "high"]),
  caveat: z.string().min(1),
})

export type RangeExplanation = z.infer<typeof explainRangeResponseSchema>

/** JSON Schema for Gemini `responseJsonSchema` (aligned with explainRangeResponseSchema). */
export const explainRangeGeminiJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    symbol: { type: "string" },
    companyName: { type: "string" },
    from: { type: "string" },
    to: { type: "string" },
    direction: { type: "string", enum: [...RANGE_DIRECTION] },
    summary: { type: "string" },
    mainDrivers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          category: { type: "string", enum: [...DRIVER_CATEGORIES] },
          explanation: { type: "string" },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["category", "explanation", "confidence"],
      },
    },
    importantDates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          date: { type: "string" },
          event: { type: "string" },
          priceAction: { type: "string" },
          relevance: { type: "string" },
        },
        required: ["date", "event", "priceAction", "relevance"],
      },
    },
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
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    caveat: { type: "string" },
  },
  required: [
    "symbol",
    "from",
    "to",
    "direction",
    "summary",
    "mainDrivers",
    "importantDates",
    "evidence",
    "confidence",
    "caveat",
  ],
} as const
