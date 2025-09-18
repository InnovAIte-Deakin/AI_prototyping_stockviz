export interface PillarScore {
  score: number; // 0–100
  subscores?: Record<string, number | null>;
  data_used?: Record<string, unknown>;
  notes?: string[];
}

export interface AggregateResult {
  ticker: string;
  asOf: string; // ISO
  scores: {
    fundamentals: PillarScore | null;
    technicals: PillarScore | null;
    sentiment: PillarScore | null;
  };
  aggregateScore: number | null;
  label: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell" | "Insufficient Data";
  flags: string[];
  dataSources: { provider: "AlphaVantage"; requests: string[] };
  contributions?: {
    technical: number;
    fundamental: number;
    sentiment: number;
  };
  weights?: {
    technical: number;
    fundamental: number;
    sentiment: number;
  };
  reasons?: string[];
}

export interface AlphaVantageData {
  overview?: any;
  incomeStatement?: any;
  balanceSheet?: any;
  cashFlow?: any;
  dailySeries?: any;
  technicalIndicators?: {
    sma50?: any;
    sma200?: any;
    rsi?: any;
    macd?: any;
    atr?: any;
  };
  newsSentiment?: any;
}

export interface FundamentalsData {
  netMargin?: number;
  operatingMargin?: number;
  roe?: number;
  roa?: number;
  debtEquity?: number;
  revenueGrowth?: number;
  epsGrowth?: number;
  fcfMargin?: number;
  pe?: number;
}

export interface TechnicalsData {
  ma50?: number;
  ma200?: number;
  rsi?: number;
  macdHistogram?: number;
  atr?: number;
  close?: number;
}

export interface SentimentData {
  articles?: Array<{
    sentiment: number;
    relevanceScore?: number;
    publishedAt: string;
  }>;
}
