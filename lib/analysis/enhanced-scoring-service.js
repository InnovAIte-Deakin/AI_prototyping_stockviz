class EnhancedScoringService {
  constructor() {
    this.defaultWeights = {
      fundamental: 0.4,
      technical: 0.3,
      sentiment: 0.3,
    };
  }

  percentToRatio(value) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) return undefined;
    const numeric = Number(value);
    return numeric > 1 ? numeric / 100 : numeric;
  }

  normalizeFundamentalInput(fundamentalData = {}) {
    const metrics = fundamentalData.metrics || {};
    return {
      peRatio: fundamentalData.peRatio ?? metrics.pe ?? metrics.peRatio,
      priceToBook: fundamentalData.priceToBook ?? metrics.pb ?? metrics.priceToBook,
      roe:
        fundamentalData.roe ??
        metrics.returnOnEquity ??
        metrics.roe ??
        this.percentToRatio(metrics.returnOnEquityTTM),
      debtToEquity: fundamentalData.debtToEquity ?? metrics.debtToEquity,
      revenueGrowth:
        fundamentalData.revenueGrowth ??
        metrics.revenueGrowth ??
        this.percentToRatio(metrics.revenueCAGR),
      earningsGrowth:
        fundamentalData.earningsGrowth ??
        metrics.earningsGrowth ??
        this.percentToRatio(metrics.epsGrowth),
      profitMargin:
        fundamentalData.profitMargin ??
        metrics.profitMargin ??
        this.percentToRatio(metrics.profitMargin),
      currentRatio: fundamentalData.currentRatio ?? metrics.currentRatio,
      quickRatio: fundamentalData.quickRatio ?? metrics.quickRatio,
    };
  }

  calculateEnhancedFundamentalScore(fundamentalData) {
    const normalized = this.normalizeFundamentalInput(fundamentalData);
    let score = 50;
    const details = [];
    const flags = [];

    if (normalized.peRatio) {
      if (normalized.peRatio < 15) {
        score += 10;
        details.push(`Attractive P/E ratio of ${normalized.peRatio.toFixed(2)}`);
      } else if (normalized.peRatio > 30) {
        score -= 10;
        flags.push(`High P/E ratio of ${normalized.peRatio.toFixed(2)} suggests overvaluation`);
      } else if (normalized.peRatio < 25) {
        score += 5;
        details.push(`Reasonable P/E ratio of ${normalized.peRatio.toFixed(2)}`);
      }
    }

    if (normalized.roe) {
      if (normalized.roe > 0.15) {
        score += 15;
        details.push(`Excellent ROE of ${(normalized.roe * 100).toFixed(1)}%`);
      } else if (normalized.roe > 0.1) {
        score += 8;
        details.push(`Good ROE of ${(normalized.roe * 100).toFixed(1)}%`);
      } else if (normalized.roe < 0.05) {
        score -= 15;
        flags.push(`Low ROE of ${(normalized.roe * 100).toFixed(1)}% indicates poor profitability`);
      }
    }

    if (normalized.debtToEquity !== undefined) {
      if (normalized.debtToEquity < 0.3) {
        score += 10;
        details.push(`Low debt-to-equity ratio of ${normalized.debtToEquity.toFixed(2)}`);
      } else if (normalized.debtToEquity > 0.7) {
        score -= 15;
        flags.push(
          `High debt-to-equity ratio of ${normalized.debtToEquity.toFixed(2)} indicates high leverage risk`
        );
      }
    }

    if (normalized.revenueGrowth !== undefined) {
      if (normalized.revenueGrowth > 0.2) {
        score += 12;
        details.push(`Strong revenue growth of ${(normalized.revenueGrowth * 100).toFixed(1)}%`);
      } else if (normalized.revenueGrowth > 0.1) {
        score += 8;
        details.push(`Good revenue growth of ${(normalized.revenueGrowth * 100).toFixed(1)}%`);
      } else if (normalized.revenueGrowth > 0) {
        score += 4;
        details.push(`Positive revenue growth of ${(normalized.revenueGrowth * 100).toFixed(1)}%`);
      } else {
        score -= 8;
        flags.push(`Negative revenue growth of ${(normalized.revenueGrowth * 100).toFixed(1)}%`);
      }
    }

    if (normalized.profitMargin !== undefined) {
      if (normalized.profitMargin > 0.2) {
        score += 10;
        details.push(`Excellent profit margin of ${(normalized.profitMargin * 100).toFixed(1)}%`);
      } else if (normalized.profitMargin > 0.1) {
        score += 5;
        details.push(`Good profit margin of ${(normalized.profitMargin * 100).toFixed(1)}%`);
      } else if (normalized.profitMargin < 0) {
        score -= 15;
        flags.push(`Negative profit margin of ${(normalized.profitMargin * 100).toFixed(1)}%`);
      }
    }

    if (normalized.currentRatio) {
      if (normalized.currentRatio > 2.0) {
        score += 8;
        details.push(`Strong liquidity with current ratio of ${normalized.currentRatio.toFixed(2)}`);
      } else if (normalized.currentRatio < 1.0) {
        score -= 10;
        flags.push(`Poor liquidity with current ratio of ${normalized.currentRatio.toFixed(2)}`);
      }
    }

    const dataPoints = [
      normalized.peRatio,
      normalized.roe,
      normalized.debtToEquity,
      normalized.revenueGrowth,
      normalized.profitMargin,
      normalized.currentRatio,
    ].filter((value) => value !== undefined && value !== null).length;

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      confidence: Math.min(0.9, 0.4 + dataPoints * 0.1),
      details,
      flags,
      breakdown: {
        valuation: this.calculateValuationScore(normalized),
        profitability: this.calculateProfitabilityScore(normalized),
        growth: this.calculateGrowthScore(normalized),
        leverage: this.calculateLeverageScore(normalized),
        liquidity: this.calculateLiquidityScore(normalized),
      },
    };
  }

  calculateEnhancedTechnicalScore(indicators, marketData) {
    let score = 50;
    const details = [];
    const flags = [];
    const changePercent = Number(marketData?.changePercent || 0);

    if (changePercent > 8) {
      score += 12;
      details.push(`Strong positive momentum (+${changePercent.toFixed(2)}%) - bullish signal`);
    } else if (changePercent > 4) {
      score += 8;
      details.push(`Good positive momentum (+${changePercent.toFixed(2)}%)`);
    } else if (changePercent < -8) {
      score -= 12;
      flags.push(`Strong negative momentum (${changePercent.toFixed(2)}%) - bearish signal`);
    } else if (changePercent < -4) {
      score -= 8;
      flags.push(`Negative momentum (${changePercent.toFixed(2)}%)`);
    }

    const rsiSeries = indicators?.RSI || indicators?.rsi;
    if (Array.isArray(rsiSeries) && rsiSeries.length > 0) {
      const rsi = rsiSeries[rsiSeries.length - 1];
      if (rsi < 30) {
        score += 15;
        details.push(`RSI oversold at ${rsi.toFixed(1)} - potential buy signal`);
      } else if (rsi > 70) {
        score -= 15;
        flags.push(`RSI overbought at ${rsi.toFixed(1)} - potential sell signal`);
      } else if (rsi > 50) {
        score += 5;
        details.push(`RSI bullish at ${rsi.toFixed(1)}`);
      }
    }

    const lastClose = Number(marketData?.price || marketData?.close || 0);
    if (indicators?.MACD?.histogram && Array.isArray(indicators.MACD.histogram)) {
      const histogram = indicators.MACD.histogram;
      const current = histogram[histogram.length - 1];
      const previous = histogram[histogram.length - 2];

      if (current > 0 && previous <= 0) {
        score += 12;
        details.push("MACD bullish crossover - momentum turning positive");
      } else if (current > 0) {
        score += 7;
        details.push("MACD histogram positive - bullish momentum");
      } else if (current < 0 && previous >= 0) {
        score -= 12;
        flags.push("MACD bearish crossover - momentum turning negative");
      }
    }

    if (indicators?.OBV && Array.isArray(indicators.OBV) && indicators.OBV.length > 20) {
      const current = indicators.OBV[indicators.OBV.length - 1];
      const previous = indicators.OBV[indicators.OBV.length - 20];
      if (current > previous) {
        score += 8;
        details.push("On-Balance Volume increasing - accumulation pattern");
      } else {
        score -= 5;
        flags.push("On-Balance Volume decreasing - distribution pattern");
      }
    }

    if (indicators?.BollingerBands && lastClose) {
      const lower = indicators.BollingerBands.lower?.[indicators.BollingerBands.lower.length - 1];
      const upper = indicators.BollingerBands.upper?.[indicators.BollingerBands.upper.length - 1];

      if (lower !== undefined && upper !== undefined) {
        if (lastClose < lower) {
          score += 10;
          details.push("Price below lower Bollinger Band - oversold condition");
        } else if (lastClose > upper) {
          score -= 10;
          flags.push("Price above upper Bollinger Band - overbought condition");
        }
      }
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      confidence: 0.8,
      details,
      flags,
      breakdown: {
        momentum: this.calculateMomentumScore(indicators, marketData),
        trend: 50,
        volatility: 50,
        volume: 50,
      },
    };
  }

  calculateEnhancedSentimentScore(sentimentData = {}) {
    let score = 50;
    const details = [];
    const flags = [];
    const newsItems = sentimentData.newsItems || sentimentData.headlines || [];

    if (!Array.isArray(newsItems) || newsItems.length === 0) {
      flags.push("No recent news available for sentiment analysis");
      return {
        score: 50,
        confidence: 0.3,
        details: ["No news data available - neutral sentiment assumed"],
        flags,
      };
    }

    let totalSentiment = 0;
    let sentimentCount = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    newsItems.forEach((item) => {
      const raw = item.sentiment !== undefined ? item.sentiment : item.score;
      if (raw === undefined || raw === null) return;

      let normalized = Number(raw);
      if (Number.isNaN(normalized)) return;
      if (normalized > 1 || normalized < -1) normalized /= 100;

      totalSentiment += normalized;
      sentimentCount += 1;

      if (normalized > 0.1) positiveCount += 1;
      else if (normalized < -0.1) negativeCount += 1;
      else neutralCount += 1;
    });

    if (sentimentCount === 0) {
      return {
        score: 50,
        confidence: 0.3,
        details: ["No usable sentiment values were found in the news data"],
        flags: ["News items were present but had no usable sentiment values"],
      };
    }

    const avgSentiment = totalSentiment / sentimentCount;
    score += avgSentiment * 50;

    const totalNews = positiveCount + negativeCount + neutralCount;
    const positiveRatio = totalNews ? positiveCount / totalNews : 0;
    const negativeRatio = totalNews ? negativeCount / totalNews : 0;

    if (positiveRatio > 0.7) {
      score += 15;
      details.push(`Overwhelmingly positive news sentiment (${(positiveRatio * 100).toFixed(0)}% positive)`);
    } else if (positiveRatio > 0.5) {
      score += 10;
      details.push(`Majority positive sentiment (${(positiveRatio * 100).toFixed(0)}% positive)`);
    } else if (negativeRatio > 0.7) {
      score -= 15;
      flags.push(`Overwhelmingly negative news sentiment (${(negativeRatio * 100).toFixed(0)}% negative)`);
    } else if (negativeRatio > 0.5) {
      score -= 10;
      flags.push(`Majority negative sentiment (${(negativeRatio * 100).toFixed(0)}% negative)`);
    }

    details.push(`Analyzed ${totalNews} news items with average sentiment of ${avgSentiment.toFixed(2)}`);

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      confidence: Math.min(0.8, 0.4 + Math.min(totalNews, 10) * 0.04),
      details,
      flags,
      breakdown: {
        newsVolume: newsItems.length,
        positiveRatio,
        negativeRatio,
        avgSentiment,
      },
    };
  }

  calculateAggregateScore(fundamental, technical, sentiment, weights = this.defaultWeights) {
    const aggregateScore = Math.round(
      fundamental.score * weights.fundamental +
        technical.score * weights.technical +
        sentiment.score * weights.sentiment
    );

    let label;
    if (aggregateScore >= 80) label = "STRONG BUY";
    else if (aggregateScore >= 70) label = "BUY";
    else if (aggregateScore >= 60) label = "WEAK BUY";
    else if (aggregateScore >= 50) label = "HOLD";
    else if (aggregateScore >= 40) label = "WEAK SELL";
    else if (aggregateScore >= 30) label = "SELL";
    else label = "STRONG SELL";

    return {
      aggregateScore,
      label,
      confidence: Number(
        (
          fundamental.confidence * weights.fundamental +
          technical.confidence * weights.technical +
          sentiment.confidence * weights.sentiment
        ).toFixed(2)
      ),
      breakdown: {
        fundamental: fundamental.score,
        technical: technical.score,
        sentiment: sentiment.score,
      },
      details: [...fundamental.details, ...technical.details, ...sentiment.details],
      flags: [...fundamental.flags, ...technical.flags, ...sentiment.flags],
    };
  }

  calculateValuationScore(data) {
    let score = 50;
    if (data.peRatio && data.peRatio < 20) score += 15;
    if (data.priceToBook && data.priceToBook < 2) score += 10;
    return Math.max(0, Math.min(100, score));
  }

  calculateProfitabilityScore(data) {
    let score = 50;
    if (data.roe && data.roe > 0.15) score += 20;
    if (data.profitMargin && data.profitMargin > 0.1) score += 15;
    return Math.max(0, Math.min(100, score));
  }

  calculateGrowthScore(data) {
    let score = 50;
    if (data.revenueGrowth && data.revenueGrowth > 0.1) score += 25;
    if (data.earningsGrowth && data.earningsGrowth > 0.1) score += 25;
    return Math.max(0, Math.min(100, score));
  }

  calculateLeverageScore(data) {
    let score = 50;
    if (data.debtToEquity && data.debtToEquity < 0.3) score += 25;
    if (data.debtToEquity && data.debtToEquity > 0.7) score -= 25;
    return Math.max(0, Math.min(100, score));
  }

  calculateLiquidityScore(data) {
    let score = 50;
    if (data.currentRatio && data.currentRatio > 1.5) score += 25;
    if (data.quickRatio && data.quickRatio > 1.0) score += 25;
    return Math.max(0, Math.min(100, score));
  }

  calculateMomentumScore(indicators, marketData) {
    let score = 50;
    const changePercent = Number(marketData?.changePercent || 0);
    if (changePercent > 5) score += 25;
    if (changePercent < -5) score -= 25;
    return Math.max(0, Math.min(100, score));
  }
}

function createEnhancedScoringService() {
  return new EnhancedScoringService();
}

module.exports = {
  EnhancedScoringService,
  createEnhancedScoringService,
};
