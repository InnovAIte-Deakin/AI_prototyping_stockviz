const { createFundamentalAnalysisService } = require("../../lib/analysis/fundamental-analysis-service");
const dataSourceManager = require("./dataSourceManager");
const cacheService = require("./cacheService");
const apiTrackingService = require("./apiTrackingService");

module.exports = createFundamentalAnalysisService({
  dataSourceManager,
  cache: cacheService,
  apiTracker: apiTrackingService,
});
