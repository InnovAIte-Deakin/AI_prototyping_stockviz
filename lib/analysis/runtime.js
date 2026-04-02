import analysisServiceModule from "./analysis-service.js";
import weightServiceModule from "./weight-service.js";
import fundamentalAnalysisServiceModule from "./fundamental-analysis-service.js";
import sentimentServiceModule from "./sentiment-service.js";
import enhancedScoringServiceModule from "./enhanced-scoring-service.js";
import basicTechnicalAnalysisServiceModule from "./basic-technical-analysis-service.js";
import cacheModule from "../cache/index.js";
import observabilityModule from "../observability/index.js";
import dataSourceManagerModule from "../market/data-source-manager.js";
import dataServiceModule from "../market/data-service.js";
import searchServiceModule from "../market/search-service.js";

const { createAnalysisService } = analysisServiceModule;
const { createWeightService } = weightServiceModule;
const { createFundamentalAnalysisService } = fundamentalAnalysisServiceModule;
const { createSentimentService } = sentimentServiceModule;
const { createEnhancedScoringService } = enhancedScoringServiceModule;
const { createBasicTechnicalAnalysisService } = basicTechnicalAnalysisServiceModule;
const { createCacheService } = cacheModule;
const { createApiTracker } = observabilityModule;
const { createDataSourceManager } = dataSourceManagerModule;
const { createDataService } = dataServiceModule;
const { createSearchService } = searchServiceModule;

class FallbackSummaryService {
  async generateWeightedAISummary(fundamental, technical, sentiment, weights, symbol, timeframe, mode) {
    const overall = Math.round(
      (Number(fundamental?.score || 50) * Number(weights?.fundamental || 40) +
        Number(technical?.score || 50) * Number(weights?.technical || 35) +
        Number(sentiment?.score || 50) * Number(weights?.sentiment || 25)) /
        100
    );

    return [
      `${symbol} shows a ${overall >= 70 ? "strong" : overall >= 50 ? "mixed" : "cautious"} ${mode} setup on the ${timeframe} timeframe.`,
      `Fundamentals score ${fundamental?.score ?? 50}/100, technicals score ${technical?.score ?? 50}/100, and sentiment scores ${sentiment?.score ?? 50}/100.`,
      `Recommendation leans ${overall >= 70 ? "BUY" : overall >= 50 ? "HOLD" : "SELL"} based on the blended weighting profile.`,
      technical?.error ? `Technical note: ${technical.error}.` : null,
      fundamental?.notes ? `Fundamental note: ${fundamental.notes}` : null,
      sentiment?.summary ? `Sentiment note: ${sentiment.summary}` : null,
    ]
      .filter(Boolean)
      .join(" ");
  }
}

const cache = createCacheService();
const apiTracker = createApiTracker();
const dataSourceManager = createDataSourceManager({ cache, apiTracker });
const dataService = createDataService({ dataSourceManager });
const searchService = createSearchService({ dataSourceManager });
const weightService = createWeightService();
const technicalAnalysisService = createBasicTechnicalAnalysisService();
const sentimentService = createSentimentService({ apiTracker });
const fundamentalAnalysisService = createFundamentalAnalysisService({
  dataSourceManager,
  cache,
  apiTracker,
});
const enhancedScoringService = createEnhancedScoringService();
const analysisService = createAnalysisService({
  geminiService: new FallbackSummaryService(),
  weightService,
  technicalAnalysisService,
  sentimentService,
  fundamentalAnalysisService,
  enhancedScoringService,
});

async function analyzeSymbol(
  symbol,
  { timeframe = "1M", mode = "advanced", weights = null, indicatorsConfig = {} } = {}
) {
  const stockData = await dataService.fetchStockData(symbol, timeframe);
  const normalizedWeights =
    weights ||
    weightService.validateAndParseWeights({
      fundamental: weightService.defaultWeights.fundamental,
      technical: weightService.defaultWeights.technical,
      sentiment: weightService.defaultWeights.sentiment,
    });

  const analysis =
    mode === "normal"
      ? await analysisService.performNormalAnalysis(symbol, stockData, timeframe)
      : await analysisService.performAdvancedAnalysis(
          symbol,
          stockData,
          timeframe,
          normalizedWeights,
          indicatorsConfig
        );

  return {
    stockData,
    analysis,
    weights: normalizedWeights,
  };
}

const runtime = {
  cache,
  apiTracker,
  dataSourceManager,
  dataService,
  searchService,
  weightService,
  technicalAnalysisService,
  sentimentService,
  fundamentalAnalysisService,
  enhancedScoringService,
  analysisService,
  analyzeSymbol,
};

export {
  cache,
  apiTracker,
  dataSourceManager,
  dataService,
  searchService,
  weightService,
  technicalAnalysisService,
  sentimentService,
  fundamentalAnalysisService,
  enhancedScoringService,
  analysisService,
  analyzeSymbol,
};

export default runtime;
