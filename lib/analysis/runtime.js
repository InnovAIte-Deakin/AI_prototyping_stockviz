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
import aiModule from "../ai/index.js";

const { createAnalysisService } = analysisServiceModule;
const { createWeightService } = weightServiceModule;
const { createFundamentalAnalysisService } = fundamentalAnalysisServiceModule;
const { createSentimentService } = sentimentServiceModule;
const { createEnhancedScoringService } = enhancedScoringServiceModule;
const { createBasicTechnicalAnalysisService } =
  basicTechnicalAnalysisServiceModule;
const { createCacheService } = cacheModule;
const { createApiTracker } = observabilityModule;
const { createDataSourceManager } = dataSourceManagerModule;
const { createDataService } = dataServiceModule;
const { createSearchService } = searchServiceModule;
const { createSummaryService } = aiModule;

const cache = createCacheService();
const apiTracker = createApiTracker();
const dataSourceManager = createDataSourceManager({ cache, apiTracker });
const dataService = createDataService({ dataSourceManager });
const searchService = createSearchService({ dataSourceManager });
const summaryService = createSummaryService({ apiTracker });
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
  summaryService,
  weightService,
  technicalAnalysisService,
  sentimentService,
  fundamentalAnalysisService,
  enhancedScoringService,
});

async function analyzeSymbol(
  symbol,
  {
    timeframe = "1M",
    mode = "advanced",
    weights = null,
    indicatorsConfig = {},
  } = {},
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
      ? await analysisService.performNormalAnalysis(
          symbol,
          stockData,
          timeframe,
        )
      : await analysisService.performAdvancedAnalysis(
          symbol,
          stockData,
          timeframe,
          normalizedWeights,
          indicatorsConfig,
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
  summaryService,
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
  summaryService,
  weightService,
  technicalAnalysisService,
  sentimentService,
  fundamentalAnalysisService,
  enhancedScoringService,
  analysisService,
  analyzeSymbol,
};

export default runtime;
