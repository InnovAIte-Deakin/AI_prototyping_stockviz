import * as z from "zod";

export const RANGE_DIRECTION = ["up", "down", "flat"] as const;
export type RangeDirection = (typeof RANGE_DIRECTION)[number];

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
] as const;

const dayMoveSchema = z.object({
  close: z.number().finite(),
  date: z.string().min(1).max(32),
  percentageChange: z.number().finite(),
});

const volumeSpikeSchema = z.object({
  close: z.number().finite(),
  date: z.string().min(1).max(32),
  volume: z.number().finite().nonnegative(),
});

export const explainRangeRequestSchema = z.object({
  absoluteChange: z.number().finite(),
  biggestDownDay: dayMoveSchema.optional(),
  biggestUpDay: dayMoveSchema.optional(),
  companyName: z.string().max(256).optional(),
  direction: z.enum(RANGE_DIRECTION),
  endClose: z.number().finite().positive(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  highestClose: z.number().finite().positive().optional(),
  lowestClose: z.number().finite().positive().optional(),
  percentageChange: z.number().finite(),
  startClose: z.number().finite().positive(),
  symbol: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[\w.:^-]+$/i, "Invalid symbol"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  volumeSpikes: z.array(volumeSpikeSchema).max(12).optional(),
});

export type ExplainRangeRequest = z.infer<typeof explainRangeRequestSchema>;

const mainDriverSchema = z.object({
  category: z.enum(DRIVER_CATEGORIES),
  confidence: z.enum(["low", "medium", "high"]),
  explanation: z.string().min(1),
});

const importantDateSchema = z.object({
  date: z.string().min(1),
  event: z.string().min(1),
  priceAction: z.string().min(1),
  relevance: z.string().min(1),
});

const evidenceItemSchema = z.object({
  headline: z.string().min(1),
  publishedDate: z.string().optional(),
  relevance: z.string().min(1),
  source: z.string().optional(),
  url: z.string().optional(),
});

export const explainRangeResponseSchema = z.object({
  caveat: z.string().min(1),
  companyName: z.string().optional(),
  confidence: z.enum(["low", "medium", "high"]),
  direction: z.enum(RANGE_DIRECTION),
  evidence: z.array(evidenceItemSchema),
  from: z.string(),
  importantDates: z.array(importantDateSchema),
  mainDrivers: z.array(mainDriverSchema),
  summary: z.string().min(1),
  symbol: z.string(),
  to: z.string(),
});

export type RangeExplanation = z.infer<typeof explainRangeResponseSchema>;

export const explainRangeGeminiJsonSchema = {
  additionalProperties: false,
  properties: {
    caveat: { type: "string" },
    companyName: { type: "string" },
    confidence: { enum: ["low", "medium", "high"], type: "string" },
    direction: { enum: [...RANGE_DIRECTION], type: "string" },
    evidence: {
      items: {
        additionalProperties: false,
        properties: {
          headline: { type: "string" },
          publishedDate: { type: "string" },
          relevance: { type: "string" },
          source: { type: "string" },
          url: { type: "string" },
        },
        required: ["headline", "relevance"],
        type: "object",
      },
      type: "array",
    },
    from: { type: "string" },
    importantDates: {
      items: {
        additionalProperties: false,
        properties: {
          date: { type: "string" },
          event: { type: "string" },
          priceAction: { type: "string" },
          relevance: { type: "string" },
        },
        required: ["date", "event", "priceAction", "relevance"],
        type: "object",
      },
      type: "array",
    },
    mainDrivers: {
      items: {
        additionalProperties: false,
        properties: {
          category: { enum: [...DRIVER_CATEGORIES], type: "string" },
          confidence: { enum: ["low", "medium", "high"], type: "string" },
          explanation: { type: "string" },
        },
        required: ["category", "explanation", "confidence"],
        type: "object",
      },
      type: "array",
    },
    summary: { type: "string" },
    symbol: { type: "string" },
    to: { type: "string" },
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
  type: "object",
} as const;
