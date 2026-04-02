import { z } from 'zod'

export const ScoreBlock = z.object({
  score: z.number().optional(),
  recommendation: z.string().optional(),
  weight: z.string().optional(),
}).passthrough()

// Technical indicator schemas
export const IndicatorConfig = z.record(z.any())

export const PatternSchema = z.object({
  index: z.number(),
  pattern: z.string(),
  direction: z.string(),
  confidence: z.number(),
})

export const TechnicalAnalysisSchema = z.object({
  score: z.number(),
  recommendation: z.string(),
  indicators: z.record(z.any()),
  configuration: IndicatorConfig.optional(),
  error: z.string().optional(),
})

export const AnalysisResponse = z.object({
  status: z.string(),
  symbol: z.string(),
  analysis: z.object({
    mode: z.string(),
    timeframe: z.string(),
    timestamp: z.string().optional(),
    fundamental: ScoreBlock.optional(),
    technical: TechnicalAnalysisSchema.optional(),
    sentiment: ScoreBlock.optional(),
    overall: ScoreBlock.optional(),
    aiInsights: z.object({ summary: z.string().optional() }).optional(),
    meta: z.record(z.any()).optional()
  })
})

export type AnalysisResponse = z.infer<typeof AnalysisResponse>

export const IndicatorsResponse = z.object({
  status: z.string(),
  availableIndicators: z.record(z.array(z.string())).optional(),
  defaultConfig: z.record(z.any()).optional(),
  description: z.string().optional(),
})

export type IndicatorsResponse = z.infer<typeof IndicatorsResponse>

export const WeightsDefaultsResponse = z.object({
  status: z.string(),
  defaultWeights: z.record(z.number()),
  description: z.record(z.string()).optional(),
  examples: z.array(z.record(z.any())).optional()
})
export type WeightsDefaultsResponse = z.infer<typeof WeightsDefaultsResponse>

export const SearchResponseItem = z.object({
  symbol: z.string(),
  name: z.string().optional(),
  region: z.string().optional(),
  type: z.string().optional(),
})

export const SearchResponse = z.object({
  status: z.string().optional(),
  results: z.array(SearchResponseItem).optional()
})
export type SearchResponse = z.infer<typeof SearchResponse>

export const TrendingBucket = z.object({
  symbol: z.string(),
  name: z.string().optional(),
  price: z.number().optional(),
  change: z.number().optional(),
  changeAmount: z.number().optional(),
  volume: z.number().optional(),
  category: z.string().optional()
})

export const TrendingResponse = z.object({
  status: z.string().optional(),
  lastUpdated: z.string().optional(),
  timestamp: z.string().optional(),
  source: z.string().optional(),
  trending: z.union([
    z.array(TrendingBucket),
    z.object({
      gainers: z.array(TrendingBucket).optional(),
      losers: z.array(TrendingBucket).optional(),
      mostActive: z.array(TrendingBucket).optional(),
      lastUpdated: z.string().optional()
    })
  ]).optional(),
})
export type TrendingResponse = z.infer<typeof TrendingResponse>
