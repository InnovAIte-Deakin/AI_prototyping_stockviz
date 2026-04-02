const TechnicalIndicators = require("@thuantan2060/technicalindicators");

class TechnicalAnalysisService {
  constructor({ logger = console, indicatorsLib = TechnicalIndicators } = {}) {
    this.logger = logger;
    this.indicatorsLib = indicatorsLib;
    this.availableIndicators = {
      trend: ["SMA", "EMA", "MACD", "ADX", "Ichimoku"],
      momentum: ["RSI", "Stochastic", "CCI", "WilliamsR"],
      volatility: ["BollingerBands", "ATR", "StandardDeviation"],
      volume: ["OBV", "VolumeSMA", "MoneyFlowIndex"],
    };

    this.defaultConfig = {
      SMA: { period: 20 },
      EMA: { period: 20 },
      MACD: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
      RSI: { period: 14 },
      Stochastic: { period: 14, signalPeriod: 3 },
      BollingerBands: { period: 20, stdDev: 2 },
      ATR: { period: 14 },
      ADX: { period: 14 },
      CCI: { period: 20 },
      WilliamsR: { period: 14 },
      StandardDeviation: { period: 20 },
      VolumeSMA: { period: 20 },
      MoneyFlowIndex: { period: 14 },
      Ichimoku: { conversionPeriod: 9, basePeriod: 26, spanPeriod: 52, displacement: 26 },
    };
  }

  async calculateIndicators(ohlcvData, indicatorsConfig = {}) {
    if (Object.keys(indicatorsConfig).length > 0) {
      return this.getCustomIndicators(ohlcvData, indicatorsConfig);
    }

    const results = {};
    const closes = ohlcvData.map((d) => d.close);
    const highs = ohlcvData.map((d) => d.high);
    const lows = ohlcvData.map((d) => d.low);
    const volumes = ohlcvData.map((d) => d.volume);
    const config = { ...this.defaultConfig, ...indicatorsConfig };

    try {
      for (const [indicator, settings] of Object.entries(config)) {
        if (settings.enabled === false) continue;
        this.applyIndicator(results, indicator, settings, { closes, highs, lows, volumes });
      }

      results.patterns = this.recognizePatterns(ohlcvData);
      return results;
    } catch (error) {
      this.logger.error("Technical analysis error:", error);
      throw new Error("Failed to calculate technical indicators");
    }
  }

  getCustomIndicators(ohlcvData, indicatorsConfig = {}) {
    const results = {};
    const closes = ohlcvData.map((d) => d.close);
    const highs = ohlcvData.map((d) => d.high);
    const lows = ohlcvData.map((d) => d.low);
    const volumes = ohlcvData.map((d) => d.volume);

    try {
      for (const [indicator, settings] of Object.entries(indicatorsConfig)) {
        if (settings.enabled === false) continue;
        this.applyIndicator(
          results,
          indicator,
          { ...this.defaultConfig[indicator], ...settings },
          { closes, highs, lows, volumes }
        );
      }

      if (indicatorsConfig.patterns === undefined || indicatorsConfig.patterns.enabled !== false) {
        results.patterns = this.recognizePatterns(ohlcvData);
      }

      return results;
    } catch (error) {
      this.logger.error("Custom technical analysis error:", error);
      throw new Error("Failed to calculate custom technical indicators");
    }
  }

  applyIndicator(results, indicator, settings, data) {
    switch (indicator) {
      case "SMA":
        results.SMA = this.calculateSMA(data.closes, settings.period);
        break;
      case "EMA":
        results.EMA = this.calculateEMA(data.closes, settings.period);
        break;
      case "MACD":
        results.MACD = this.calculateMACD(data.closes, settings);
        break;
      case "RSI":
        results.RSI = this.calculateRSI(data.closes, settings.period);
        break;
      case "Stochastic":
        results.Stochastic = this.calculateStochastic(data.highs, data.lows, data.closes, settings);
        break;
      case "BollingerBands":
        results.BollingerBands = this.calculateBollingerBands(data.closes, settings);
        break;
      case "ATR":
        results.ATR = this.calculateATR(data.highs, data.lows, data.closes, settings.period);
        break;
      case "OBV":
        results.OBV = this.calculateOBV(data.closes, data.volumes);
        break;
      case "ADX":
        results.ADX = this.calculateADX(data.highs, data.lows, data.closes, settings.period);
        break;
      case "CCI":
        results.CCI = this.calculateCCI(data.highs, data.lows, data.closes, settings.period);
        break;
      case "WilliamsR":
        results.WilliamsR = this.calculateWilliamsR(data.highs, data.lows, data.closes, settings.period);
        break;
      case "StandardDeviation":
        results.StandardDeviation = this.calculateStandardDeviation(data.closes, settings.period);
        break;
      case "VolumeSMA":
        results.VolumeSMA = this.calculateVolumeSMA(data.volumes, settings.period);
        break;
      case "MoneyFlowIndex":
        results.MoneyFlowIndex = this.calculateMoneyFlowIndex(
          data.highs,
          data.lows,
          data.closes,
          data.volumes,
          settings.period
        );
        break;
      case "Ichimoku":
        results.Ichimoku = this.calculateIchimokuCloud(data.highs, data.lows, data.closes, settings);
        break;
      default:
        break;
    }
  }

