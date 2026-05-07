import type { AnalysisWeights, IndicatorConfig } from "@/lib/url-state";

type OhlcvPoint = {
  close?: number;
  high?: number;
  low?: number;
  [key: string]: unknown;
};

type StockDataLike = {
  ohlcv?: OhlcvPoint[];
  source?: string;
};

type LooseIndicatorConfig = IndicatorConfig | Record<string, unknown>;

type ScoreLike = {
  indicators?: IndicatorMap;
  notes?: string;
  recommendation?: string;
  score?: number;
  summary?: string;
  [key: string]: unknown;
};

type MacdLike = {
  hist?: number[];
  histogram?: number[];
};

type BollingerLike = {
  lower?: number[];
  upper?: number[];
};

type IndicatorMap = Record<string, unknown> & {
  BollingerBands?: BollingerLike;
  MACD?: MacdLike;
  RSI?: number[];
  SMA?: { values?: number[] };
  SMA20?: number[];
  SMA50?: number[];
  bollingerBands?: BollingerLike;
  macd?: MacdLike;
  rsi?: number[];
};

type WeightedSummaryMode = "advanced" | "normal";

type SummaryService = {
  generateWeightedAISummary(...args: unknown[]): Promise<string> | string;
};

type WeightService = {
  defaultWeights: AnalysisWeights;
  validateAndParseWeights(weights: Partial<AnalysisWeights>): AnalysisWeights;
};

type TechnicalAnalysisService = {
  calculateIndicators(
    ohlcv: OhlcvPoint[],
    indicatorsConfig: IndicatorConfig,
  ): Promise<IndicatorMap>;
};

type SentimentService = {
  fetchAlphaVantageNewsSentiment(symbol: string): Promise<ScoreLike>;
};

type FundamentalAnalysisService = {
  analyze(symbol: string): Promise<ScoreLike>;
};

type EnhancedScoreResult = ScoreLike & {
  confidence?: number;
  details?: string[];
  flags?: string[];
};

type AggregateScoreResult = {
  aggregateScore: number;
  confidence: number;
  details: string[];
  flags: string[];
  label: string;
};

type EnhancedScoringService = {
  calculateAggregateScore(
    fundamental: EnhancedScoreResult,
    technical: EnhancedScoreResult,
    sentiment: EnhancedScoreResult,
    weights: { fundamental: number; sentiment: number; technical: number },
  ): AggregateScoreResult;
  calculateEnhancedFundamentalScore(fundamental: ScoreLike): EnhancedScoreResult;
  calculateEnhancedSentimentScore(sentiment: ScoreLike): EnhancedScoreResult;
  calculateEnhancedTechnicalScore(
    indicators: IndicatorMap | undefined,
    latestPoint: OhlcvPoint,
  ): EnhancedScoreResult;
};

type LoggerLike = {
  error(...data: unknown[]): void;
  warn(...data: unknown[]): void;
};

type AnalysisServiceOptions = {
  enhancedScoringService: EnhancedScoringService;
  fundamentalAnalysisService: FundamentalAnalysisService;
  geminiService?: SummaryService;
  logger?: LoggerLike;
  sentimentService: SentimentService;
  summaryService?: SummaryService;
  technicalAnalysisService: TechnicalAnalysisService;
  weightService: WeightService;
};

