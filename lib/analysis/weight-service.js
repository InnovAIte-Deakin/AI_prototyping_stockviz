class WeightService {
  constructor({ logger = console } = {}) {
    this.logger = logger;
    this.defaultWeights = {
      fundamental: 40,
      technical: 35,
      sentiment: 25,
    };
  }

  validateAndParseWeights(weights) {
    const { fundamental, technical, sentiment } = weights;

    if (Number.isNaN(fundamental) || Number.isNaN(technical) || Number.isNaN(sentiment)) {
      this.logger.log("Invalid weights provided, using defaults");
      return { ...this.defaultWeights };
    }

    if (fundamental < 0 || technical < 0 || sentiment < 0) {
      this.logger.log("Negative weights provided, using defaults");
      return { ...this.defaultWeights };
    }

    const total = fundamental + technical + sentiment;
    if (total === 0) {
      this.logger.log("Zero total weights, using defaults");
      return { ...this.defaultWeights };
    }

    const normalized = {
      fundamental: Math.round((fundamental / total) * 100),
      technical: Math.round((technical / total) * 100),
      sentiment: Math.round((sentiment / total) * 100),
    };

    const normalizedTotal =
      normalized.fundamental + normalized.technical + normalized.sentiment;

    if (normalizedTotal !== 100) {
      normalized.fundamental += 100 - normalizedTotal;
    }

    this.logger.log(
      `Normalized weights: F:${normalized.fundamental}% T:${normalized.technical}% S:${normalized.sentiment}%`
    );

    return normalized;
  }

  getWeightingStyle(weights) {
    const max = Math.max(weights.fundamental, weights.technical, weights.sentiment);
    if (weights.fundamental === max && max > 40) return "fundamental value investing";
    if (weights.technical === max && max > 40) return "technical trading signals";
    if (weights.sentiment === max && max > 40) return "market sentiment and psychology";
    return "balanced multi-factor approach";
  }

  suggestAlternativeWeights(currentWeights) {
    const alternatives = [];

    if (currentWeights.fundamental < 50) {
      alternatives.push({
        name: "Conservative Value",
        weights: { fundamental: 60, technical: 25, sentiment: 15 },
        description: "Focus on company fundamentals and intrinsic value",
      });
    }

    if (currentWeights.technical < 50) {
      alternatives.push({
        name: "Technical Trader",
        weights: { fundamental: 20, technical: 60, sentiment: 20 },
        description: "Emphasis on price action and technical indicators",
      });
    }

    if (currentWeights.sentiment < 40) {
      alternatives.push({
        name: "Sentiment Momentum",
        weights: { fundamental: 25, technical: 30, sentiment: 45 },
        description: "Follow market psychology and news sentiment",
      });
    }

    return alternatives;
  }
}

function createWeightService(options) {
  return new WeightService(options);
}

module.exports = {
  WeightService,
  createWeightService,
};