  calculateSMA(closes, period) {
    return new this.indicatorsLib.SMA({ period, values: closes }).getResult();
  }

  calculateEMA(closes, period) {
    return new this.indicatorsLib.EMA({ period, values: closes }).getResult();
  }

  calculateMACD(closes, settings) {
    const result = new this.indicatorsLib.MACD({
      fastPeriod: settings.fastPeriod,
      slowPeriod: settings.slowPeriod,
      signalPeriod: settings.signalPeriod,
      values: closes,
    }).getResult();

    return {
      macd: result.map((r) => r.MACD),
      signal: result.map((r) => r.signal),
      histogram: result.map((r) => r.histogram),
    };
  }

  calculateRSI(closes, period) {
    return new this.indicatorsLib.RSI({ period, values: closes }).getResult();
  }

  calculateStochastic(highs, lows, closes, settings) {
    const result = new this.indicatorsLib.Stochastic({
      period: settings.period,
      signalPeriod: settings.signalPeriod,
      high: highs,
      low: lows,
      close: closes,
    }).getResult();

    return {
      k: result.map((r) => r.k),
      d: result.map((r) => r.d),
    };
  }

  calculateBollingerBands(closes, settings) {
    const result = new this.indicatorsLib.BollingerBands({
      period: settings.period,
      stdDev: settings.stdDev,
      values: closes,
    }).getResult();

    return {
      upper: result.map((r) => r.upper),
      middle: result.map((r) => r.middle),
      lower: result.map((r) => r.lower),
    };
  }

  calculateATR(highs, lows, closes, period) {
    return new this.indicatorsLib.ATR({
      period,
      high: highs,
      low: lows,
      close: closes,
    }).getResult();
  }

  calculateOBV(closes, volumes) {
    return new this.indicatorsLib.OBV({
      close: closes,
      volume: volumes,
    }).getResult();
  }

  calculateADX(highs, lows, closes, period) {
    return new this.indicatorsLib.ADX({
      period,
      high: highs,
      low: lows,
      close: closes,
    }).getResult();
  }

  calculateCCI(highs, lows, closes, period) {
    return new this.indicatorsLib.CCI({
      period,
      high: highs,
      low: lows,
      close: closes,
    }).getResult();
  }

  calculateWilliamsR(highs, lows, closes, period) {
    return new this.indicatorsLib.WilliamsR({
      period,
      high: highs,
      low: lows,
      close: closes,
    }).getResult();
  }

  calculateStandardDeviation(values, period) {
    return new this.indicatorsLib.SD({
      period,
      values,
    }).getResult();
  }

  calculateVolumeSMA(volumes, period) {
    return new this.indicatorsLib.SMA({
      period,
      values: volumes,
    }).getResult();
  }

  calculateMoneyFlowIndex(highs, lows, closes, volumes, period) {
    return new this.indicatorsLib.MFI({
      period,
      high: highs,
      low: lows,
      close: closes,
      volume: volumes,
    }).getResult();
  }

  calculateIchimokuCloud(highs, lows, closes, config = {}) {
    return new this.indicatorsLib.IchimokuCloud({
      conversionPeriod: config.conversionPeriod || 9,
      basePeriod: config.basePeriod || 26,
      spanPeriod: config.spanPeriod || 52,
      displacement: config.displacement || 26,
      high: highs,
      low: lows,
      close: closes,
    }).getResult();
  }

