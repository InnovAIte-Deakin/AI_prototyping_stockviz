class WeightService {
  constructor() {
    this.defaultWeights = {
      fundamental: 40,
      technical: 35,
      sentiment: 25
    };
  }

  // Validate and normalize weights
  validateAndParseWeights(weights) {
    const { fundamental, technical, sentiment } = weights;
    
    // Check if all weights are valid numbers
    if (isNaN(fundamental) || isNaN(technical) || isNaN(sentiment)) {
      console.log('⚠️ Invalid weights provided, using defaults');
      return this.defaultWeights;
    }

    // Check if weights are positive
    if (fundamental < 0 || technical < 0 || sentiment < 0) {
      console.log('⚠️ Negative weights provided, using defaults');
      return this.defaultWeights;
    }

    // Calculate total
    const total = fundamental + technical + sentiment;
    
    // If total is 0, use defaults
    if (total === 0) {
      console.log('⚠️ Zero total weights, using defaults');
      return this.defaultWeights;
    }

    // Normalize to 100%
    const normalized = {
      fundamental: Math.round((fundamental / total) * 100),
      technical: Math.round((technical / total) * 100),
      sentiment: Math.round((sentiment / total) * 100)
    };

    // Adjust for rounding errors (ensure total = 100)
    const normalizedTotal = normalized.fundamental + normalized.technical + normalized.sentiment;
    if (normalizedTotal !== 100) {
      const diff = 100 - normalizedTotal;
      normalized.fundamental += diff; // Add difference to fundamental
    }

    console.log(`✅ Normalized weights: F:${normalized.fundamental}% T:${normalized.technical}% S:${normalized.sentiment}%`);
    return normalized;
  }

  // Determine weighting style
  getWeightingStyle(weights) {
    const max = Math.max(weights.fundamental, weights.technical, weights.sentiment);
    if (weights.fundamental === max && max > 40) return 'fundamental value investing';
    if (weights.technical === max && max > 40) return 'technical trading signals';
    if (weights.sentiment === max && max > 40) return 'market sentiment and psychology';
    return 'balanced multi-factor approach';
  }

  // Suggest alternative weight combinations
  suggestAlternativeWeights(currentWeights) {
    const alternatives = [];
    
    // Conservative approach
    if (currentWeights.fundamental < 50) {
      alternatives.push({
        name: 'Conservative Value',
        weights: { fundamental: 60, technical: 25, sentiment: 15 },
        description: 'Focus on company fundamentals and intrinsic value'
      });
    }
    
    // Technical trading approach
    if (currentWeights.technical < 50) {
      alternatives.push({
        name: 'Technical Trader',
        weights: { fundamental: 20, technical: 60, sentiment: 20 },
        description: 'Emphasis on price action and technical indicators'
      });
    }
    
    // Sentiment-driven approach
    if (currentWeights.sentiment < 40) {
      alternatives.push({
        name: 'Sentiment Momentum',
        weights: { fundamental: 25, technical: 30, sentiment: 45 },
        description: 'Follow market psychology and news sentiment'
      });
    }
    
    return alternatives;
  }
}

module.exports = new WeightService();