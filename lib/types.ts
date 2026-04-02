/**
 * Shared TypeScript types for the StockViz application.
 *
 * These define the contract between backend analysis services (lib/analysis/)
 * and the frontend UI components. Ported from the legacy frontend/src/lib/types.ts
 * without the Zod runtime dependency — these are pure TS interfaces.
 */

// ---------------------------------------------------------------------------
// Score & Recommendation
// ---------------------------------------------------------------------------

export interface ScoreBlock {
  score?: number
  recommendation?: string
  weight?: string
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Technical Analysis
// ---------------------------------------------------------------------------

export interface TechnicalAnalysis {
  score: number
  recommendation: string
  indicators: Record<string, unknown>
  configuration?: Record<string, unknown>
  error?: string
}

export interface CandlePattern {
  index: number
  pattern: string
  direction: string
  confidence: number
}

// ---------------------------------------------------------------------------
// Analysis Response (main API payload)
// ---------------------------------------------------------------------------

export interface AnalysisResult {
  mode: string
  timeframe: string
  timestamp?: string
  fundamental?: ScoreBlock
  technical?: TechnicalAnalysis
  sentiment?: ScoreBlock
  overall?: ScoreBlock
  aiInsights?: { summary?: string }
  meta?: Record<string, unknown>
}

export interface AnalysisResponse {
  status: string
  symbol: string
  analysis: AnalysisResult
}

// ---------------------------------------------------------------------------
// Indicators
// ---------------------------------------------------------------------------

export interface IndicatorsResponse {
  status: string
  availableIndicators?: Record<string, string[]>
  defaultConfig?: Record<string, unknown>
  description?: string
}

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------

export interface WeightsDefaultsResponse {
  status: string
  defaultWeights: Record<string, number>
  description?: Record<string, string>
  examples?: Record<string, unknown>[]
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchResultItem {
  symbol: string
  name?: string
  region?: string
  type?: string
}

export interface SearchResponse {
  status?: string
  results?: SearchResultItem[]
}

// ---------------------------------------------------------------------------
// Trending / Market
// ---------------------------------------------------------------------------

export interface TrendingStock {
  symbol: string
  name?: string
  price?: number
  change?: number
  changeAmount?: number
  volume?: number
  category?: string
}

export interface TrendingBuckets {
  gainers?: TrendingStock[]
  losers?: TrendingStock[]
  mostActive?: TrendingStock[]
  lastUpdated?: string
}

export interface TrendingResponse {
  status?: string
  lastUpdated?: string
  timestamp?: string
  source?: string
  trending?: TrendingStock[] | TrendingBuckets
}
