const TechnicalIndicators = require('@thuantan2060/technicalindicators');

class TechnicalAnalysisService {
  constructor() {
    this.availableIndicators = {
      trend: ['SMA', 'EMA', 'MACD', 'ADX', 'Ichimoku'],
      momentum: ['RSI', 'Stochastic', 'CCI', 'WilliamsR'],
      volatility: ['BollingerBands', 'ATR', 'StandardDeviation'],
      volume: ['OBV', 'VolumeSMA', 'MoneyFlowIndex']
    };

    this.defaultConfig = {
      SMA: { period: 20 },
      EMA: { period: 20 },
      MACD: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
      RSI: { period: 14 },
      Stochastic: { period: 14, signalPeriod: 3 },
      BollingerBands: { period: 20, stdDev: 2 },
      ATR: { period: 14 }
    };
  }

  // Calculate all requested indicators
  async calculateIndicators(ohlcvData, indicatorsConfig = {}) {
    // If custom indicators are specified, use them
    if (Object.keys(indicatorsConfig).length > 0) {
      return this.getCustomIndicators(ohlcvData, indicatorsConfig);
    }
    
    // Otherwise, use the default behavior (all indicators)
    const results = {};
    const closes = ohlcvData.map(d => d.close);
    const highs = ohlcvData.map(d => d.high);
    const lows = ohlcvData.map(d => d.low);
    const volumes = ohlcvData.map(d => d.volume);
    
    // Merge with default config
    const config = { ...this.defaultConfig, ...indicatorsConfig };
    
    try {
      // Calculate each requested indicator
      for (const [indicator, settings] of Object.entries(config)) {
        if (settings.enabled === false) continue;
        
        switch (indicator) {
          case 'SMA':
            results.SMA = this.calculateSMA(closes, settings.period);
            break;
          case 'EMA':
            results.EMA = this.calculateEMA(closes, settings.period);
            break;
          case 'MACD':
            results.MACD = this.calculateMACD(closes, settings);
            break;
          case 'RSI':
            results.RSI = this.calculateRSI(closes, settings.period);
            break;
          case 'Stochastic':
            results.Stochastic = this.calculateStochastic(highs, lows, closes, settings);
            break;
          case 'BollingerBands':
            results.BollingerBands = this.calculateBollingerBands(closes, settings);
            break;
          case 'ATR':
            results.ATR = this.calculateATR(highs, lows, closes, settings.period);
            break;
          case 'OBV':
            results.OBV = this.calculateOBV(closes, volumes);
            break;
        }
      }
      
      // Add pattern recognition
      results.patterns = this.recognizePatterns(ohlcvData);
      
      return results;
    } catch (error) {
      console.error('Technical analysis error:', error);
      throw new Error('Failed to calculate technical indicators');
    }
  }

  // Calculate only requested indicators
  getCustomIndicators(ohlcvData, indicatorsConfig = {}) {
    const results = {};
    const closes = ohlcvData.map(d => d.close);
    const highs = ohlcvData.map(d => d.high);
    const lows = ohlcvData.map(d => d.low);
    const volumes = ohlcvData.map(d => d.volume);
    
    try {
      // Calculate only requested indicators
      for (const [indicator, settings] of Object.entries(indicatorsConfig)) {
        if (settings.enabled === false) continue;
        
        switch (indicator) {
          case 'SMA':
            results.SMA = this.calculateSMA(closes, settings.period || this.defaultConfig.SMA.period);
            break;
          case 'EMA':
            results.EMA = this.calculateEMA(closes, settings.period || this.defaultConfig.EMA.period);
            break;
          case 'MACD':
            results.MACD = this.calculateMACD(closes, {
              fastPeriod: settings.fastPeriod || this.defaultConfig.MACD.fastPeriod,
              slowPeriod: settings.slowPeriod || this.defaultConfig.MACD.slowPeriod,
              signalPeriod: settings.signalPeriod || this.defaultConfig.MACD.signalPeriod
            });
            break;
          case 'RSI':
            results.RSI = this.calculateRSI(closes, settings.period || this.defaultConfig.RSI.period);
            break;
          case 'Stochastic':
            results.Stochastic = this.calculateStochastic(highs, lows, closes, {
              period: settings.period || this.defaultConfig.Stochastic.period,
              signalPeriod: settings.signalPeriod || this.defaultConfig.Stochastic.signalPeriod
            });
            break;
          case 'BollingerBands':
            results.BollingerBands = this.calculateBollingerBands(closes, {
              period: settings.period || this.defaultConfig.BollingerBands.period,
              stdDev: settings.stdDev || this.defaultConfig.BollingerBands.stdDev
            });
            break;
          case 'ATR':
            results.ATR = this.calculateATR(highs, lows, closes, settings.period || this.defaultConfig.ATR.period);
            break;
          case 'OBV':
            results.OBV = this.calculateOBV(closes, volumes);
            break;
        }
      }
      
      // Add pattern recognition if requested or by default
      if (indicatorsConfig.patterns === undefined || indicatorsConfig.patterns.enabled !== false) {
        results.patterns = this.recognizePatterns(ohlcvData);
      }
      
      return results;
    } catch (error) {
      console.error('Custom technical analysis error:', error);
      throw new Error('Failed to calculate custom technical indicators');
    }
  }