type AnalysisServiceResponse = {
  analysis: Record<string, unknown>;
  status: "success";
  symbol: string;
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

class AnalysisService {
  private enhancedScoringService: EnhancedScoringService;
  private fundamentalAnalysisService: FundamentalAnalysisService;
  private logger: LoggerLike;
  private sentimentService: SentimentService;
  private summaryService: SummaryService;
  private technicalAnalysisService: TechnicalAnalysisService;
  private weightService: WeightService;

  constructor({
    summaryService,
    geminiService,
    weightService,
    technicalAnalysisService,
    sentimentService,
    fundamentalAnalysisService,
    enhancedScoringService,
    logger = console,
  }: AnalysisServiceOptions) {
    const resolvedSummaryService = summaryService || geminiService;
    if (!resolvedSummaryService) {
      throw new Error("AnalysisService requires a summary service");
    }
    this.summaryService = resolvedSummaryService;
    this.weightService = weightService;
    this.technicalAnalysisService = technicalAnalysisService;
    this.sentimentService = sentimentService;
    this.fundamentalAnalysisService = fundamentalAnalysisService;
    this.enhancedScoringService = enhancedScoringService;
    this.logger = logger;
  }

  async performNormalAnalysis(
    symbol: string,
    stockData: StockDataLike,
    timeframe: string,
  ): Promise<AnalysisServiceResponse> {
    const normalizedSymbol = String(symbol || "").toUpperCase();
    const fundamental = await this.getFundamentalAnalysis(normalizedSymbol);
    const overallScore = Math.round(fundamental?.score ?? 50);
    const overallRecommendation = this.getRecommendationFromScore(overallScore);

    const aiSummary = await this.summaryService.generateWeightedAISummary(
      { score: overallScore, ...fundamental },
      { score: 0, indicators: {} },
      { score: 0, summary: "Analysis focused on fundamentals only" },
      { fundamental: 100, technical: 0, sentiment: 0 },
      normalizedSymbol,
      timeframe,
      "normal",
    );

    return {
      status: "success",
      symbol: normalizedSymbol,
      analysis: {
        mode: "normal",
        timeframe,
        timestamp: new Date().toISOString(),
        fundamental: { ...fundamental, weight: "100%" },
        overall: {
          score: overallScore,
          recommendation: overallRecommendation,
        },
        aiInsights: { summary: aiSummary },
        meta: {
          dataPoints: Array.isArray(stockData?.ohlcv)
            ? stockData.ohlcv.length
            : 0,
          dataSource: stockData?.source || "unknown",
          confidenceLevel: this.calculateConfidenceLevel(overallScore),
          riskLevel: this.calculateRiskLevel(
            { score: overallScore },
            { score: 50 },
            { score: 50 },
          ),
        },
      },
    };
  }

  async performAdvancedAnalysis(
    symbol: string,
    stockData: StockDataLike,
    timeframe: string,
    rawWeights: Partial<AnalysisWeights> = {},
    indicatorsConfig: LooseIndicatorConfig = {},
  ): Promise<AnalysisServiceResponse> {
    const normalizedSymbol = String(symbol || "").toUpperCase();
    const weights = this.weightService.validateAndParseWeights({
      fundamental: Number(
        rawWeights?.fundamental ??
          this.weightService.defaultWeights.fundamental,
      ),
      technical: Number(
        rawWeights?.technical ?? this.weightService.defaultWeights.technical,
      ),
      sentiment: Number(
        rawWeights?.sentiment ?? this.weightService.defaultWeights.sentiment,
      ),
    });

    const [fundamentalAnalysis, technicalAnalysis, sentimentAnalysis] =
      await Promise.all([
        this.getFundamentalAnalysis(normalizedSymbol),
        this.getTechnicalAnalysis(
          normalizedSymbol,
          stockData,
          timeframe,
          indicatorsConfig,
        ),
        this.getSentimentAnalysis(normalizedSymbol),
      ]);

    const weightedScore = this.calculateWeightedScore(
      fundamentalAnalysis,
      technicalAnalysis,
      sentimentAnalysis,
      weights,
    );

    const aiSummary = await this.generateWeightedAISummary(
      normalizedSymbol,
      fundamentalAnalysis,
      technicalAnalysis,
      sentimentAnalysis,
      weights,
      weightedScore,
    );

    return {
      status: "success",
      symbol: normalizedSymbol,
      analysis: {
        mode: "advanced",
        timeframe,
        timestamp: new Date().toISOString(),
        fundamental: {
          ...fundamentalAnalysis,
          weight: `${weights.fundamental}%`,
        },
        technical: { ...technicalAnalysis, weight: `${weights.technical}%` },
        sentiment: { ...sentimentAnalysis, weight: `${weights.sentiment}%` },
        overall: {
          score: weightedScore,
          recommendation: this.getRecommendationFromScore(weightedScore),
        },
        aiInsights: { summary: aiSummary },
        meta: {
          dataPoints: Array.isArray(stockData?.ohlcv)
            ? stockData.ohlcv.length
            : 0,
          weightsUsed: weights,
          confidenceLevel: this.calculateConfidenceLevel(weightedScore),
          riskLevel: this.calculateRiskLevel(
            fundamentalAnalysis,
            technicalAnalysis,
            sentimentAnalysis,
          ),
          dataSource: stockData?.source || "unknown",
        },
      },
    };
  }

  async performEnhancedAnalysis(
    symbol: string,
    stockData: StockDataLike,
    timeframe: string,
    rawWeights: Partial<AnalysisWeights> = {},
    indicatorsConfig: LooseIndicatorConfig = {},
  ) {
    const normalizedSymbol = String(symbol || "").toUpperCase();
    const weights = this.weightService.validateAndParseWeights({
      fundamental: Number(
        rawWeights?.fundamental ??
          this.weightService.defaultWeights.fundamental,
      ),
      technical: Number(
        rawWeights?.technical ?? this.weightService.defaultWeights.technical,
      ),
      sentiment: Number(
        rawWeights?.sentiment ?? this.weightService.defaultWeights.sentiment,
      ),
    });

    try {
      const [fundamentalAnalysis, technicalAnalysis, sentimentAnalysis] =
        await Promise.all([
          this.getFundamentalAnalysis(normalizedSymbol),
          this.getTechnicalAnalysis(
            normalizedSymbol,
            stockData,
            timeframe,
            indicatorsConfig,
          ),
          this.getSentimentAnalysis(normalizedSymbol),
        ]);

      const enhancedFundamental =
        this.enhancedScoringService.calculateEnhancedFundamentalScore(
          fundamentalAnalysis,
        );
      const enhancedTechnical =
        this.enhancedScoringService.calculateEnhancedTechnicalScore(
          technicalAnalysis.indicators,
          stockData?.ohlcv?.at?.(-1) || {},
        );
      const enhancedSentiment =
        this.enhancedScoringService.calculateEnhancedSentimentScore(
          sentimentAnalysis,
        );

      const aggregateResult =
        this.enhancedScoringService.calculateAggregateScore(
          enhancedFundamental,
          enhancedTechnical,
          enhancedSentiment,
          {
            fundamental: weights.fundamental / 100,
            technical: weights.technical / 100,
            sentiment: weights.sentiment / 100,
          },
        );

      return {
        status: "success",
        symbol: normalizedSymbol,
        analysis: {
          mode: "enhanced",
          type: "detailed_breakdown_analysis",
          timeframe,
          timestamp: new Date().toISOString(),
          enhanced: {
            aggregateScore: aggregateResult.aggregateScore,
            recommendation: aggregateResult.label,
            confidence: aggregateResult.confidence,
            fundamental: {
              ...enhancedFundamental,
              weight: `${weights.fundamental}%`,
              originalScore: fundamentalAnalysis.score,
            },
            technical: {
              ...enhancedTechnical,
              weight: `${weights.technical}%`,
              originalScore: technicalAnalysis.score,
            },
            sentiment: {
              ...enhancedSentiment,
              weight: `${weights.sentiment}%`,
              originalScore: sentimentAnalysis.score,
            },
          },
          insights: {
            keyStrengths: aggregateResult.details.slice(0, 5),
            riskFactors: aggregateResult.flags.slice(0, 5),
            confidenceLevel: this.getConfidenceDescription(
              aggregateResult.confidence,
            ),
            recommendation: this.getEnhancedRecommendationText(
              aggregateResult.label,
              aggregateResult.aggregateScore,
            ),
          },
          original: {
            fundamental: {
              ...fundamentalAnalysis,
              weight: `${weights.fundamental}%`,
            },
            technical: {
              ...technicalAnalysis,
              weight: `${weights.technical}%`,
            },
            sentiment: {
              ...sentimentAnalysis,
              weight: `${weights.sentiment}%`,
            },
          },
          meta: {
            dataPoints: Array.isArray(stockData?.ohlcv)
              ? stockData.ohlcv.length
              : 0,
            weightsUsed: weights,
            enhancementApplied: true,
            algorithmVersion: "2.0",
            totalDetails: aggregateResult.details.length,
            totalFlags: aggregateResult.flags.length,
            dataSource: stockData?.source || "unknown",
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Enhanced analysis failed for ${normalizedSymbol}:`,
        error,
      );
      return this.performAdvancedAnalysis(
        symbol,
        stockData,
        timeframe,
        rawWeights,
        indicatorsConfig,
      );
    }
  }

  async getFundamentalAnalysis(symbol: string): Promise<ScoreLike> {
    return this.fundamentalAnalysisService.analyze(symbol);
  }

  async getTechnicalAnalysis(
    symbol: string,
    stockData: StockDataLike,
    timeframe: string,
    indicatorsConfig: LooseIndicatorConfig = {},
  ): Promise<ScoreLike> {
    try {
      if (!Array.isArray(stockData?.ohlcv) || stockData.ohlcv.length < 10) {
        throw new Error("Insufficient OHLCV data for technical analysis");
      }

      const indicators =
        await this.technicalAnalysisService.calculateIndicators(
          stockData.ohlcv,
          indicatorsConfig as IndicatorConfig,
        );
      const score = this.calculateTechnicalScore(indicators, stockData.ohlcv);

      return {
        score,
        indicators,
        recommendation: this.getRecommendationFromScore(score),
        configuration: indicatorsConfig,
      };
    } catch (error) {
      this.logger.error("Technical analysis error:", toErrorMessage(error));
      const last = stockData?.ohlcv?.at(-1) || {};
      return {
        score: 60,
        indicators: {
          note: "Fallback indicators due to error",
          lastClose: last.close,
          lastHigh: last.high,
          lastLow: last.low,
        },
        recommendation: "HOLD",
        error: "Advanced technical analysis failed; using fallback",
      };
    }
  }

  calculateTechnicalScore(
    indicators: IndicatorMap,
    ohlcv: OhlcvPoint[],
  ): number {
    let score = 50;
    const clamp = (value: number, low: number, high: number) =>
      Math.max(low, Math.min(high, value));
    const lastClose =
      Array.isArray(ohlcv) && ohlcv.length
        ? ohlcv[ohlcv.length - 1].close
        : null;

    const rsiSeries = indicators?.RSI || indicators?.rsi;
    if (Array.isArray(rsiSeries) && rsiSeries.length) {
      const rsi = Number(rsiSeries.at(-1));
      if (!Number.isNaN(rsi)) {
        if (rsi < 30) score += 10;
        else if (rsi > 70) score -= 10;
        else if (rsi > 50) score += 5;
      }
    }

    if (indicators?.MACD || indicators?.macd) {
      const macd = indicators.MACD || indicators.macd;
      const histogramSeries = macd?.histogram ?? macd?.hist;
      if (Array.isArray(histogramSeries)) {
        const histogram = Number(histogramSeries.at(-1));
        if (!Number.isNaN(histogram)) score += histogram > 0 ? 7 : -7;
      }
    }

    if (indicators?.SMA || indicators?.SMA20 || indicators?.SMA50) {
      const sma20 =
        indicators?.SMA?.values?.at?.(-1) ?? indicators?.SMA20?.at?.(-1);
      const sma50 = indicators?.SMA50?.at?.(-1);
      if (lastClose != null) {
        if (sma20 != null && lastClose > sma20) score += 5;
        if (sma50 != null && lastClose > sma50) score += 5;
      }
    }

    if (indicators?.BollingerBands || indicators?.bollingerBands) {
      const bb = indicators.BollingerBands || indicators.bollingerBands;
      if (
        bb &&
        Array.isArray(bb.lower) &&
        Array.isArray(bb.upper) &&
        lastClose != null
      ) {
        const lower = Number(bb.lower.at(-1));
        const upper = Number(bb.upper.at(-1));
        if (!Number.isNaN(lower) && !Number.isNaN(upper) && upper > lower) {
          const position = (lastClose - lower) / (upper - lower);
          if (position < 0.25) score += 4;
          if (position > 0.75) score -= 4;
        }
      }
    }

    return clamp(Math.round(score), 0, 100);
  }

  async getSentimentAnalysis(symbol: string): Promise<ScoreLike> {
    try {
      const sentiment =
        await this.sentimentService.fetchAlphaVantageNewsSentiment(symbol);
      const score = Math.max(
        0,
        Math.min(100, Math.round(Number(sentiment?.score ?? 50))),
      );
      return { ...sentiment, score };
    } catch (error) {
      this.logger.warn(
        "Sentiment fetch failed, using placeholder:",
        toErrorMessage(error),
      );
      return {
        score: 50,
        source: "placeholder",
        summary: `No external sentiment source configured or fetch failed for ${symbol}.`,
        newsItems: [],
      };
    }
  }

  calculateWeightedScore(
    fundamental: ScoreLike,
    technical: ScoreLike,
    sentiment: ScoreLike,
    weights: AnalysisWeights,
  ): number {
    const f = Number(fundamental?.score ?? 50);
    const t = Number(technical?.score ?? 50);
    const s = Number(sentiment?.score ?? 50);
    const wF = Number(weights?.fundamental ?? 33);
    const wT = Number(weights?.technical ?? 34);
    const wS = Number(weights?.sentiment ?? 33);
    const wSum = wF + wT + wS || 1;
    return Math.round(
      Math.max(0, Math.min(100, (f * wF + t * wT + s * wS) / wSum)),
    );
  }

  async generateWeightedAISummary(
    symbol: string,
    fundamental: ScoreLike,
    technical: ScoreLike,
    sentiment: ScoreLike,
    weights: AnalysisWeights,
    weightedScore: number,
  ): Promise<string> {
    try {
      const mode = this.determineUserMode(weights, technical);
      const summary = await this.summaryService.generateWeightedAISummary(
        fundamental,
        technical,
        sentiment,
        weights,
        symbol,
        "current",
        mode,
      );
      if (typeof summary === "string" && summary.trim()) return summary.trim();
    } catch (error) {
      this.logger.warn(
        "Enhanced Gemini summary failed; using fallback:",
        toErrorMessage(error),
      );
    }

    const recommendation = this.getRecommendationFromScore(weightedScore);
    return [
      `Overall ${recommendation} with composite score ${weightedScore}/100 based on provided weights.`,
      `Fundamentals: ${fundamental?.score ?? 50}/100 (${fundamental?.recommendation || "-"})`,
      `Technicals: ${technical?.score ?? 50}/100 (${technical?.recommendation || "-"})`,
      `Sentiment: ${sentiment?.score ?? 50}/100`,
      fundamental?.notes ? `Fundamental note: ${fundamental.notes}` : null,
      sentiment?.summary ? `Sentiment: ${sentiment.summary}` : null,
      `Analysis includes ${
        Object.keys(technical?.indicators || {}).filter(
          (key) => key !== "patterns",
        ).length
      } technical indicators`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  calculateConfidenceLevel(score: number): string {
    if (score >= 75) return "high";
    if (score >= 60) return "medium";
    return "low";
  }

  calculateRiskLevel(
    fundamental: ScoreLike,
    technical: ScoreLike,
    sentiment: ScoreLike,
  ): string {
    const f = Number(fundamental?.score ?? 50);
    const t = Number(technical?.score ?? 50);
    const s = Number(sentiment?.score ?? 50);
    const average = (f + t + s) / 3;
    const variance =
      ((f - average) ** 2 + (t - average) ** 2 + (s - average) ** 2) / 3;
    if (variance < 100) return "low";
    if (variance < 225) return "medium";
    return "elevated";
  }

  getRecommendationFromScore(score: number): string {
    if (score >= 70) return "BUY";
    if (score >= 50) return "HOLD";
    return "SELL";
  }

  determineUserMode(
    weights: AnalysisWeights,
    technical: ScoreLike,
  ): WeightedSummaryMode {
    const defaults = this.weightService.defaultWeights;
    const customWeights =
      weights.fundamental !== defaults.fundamental ||
      weights.technical !== defaults.technical ||
      weights.sentiment !== defaults.sentiment;

    const indicatorCount = Object.keys(technical?.indicators || {}).filter(
      (key) => key !== "patterns",
    ).length;
    return customWeights || indicatorCount > 3 || weights.technical > 50
      ? "advanced"
      : "normal";
  }

  getConfidenceDescription(confidence: number): string {
    if (confidence >= 0.8) return "High - Strong data quality and agreement";
    if (confidence >= 0.6)
      return "Medium - Good data quality with some limitations";
    if (confidence >= 0.4) return "Low - Limited data or conflicting signals";
    return "Very Low - Insufficient or unreliable data";
  }

  getEnhancedRecommendationText(label: string, score: number): string {
    const recommendations = {
      "STRONG BUY": `Exceptional investment opportunity with score of ${score}/100. Strong fundamentals, positive technical signals, and favorable sentiment align for potential significant returns.`,
      BUY: `Attractive investment with score of ${score}/100. Multiple positive factors suggest good upside potential with reasonable risk.`,
      "WEAK BUY": `Cautious optimism with score of ${score}/100. Some positive signals present but consider smaller position size and monitor closely.`,
      HOLD: `Neutral outlook with score of ${score}/100. Mixed signals suggest maintaining current position and waiting for clearer direction.`,
      "WEAK SELL": `Concerns emerging with score of ${score}/100. Consider reducing position size and monitoring risk factors closely.`,
      SELL: `Significant concerns with score of ${score}/100. Multiple negative factors suggest reducing or exiting position.`,
      "STRONG SELL": `High-risk situation with score of ${score}/100. Strong negative signals across multiple areas suggest immediate action may be warranted.`,
    };

    return (
      recommendations[label as keyof typeof recommendations] ||
      `Score of ${score}/100 with ${label} recommendation.`
    );
  }
}

function createAnalysisService(options: AnalysisServiceOptions) {
  return new AnalysisService(options);
}

const analysisServiceModule = {
  AnalysisService,
  createAnalysisService,
};

export { AnalysisService, createAnalysisService };

export default analysisServiceModule;