  recognizePatterns(ohlcvData) {
    const patterns = [];
    const candles = ohlcvData.map((d) => ({
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    for (let i = 2; i < candles.length; i += 1) {
      const current = candles[i];
      const previous = candles[i - 1];
      const prior = candles[i - 2];

      if (this.isHammer(current)) {
        patterns.push({
          index: i,
          pattern: "Hammer",
          direction: "bullish",
          confidence: this.calculatePatternConfidence(current, "Hammer"),
        });
      }

      if (this.isBullishEngulfing(previous, current)) {
        patterns.push({
          index: i,
          pattern: "Bullish Engulfing",
          direction: "bullish",
          confidence: this.calculatePatternConfidence([previous, current], "Bullish Engulfing"),
        });
      }

      if (this.isBearishEngulfing(previous, current)) {
        patterns.push({
          index: i,
          pattern: "Bearish Engulfing",
          direction: "bearish",
          confidence: this.calculatePatternConfidence([previous, current], "Bearish Engulfing"),
        });
      }

      if (this.isMorningStar(prior, previous, current)) {
        patterns.push({
          index: i,
          pattern: "Morning Star",
          direction: "bullish",
          confidence: this.calculatePatternConfidence([prior, previous, current], "Morning Star"),
        });
      }

      if (this.isEveningStar(prior, previous, current)) {
        patterns.push({
          index: i,
          pattern: "Evening Star",
          direction: "bearish",
          confidence: this.calculatePatternConfidence([prior, previous, current], "Evening Star"),
        });
      }
    }

    return patterns;
  }

  isHammer(candle) {
    const bodySize = Math.abs(candle.open - candle.close);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    return lowerShadow >= 2 * bodySize && upperShadow <= bodySize * 0.1;
  }

  isBullishEngulfing(prevCandle, currentCandle) {
    const prevBodySize = Math.abs(prevCandle.open - prevCandle.close);
    const currentBodySize = Math.abs(currentCandle.open - currentCandle.close);
    return (
      prevCandle.close < prevCandle.open &&
      currentCandle.close > currentCandle.open &&
      currentCandle.open < prevCandle.close &&
      currentCandle.close > prevCandle.open &&
      currentBodySize > prevBodySize
    );
  }

  isBearishEngulfing(prevCandle, currentCandle) {
    const prevBodySize = Math.abs(prevCandle.open - prevCandle.close);
    const currentBodySize = Math.abs(currentCandle.open - currentCandle.close);
    return (
      prevCandle.close > prevCandle.open &&
      currentCandle.close < currentCandle.open &&
      currentCandle.open > prevCandle.close &&
      currentCandle.close < prevCandle.open &&
      currentBodySize > prevBodySize
    );
  }

  isMorningStar(priorCandle, prevCandle, currentCandle) {
    const priorIsBearish = priorCandle.close < priorCandle.open;
    const prevIsSmall =
      Math.abs(prevCandle.open - prevCandle.close) <
      Math.abs(priorCandle.open - priorCandle.close) * 0.3;
    const currentIsBullish = currentCandle.close > currentCandle.open;
    return (
      priorIsBearish &&
      prevIsSmall &&
      currentIsBullish &&
      currentCandle.close > (priorCandle.open + priorCandle.close) / 2
    );
  }

  isEveningStar(priorCandle, prevCandle, currentCandle) {
    const priorIsBullish = priorCandle.close > priorCandle.open;
    const prevIsSmall =
      Math.abs(prevCandle.open - prevCandle.close) <
      Math.abs(priorCandle.open - priorCandle.close) * 0.3;
    const currentIsBearish = currentCandle.close < currentCandle.open;
    return (
      priorIsBullish &&
      prevIsSmall &&
      currentIsBearish &&
      currentCandle.close < (priorCandle.open + priorCandle.close) / 2
    );
  }

  calculatePatternConfidence(candles, pattern) {
    let confidence = 70;
    if (pattern === "Hammer" && !Array.isArray(candles)) {
      const bodySize = Math.abs(candles.open - candles.close);
      const lowerShadow = Math.min(candles.open, candles.close) - candles.low;
      confidence = Math.min(95, 70 + (lowerShadow / bodySize) * 10);
    }
    return Math.round(confidence);
  }

  getAvailableIndicators() {
    return this.availableIndicators;
  }

  getDefaultConfig() {
    return this.defaultConfig;
  }
}

function createTechnicalAnalysisService(options) {
  return new TechnicalAnalysisService(options);
}

module.exports = {
  TechnicalAnalysisService,
  createTechnicalAnalysisService,
};
