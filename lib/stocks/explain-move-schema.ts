import * as z from "zod";

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
] as const;

export type MoveCategory = (typeof MOVE_CATEGORIES)[number];

export const explainMoveRequestSchema = z.object({
  change: z.number().finite(),
  changesPercentage: z.number().finite(),
  companyName: z.string().min(1).max(256),
  direction: z.enum(["gainer", "loser"]),
  exchange: z.union([z.string().max(64), z.null()]).optional(),
  price: z.number().finite(),
  symbol: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[\w.:^-]+$/i, "Invalid symbol"),
});

export type ExplainMoveRequest = z.infer<typeof explainMoveRequestSchema>;

const evidenceItemSchema = z.object({
  headline: z.string().min(1),
  publishedDate: z.string().nullish(),
  relevance: z.string().min(1),
  source: z.string().nullish(),
  url: z.string().nullish(),
});

export const explainMoveResponseSchema = z.object({
  caveat: z.string().min(1),
  category: z.enum(MOVE_CATEGORIES),
  companyName: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
  direction: z.enum(["gainer", "loser"]),
  evidence: z.array(evidenceItemSchema),
  likelyReason: z.string().min(1),
  symbol: z.string(),
});

export type ExplainMoveResponse = z.infer<typeof explainMoveResponseSchema>;

export const explainMoveGeminiJsonSchema = {
  additionalProperties: false,
  properties: {
    caveat: { type: "string" },
    category: { enum: [...MOVE_CATEGORIES], type: "string" },
    companyName: { type: "string" },
    confidence: { enum: ["low", "medium", "high"], type: "string" },
    direction: { enum: ["gainer", "loser"], type: "string" },
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
    likelyReason: { type: "string" },
    symbol: { type: "string" },
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
  type: "object",
} as const;
