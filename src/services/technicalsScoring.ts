import { safeNumber, roundToDecimal } from '../utils/normalize';
import { PillarScore } from '../types/stockTypes';

export const scoreTechnicals = (data: any): PillarScore => {
  const notes: string[] = [];
  const subscores: Record<string, number | null> = {};
  const dataUsed: Record<string, unknown> = {};

  // Extract daily price series and calculate indicators locally
  let closePrices: number[] = [];
  let hasLimitedHistory = false;

  if (data.dailySeries?.['Time Series (Daily)']) {
    const dailyData = data.dailySeries['Time Series (Daily)'];
    const sortedDates = Object.keys(dailyData).sort(); // Ascending order
    
    closePrices = sortedDates.map(date => 
      safeNumber(dailyData[date]['4. close']) || 0
    ).filter(price => price > 0);
    
    // Check if we have enough history (need at least 200 days for SMA200)
    if (closePrices.length < 200) {
      hasLimitedHistory = true;
      notes.push("Limited price history - scores may be less reliable");
    }
  }

  // If insufficient data, return neutral score
  if (closePrices.length < 20) {
    notes.push("Insufficient price data for technical analysis");
    return {
      score: 50, // Neutral score
      subscores: { rsi: null, trend: null, momentum: null },
      data_used: { daysOfData: closePrices.length },
      notes
    };
  }

  const currentClose = closePrices[closePrices.length - 1];
  dataUsed.currentClose = currentClose;
  dataUsed.daysOfData = closePrices.length;

  // Calculate Simple Moving Averages locally
  const calculateSMA = (prices: number[], period: number): number => {
    if (prices.length < period) return 0;
    const recent = prices.slice(-period);
    return recent.reduce((sum, price) => sum + price, 0) / period;
  };

  const sma20 = calculateSMA(closePrices, 20);
  const sma50 = calculateSMA(closePrices, 50);
  const sma200 = calculateSMA(closePrices, 200);

  dataUsed.sma20 = sma20;
  dataUsed.sma50 = sma50;
  dataUsed.sma200 = sma200;

  // Calculate RSI(14) locally
  const calculateRSI = (prices: number[], period: number = 14): number => {
    if (prices.length < period + 1) return 50; // Neutral if insufficient data
    
    let gains = 0;
    let losses = 0;
    
    // Calculate initial average gain/loss
    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100; // No losses = max RSI
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const rsi = calculateRSI(closePrices, 14);
  dataUsed.rsi = rsi;

  // 1. RSI Score (40% weight)
  let rsiScore: number;
  if (rsi >= 30 && rsi <= 70) {
    rsiScore = 60; // Normal range
    notes.push("RSI in healthy zone (30-70)");
  } else if (rsi < 30) {
    rsiScore = 75; // Oversold - potential buying opportunity
    notes.push("RSI oversold - potential buying opportunity");
  } else { // rsi > 70
    rsiScore = 35; // Overbought - potential selling pressure
    notes.push("RSI overbought - potential selling pressure");
  }
  subscores.rsi = rsiScore;

  // 2. Trend Score (35% weight) - SMA50 vs SMA200
  let trendScore: number;
  if (sma50 > 0 && sma200 > 0) {
    if (sma50 > sma200) {
      trendScore = 75; // Bullish trend
      notes.push("SMA50 > SMA200 - bullish trend");
    } else {
      trendScore = 35; // Bearish trend
      notes.push("SMA50 < SMA200 - bearish trend");
    }
  } else {
    trendScore = 50; // Neutral if can't calculate
    notes.push("Insufficient data for trend analysis");
  }
  subscores.trend = trendScore;

  // 3. Short Momentum Score (25% weight) - Close vs SMA20
  let momentumScore: number;
  if (sma20 > 0) {
    if (currentClose > sma20) {
      momentumScore = 65; // Above short-term average
      notes.push("Price above SMA20 - positive short-term momentum");
    } else {
      momentumScore = 45; // Below short-term average
      notes.push("Price below SMA20 - negative short-term momentum");
    }
  } else {
    momentumScore = 50; // Neutral if can't calculate
    notes.push("Insufficient data for momentum analysis");
  }
  subscores.momentum = momentumScore;

  // Calculate final technical score with specified weights
  const weights = {
    rsi: 0.40,      // 40%
    trend: 0.35,    // 35%
    momentum: 0.25  // 25%
  };

  const technicalScore = 
    weights.rsi * rsiScore + 
    weights.trend * trendScore + 
    weights.momentum * momentumScore;

  // If limited history, return around 50 with note
  if (hasLimitedHistory && closePrices.length < 200) {
    return {
      score: roundToDecimal(Math.min(technicalScore, 55)), // Cap slightly above neutral
      subscores,
      data_used: dataUsed,
      notes: [...notes, "Limited history - technical score capped"]
    };
  }

  return {
    score: roundToDecimal(technicalScore),
    subscores,
    data_used: dataUsed,
    notes
  };
};