  // Individual indicator calculations using @thuantan2060/technicalindicators
  calculateSMA(closes, period) {
    const sma = new TechnicalIndicators.SMA({ period, values: closes });
    return sma.getResult();
  }

  calculateEMA(closes, period) {
    const ema = new TechnicalIndicators.EMA({ period, values: closes });
    return ema.getResult();
  }

  calculateMACD(closes, settings) {
    const macd = new TechnicalIndicators.MACD({
      fastPeriod: settings.fastPeriod,
      slowPeriod: settings.slowPeriod,
      signalPeriod: settings.signalPeriod,
      values: closes
    });
    const result = macd.getResult();
    return {
      macd: result.map(r => r.MACD),
      signal: result.map(r => r.signal),
      histogram: result.map(r => r.histogram)
    };
  }

  calculateRSI(closes, period) {
    const rsi = new TechnicalIndicators.RSI({ period, values: closes });
    return rsi.getResult();
  }

  calculateStochastic(highs, lows, closes, settings) {
    const stochastic = new TechnicalIndicators.Stochastic({
      period: settings.period,
      signalPeriod: settings.signalPeriod,
      high: highs,
      low: lows,
      close: closes
    });
    const result = stochastic.getResult();
    return {
      k: result.map(r => r.k),
      d: result.map(r => r.d)
    };
  }

  calculateBollingerBands(closes, settings) {
    const bb = new TechnicalIndicators.BollingerBands({
      period: settings.period,
      stdDev: settings.stdDev,
      values: closes
    });
    const result = bb.getResult();
    return {
      upper: result.map(r => r.upper),
      middle: result.map(r => r.middle),
      lower: result.map(r => r.lower)
    };
  }

  calculateATR(highs, lows, closes, period) {
    // ATR calculation requires high, low, close arrays and period
    const atr = new TechnicalIndicators.ATR({
      period,
      high: highs,
      low: lows,
      close: closes
    });
    return atr.getResult();
  }

  calculateOBV(closes, volumes) {
    const obv = new TechnicalIndicators.OBV({
      close: closes,
      volume: volumes
    });
    return obv.getResult();
  }

