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

export interface SentimentHeadline {
  title?: string
  publisher?: string
  score?: number
  sentiment?: number
  url?: string
  timePublished?: string
  [key: string]: unknown
}

export interface SentimentAnalysis extends ScoreBlock {
  source?: string
  summary?: string
  headlines?: SentimentHeadline[]
  newsItems?: SentimentHeadline[]
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
  sentiment?: SentimentAnalysis
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

/** Finnhub `GET /stock/market-status` (e.g. exchange=US). See docs/Finnhub_Swagger.json */
export interface FinnhubMarketStatus {
  exchange?: string
  timezone?: string
  /** pre-market | regular | post-market | null when closed */
  session?: string | null
  holiday?: string | null
  isOpen?: boolean
  /** Unix seconds */
  t?: number
}

/** Finnhub `GET /news` category query param */
export type FinnhubMarketNewsCategory =
  | "general"
  | "forex"
  | "crypto"
  | "merger"

/** Finnhub `MarketNews` item. See docs/Finnhub_Swagger.json */
export interface FinnhubMarketNewsItem {
  category?: string
  /** Published time, Unix seconds */
  datetime?: number
  headline?: string
  id?: number
  image?: string
  related?: string
  source?: string
  summary?: string
  url?: string
}

/** Single hit from Finnhub `GET /search` (`SymbolLookupInfo`). */
export interface FinnhubSymbolLookupInfo {
  description?: string
  displaySymbol?: string
  symbol?: string
  type?: string
}

/** Finnhub `GET /search` response (`SymbolLookup`). */
export interface FinnhubSymbolLookupResponse {
  count?: number
  result?: FinnhubSymbolLookupInfo[]
}
