class FallbackSummaryService {
  constructor({ logger = console } = {}) {
    this.logger = logger;
    this.provider = "fallback";
  }

  getRecommendationFromScore(score) {
    if (score >= 70) return "BUY";
    if (score >= 50) return "HOLD";
    return "SELL";
  }

  calculateCompositeScore(fundamental, technical, sentiment, weights) {
    const wFundamental = Number(weights?.fundamental ?? 40);
    const wTechnical = Number(weights?.technical ?? 35);
    const wSentiment = Number(weights?.sentiment ?? 25);
    const totalWeight = wFundamental + wTechnical + wSentiment || 1;

    return Math.round(
      (Number(fundamental?.score ?? 50) * wFundamental +
        Number(technical?.score ?? 50) * wTechnical +
        Number(sentiment?.score ?? 50) * wSentiment) /
        totalWeight,
    );
  }

  async generateWeightedAISummary(
    fundamental,
    technical,
    sentiment,
    weights,
    symbol,
    timeframe = "current",
    mode = "normal",
  ) {
    const compositeScore = this.calculateCompositeScore(
      fundamental,
      technical,
      sentiment,
      weights,
    );
    const recommendation = this.getRecommendationFromScore(compositeScore);

    return [
      `${symbol} shows a ${recommendation.toLowerCase()} bias with a composite score of ${compositeScore}/100 on the ${timeframe} timeframe.`,
      `Mode: ${mode}. Fundamentals score ${fundamental?.score ?? 50}/100, technicals score ${technical?.score ?? 50}/100, and sentiment scores ${sentiment?.score ?? 50}/100.`,
      `Weighting profile: fundamental ${weights?.fundamental ?? 40}%, technical ${weights?.technical ?? 35}%, sentiment ${weights?.sentiment ?? 25}%.`,
      fundamental?.recommendation
        ? `Fundamental recommendation: ${fundamental.recommendation}.`
        : null,
      technical?.recommendation
        ? `Technical recommendation: ${technical.recommendation}.`
        : null,
      technical?.error ? `Technical note: ${technical.error}.` : null,
      fundamental?.notes ? `Fundamental note: ${fundamental.notes}.` : null,
      sentiment?.summary ? `Sentiment note: ${sentiment.summary}.` : null,
    ]
      .filter(Boolean)
      .join(" ");
  }
}

function createFallbackSummaryService(options) {
  return new FallbackSummaryService(options);
}

const fallbackSummaryServiceModule = {
  FallbackSummaryService,
  createFallbackSummaryService,
};

export { FallbackSummaryService, createFallbackSummaryService };

export default fallbackSummaryServiceModule;