  recognizePatterns(ohlcvData) {
    const patterns = [];
    const candles = ohlcvData.map(d => ({
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close
    }));

    // Check for common patterns
    for (let i = 2; i < candles.length; i++) {
      const current = candles[i];
      const previous = candles[i - 1];
      const prior = candles[i - 2];

      // Hammer pattern
      if (this.isHammer(current)) {
        patterns.push({
          index: i,
          pattern: 'Hammer',
          direction: 'bullish',
          confidence: this.calculatePatternConfidence(current, 'Hammer')
        });
      }

      // Engulfing pattern
      if (this.isBullishEngulfing(previous, current)) {
        patterns.push({
          index: i,
          pattern: 'Bullish Engulfing',
          direction: 'bullish',
          confidence: this.calculatePatternConfidence([previous, current], 'Bullish Engulfing')
        });
      }

      if (this.isBearishEngulfing(previous, current)) {
        patterns.push({
          index: i,
          pattern: 'Bearish Engulfing',
          direction: 'bearish',
          confidence: this.calculatePatternConfidence([previous, current], 'Bearish Engulfing')
        });
      }

      // Morning/Evening star
      if (i >= 2 && this.isMorningStar(prior, previous, current)) {
        patterns.push({
          index: i,
          pattern: 'Morning Star',
          direction: 'bullish',
          confidence: this.calculatePatternConfidence([prior, previous, current], 'Morning Star')
        });
      }

      if (i >= 2 && this.isEveningStar(prior, previous, current)) {
        patterns.push({
          index: i,
          pattern: 'Evening Star',
          direction: 'bearish',
          confidence: this.calculatePatternConfidence([prior, previous, current], 'Evening Star')
        });
      }
    }

    return patterns;
  }

  // Pattern detection helpers
  isHammer(candle) {
    const bodySize = Math.abs(candle.open - candle.close);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    
    return lowerShadow >= 2 * bodySize && upperShadow <= bodySize * 0.1;
  }

  isBullishEngulfing(prevCandle, currentCandle) {
    const prevBodySize = Math.abs(prevCandle.open - prevCandle.close);
    const currentBodySize = Math.abs(currentCandle.open - currentCandle.close);
    
    return prevCandle.close < prevCandle.open && // Previous was bearish
           currentCandle.close > currentCandle.open && // Current is bullish
           currentCandle.open < prevCandle.close &&
           currentCandle.close > prevCandle.open &&
           currentBodySize > prevBodySize;
  }

  isBearishEngulfing(prevCandle, currentCandle) {
    const prevBodySize = Math.abs(prevCandle.open - prevCandle.close);
    const currentBodySize = Math.abs(currentCandle.open - currentCandle.close);
    
    return prevCandle.close > prevCandle.open && // Previous was bullish
           currentCandle.close < currentCandle.open && // Current is bearish
           currentCandle.open > prevCandle.close &&
           currentCandle.close < prevCandle.open &&
           currentBodySize > prevBodySize;
  }

  isMorningStar(priorCandle, prevCandle, currentCandle) {
    const priorIsBearish = priorCandle.close < priorCandle.open;
    const prevIsSmall = Math.abs(prevCandle.open - prevCandle.close) < 
                       Math.abs(priorCandle.open - priorCandle.close) * 0.3;
    const currentIsBullish = currentCandle.close > currentCandle.open;
    
    return priorIsBearish && prevIsSmall && currentIsBullish &&
           currentCandle.close > (priorCandle.open + priorCandle.close) / 2;
  }

  isEveningStar(priorCandle, prevCandle, currentCandle) {
    const priorIsBullish = priorCandle.close > priorCandle.open;
    const prevIsSmall = Math.abs(prevCandle.open - prevCandle.close) < 
                       Math.abs(priorCandle.open - priorCandle.close) * 0.3;
    const currentIsBearish = currentCandle.close < currentCandle.open;
    
    return priorIsBullish && prevIsSmall && currentIsBearish &&
           currentCandle.close < (priorCandle.open + priorCandle.close) / 2;
  }

  calculatePatternConfidence(candles, pattern) {
    // Simple confidence calculation based on pattern characteristics
    let confidence = 70; // Base confidence
    
    if (pattern === 'Hammer') {
      const candle = candles;
      const bodySize = Math.abs(candle.open - candle.close);
      const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
      confidence = Math.min(95, 70 + (lowerShadow / bodySize) * 10);
    }
    
    return Math.round(confidence);
  }

  // Get available indicators
  getAvailableIndicators() {
    return this.availableIndicators;
  }

  // Get default configuration
  getDefaultConfig() {
    return this.defaultConfig;
  }
}

module.exports = new TechnicalAnalysisService();