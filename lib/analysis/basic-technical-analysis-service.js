class BasicTechnicalAnalysisService {
  constructor({ logger = console } = {}) {
    this.logger = logger;
    this.availableIndicators = {
      trend: ["SMA", "SMA50", "EMA", "MACD"],
      momentum: ["RSI"],
      volatility: ["BollingerBands"],
      volume: ["OBV"],
    };
    this.defaultConfig = {
      SMA: { enabled: true, period: 20 },
      EMA: { enabled: true, period: 20 },
      SMA50: { enabled: true, period: 50 },
      RSI: { enabled: true, period: 14 },
      MACD: {
        enabled: true,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
      },
      BollingerBands: { enabled: true, period: 20, stdDev: 2 },
      OBV: { enabled: true },
    };
  }

  getAvailableIndicators() {
    return this.availableIndicators;
  }

  getDefaultConfig() {
    return this.defaultConfig;
  }

  normalizeIndicatorConfig(indicatorsConfig = {}) {
    const normalized = {};

    for (const [indicator, defaults] of Object.entries(this.defaultConfig)) {
      const provided = indicatorsConfig?.[indicator];
      normalized[indicator] = {
        ...defaults,
        ...(provided && typeof provided === "object" && !Array.isArray(provided)
          ? provided
          : {}),
      };
      normalized[indicator].enabled = normalized[indicator].enabled !== false;
    }

    return normalized;
  }

  buildEmptyIndicators(config) {
    const indicators = { patterns: [] };

    if (config.RSI?.enabled) indicators.RSI = [];
    if (config.SMA?.enabled) indicators.SMA = { values: [] };
    if (config.SMA50?.enabled) indicators.SMA50 = [];
    if (config.EMA?.enabled) indicators.EMA = [];
    if (config.MACD?.enabled) {
      indicators.MACD = { histogram: [], macd: [], signal: [] };
    }
    if (config.BollingerBands?.enabled) {
      indicators.BollingerBands = { upper: [], middle: [], lower: [] };
    }
    if (config.OBV?.enabled) indicators.OBV = [];

    return indicators;
  }

  async calculateIndicators(ohlcvData, indicatorsConfig = {}) {
    const config = this.normalizeIndicatorConfig(indicatorsConfig);

    if (!Array.isArray(ohlcvData) || ohlcvData.length < 5) {
      return this.buildEmptyIndicators(config);
    }

    const closes = ohlcvData.map((point) => Number(point.close));
    const volumes = ohlcvData.map((point) => Number(point.volume || 0));
    const indicators = { patterns: [] };

    if (config.RSI.enabled) {
      indicators.RSI = this.calculateRsi(closes, config.RSI.period);
    }
    if (config.SMA.enabled) {
      indicators.SMA = { values: this.calculateSma(closes, config.SMA.period) };
    }
    if (config.SMA50.enabled) {
      indicators.SMA50 = this.calculateSma(closes, config.SMA50.period);
    }
    if (config.EMA.enabled) {
      indicators.EMA = this.calculateEma(closes, config.EMA.period);
    }
    if (config.MACD.enabled) {
      indicators.MACD = this.calculateMacd(closes, config.MACD);
    }
    if (config.BollingerBands.enabled) {
      indicators.BollingerBands = this.calculateBollingerBands(
        closes,
        config.BollingerBands,
      );
    }
    if (config.OBV.enabled) {
      indicators.OBV = this.calculateObv(closes, volumes);
    }

    return indicators;
  }

  calculateSma(values, period) {
    const result = [];
    for (let index = 0; index < values.length; index += 1) {
      if (index + 1 < period) {
        result.push(null);
        continue;
      }

      const slice = values.slice(index + 1 - period, index + 1);
      result.push(slice.reduce((sum, value) => sum + value, 0) / period);
    }
    return result;
  }

  calculateEma(values, period) {
    const result = [];
    const multiplier = 2 / (period + 1);
    let previous = values[0];

    for (let index = 0; index < values.length; index += 1) {
      const current =
        index === 0
          ? values[index]
          : values[index] * multiplier + previous * (1 - multiplier);
      previous = current;
      result.push(current);
    }

    return result;
  }

  calculateRsi(values, period) {
    const result = [];
    if (values.length <= period) return values.map(() => null);

    let gains = 0;
    let losses = 0;

    for (let index = 1; index <= period; index += 1) {
      const change = values[index] - values[index - 1];
      if (change >= 0) gains += change;
      else losses -= change;
      result.push(null);
    }

    let averageGain = gains / period;
    let averageLoss = losses / period;
    result[period] =
      averageLoss === 0 ? 100 : 100 - 100 / (1 + averageGain / averageLoss);

    for (let index = period + 1; index < values.length; index += 1) {
      const change = values[index] - values[index - 1];
      const gain = Math.max(change, 0);
      const loss = Math.max(-change, 0);
      averageGain = (averageGain * (period - 1) + gain) / period;
      averageLoss = (averageLoss * (period - 1) + loss) / period;
      result[index] =
        averageLoss === 0 ? 100 : 100 - 100 / (1 + averageGain / averageLoss);
    }

    while (result.length < values.length) result.push(null);
    return result;
  }

  calculateMacd(values, config) {
    const fast = this.calculateEma(values, config.fastPeriod);
    const slow = this.calculateEma(values, config.slowPeriod);
    const macd = values.map((_, index) =>
      fast[index] == null || slow[index] == null
        ? null
        : fast[index] - slow[index],
    );
    const signal = this.calculateEma(
      macd.map((value) => (value == null ? 0 : value)),
      config.signalPeriod,
    );
    const histogram = macd.map((value, index) =>
      value == null || signal[index] == null ? null : value - signal[index],
    );

    return { macd, signal, histogram };
  }

  calculateBollingerBands(values, config) {
    const middle = this.calculateSma(values, config.period);
    const upper = [];
    const lower = [];

    for (let index = 0; index < values.length; index += 1) {
      if (index + 1 < config.period) {
        upper.push(null);
        lower.push(null);
        continue;
      }

      const slice = values.slice(index + 1 - config.period, index + 1);
      const average = middle[index];
      const variance =
        slice.reduce((sum, value) => sum + (value - average) ** 2, 0) /
        config.period;
      const deviation = Math.sqrt(variance) * config.stdDev;
      upper.push(average + deviation);
      lower.push(average - deviation);
    }

    return { upper, middle, lower };
  }

  calculateObv(closes, volumes) {
    const result = [];
    let current = 0;

    for (let index = 0; index < closes.length; index += 1) {
      if (index === 0) {
        result.push(0);
        continue;
      }

      if (closes[index] > closes[index - 1]) current += volumes[index];
      else if (closes[index] < closes[index - 1]) current -= volumes[index];
      result.push(current);
    }

    return result;
  }
}

function createBasicTechnicalAnalysisService(options) {
  return new BasicTechnicalAnalysisService(options);
}

module.exports = {
  BasicTechnicalAnalysisService,
  createBasicTechnicalAnalysisService,
};
