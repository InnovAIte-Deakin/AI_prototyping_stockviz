const { createAnalysisService } = require("../../lib/analysis/analysis-service");
const geminiService = require("./geminiService");
const weightService = require("./weightService");
const technicalAnalysisService = require("./technicalAnalysisService");
const sentimentService = require("./sentimentService");
const fundamentalAnalysisService = require("./fundamentalAnalysisService");
const enhancedScoringService = require("./enhancedScoringService");

module.exports = createAnalysisService({
  geminiService,
  weightService,
  technicalAnalysisService,
  sentimentService,
  fundamentalAnalysisService,
  enhancedScoringService,
});
