const { createSentimentService } = require("../../lib/analysis/sentiment-service");
const apiTrackingService = require("./apiTrackingService");

const sentimentService = createSentimentService({ apiTracker: apiTrackingService });

module.exports = {
  fetchAlphaVantageNewsSentiment:
    sentimentService.fetchAlphaVantageNewsSentiment.bind(sentimentService),
};
