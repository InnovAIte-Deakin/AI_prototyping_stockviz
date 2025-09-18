import { PillarScore, AggregateResult } from '../types/stockTypes';
import { roundToDecimal } from '../utils/normalize';

export const aggregateScores = (
  ticker: string,
  fundamentals: PillarScore | null,
  technicals: PillarScore | null,
  sentiment: PillarScore | null,
  dataSources: { provider: "AlphaVantage"; requests: string[] }
): AggregateResult => {
  const flags: string[] = [];
  const allNotes: string[] = [];

  // Collect all notes
  if (fundamentals?.notes) allNotes.push(...fundamentals.notes);
  if (technicals?.notes) allNotes.push(...technicals.notes);
  if (sentiment?.notes) allNotes.push(...sentiment.notes);

  // Default weights as per specification: T 40%, F 40%, S 20%
  let wT = 0.40; // Technical
  let wF = 0.40; // Fundamental  
  let wS = 0.20; // Sentiment

  // Check for low news coverage
  const lowNews = sentiment?.data_used?.lowNews === true || 
                 (sentiment?.subscores?.lowNewsFlag === 1);

  // Low-news cap: If lowNews = true and wS > 0.15, set wS = 0.15 
  // and redistribute to T and F proportionally
  if (lowNews && wS > 0.15) {
    const spareWeight = wS - 0.15;
    const originalTF = wT + wF; // Original T+F weight (0.80)
    
    // Distribute spare weight proportionally
    wT = wT + (spareWeight * (wT / originalTF));
    wF = wF + (spareWeight * (wF / originalTF));
    wS = 0.15;
    
    flags.push("lowNews");
    allNotes.push("Low news coverage—sentiment weight capped at 15%");
  }

  // Calculate aggregate score
  let aggregateScore: number | null = null;
  let validScores = 0;
  let weightedSum = 0;

  // Technical contribution
  let technicalContribution = 0;
  if (technicals?.score !== null && technicals?.score !== undefined) {
    technicalContribution = wT * technicals.score;
    weightedSum += technicalContribution;
    validScores++;
  }

  // Fundamental contribution  
  let fundamentalContribution = 0;
  if (fundamentals?.score !== null && fundamentals?.score !== undefined) {
    fundamentalContribution = wF * fundamentals.score;
    weightedSum += fundamentalContribution;
    validScores++;
  }

  // Sentiment contribution
  let sentimentContribution = 0;
  if (sentiment?.score !== null && sentiment?.score !== undefined) {
    sentimentContribution = wS * sentiment.score;
    weightedSum += sentimentContribution;
    validScores++;
  }

  // Calculate final aggregate score
  if (validScores > 0) {
    aggregateScore = roundToDecimal(weightedSum);
  }

  // Determine verdict based on aggregate score
  let label: AggregateResult['label'] = "Insufficient Data";
  
  if (aggregateScore !== null) {
    if (aggregateScore >= 70) {
      label = "Strong Buy";  // Changed from "BUY" to match the spec
    } else if (aggregateScore >= 40) {
      label = "Hold";        // 40 ≤ Aggregate < 70
    } else {
      label = "Sell";        // Aggregate < 40
    }
  }

  // Generate "Why" bullets (top reasons for the score)
  const whyBullets: string[] = [];

  // Add technical reasons
  if (technicals?.subscores) {
    if (technicals.subscores.rsi === 75) {
      whyBullets.push("RSI oversold - potential opportunity");
    } else if (technicals.subscores.rsi === 60) {
      whyBullets.push("RSI in healthy zone");
    } else if (technicals.subscores.rsi === 35) {
      whyBullets.push("RSI overbought - caution");
    }

    if (technicals.subscores.trend === 75) {
      whyBullets.push("SMA50 > SMA200 - bullish trend");
    } else if (technicals.subscores.trend === 35) {
      whyBullets.push("SMA50 < SMA200 - bearish trend");
    }

    if (technicals.subscores.momentum === 65) {
      whyBullets.push("Price above SMA20 - positive momentum");
    } else if (technicals.subscores.momentum === 45) {
      whyBullets.push("Price below SMA20 - weak momentum");
    }
  }

  // Add fundamental reasons
  if (fundamentals?.subscores) {
    if (fundamentals.subscores.evEbitda && fundamentals.subscores.evEbitda >= 80) {
      whyBullets.push("EV/EBITDA reasonable");
    }
    if (fundamentals.subscores.roe && fundamentals.subscores.roe >= 75) {
      whyBullets.push("Strong ROE");
    }
    if (fundamentals.subscores.revenueGrowth && fundamentals.subscores.revenueGrowth >= 65) {
      whyBullets.push("Revenue growth solid");
    }
  }

  // Add sentiment reasons
  if (lowNews) {
    whyBullets.push("Low news coverage—sentiment weight capped");
  } else if (sentiment?.score) {
    if (sentiment.score >= 70) {
      whyBullets.push("Positive sentiment in recent news");
    } else if (sentiment.score <= 30) {
      whyBullets.push("Negative sentiment in recent news");
    }
  }

  // Limit to top 6 bullets
  const topReasons = whyBullets.slice(0, 6);

  return {
    ticker,
    asOf: new Date().toISOString(),
    scores: {
      fundamentals,
      technicals,
      sentiment,
    },
    aggregateScore,
    label,
    flags,
    dataSources,
    // Add contributions for transparency
    contributions: {
      technical: roundToDecimal(technicalContribution),
      fundamental: roundToDecimal(fundamentalContribution),
      sentiment: roundToDecimal(sentimentContribution)
    },
    weights: {
      technical: roundToDecimal(wT * 100), // As percentages
      fundamental: roundToDecimal(wF * 100),
      sentiment: roundToDecimal(wS * 100)
    },
    reasons: topReasons
  };
};

export const getScoreLabel = (score: number): AggregateResult['label'] => {
  if (score >= 70) return "Strong Buy";
  if (score >= 40) return "Hold";
  return "Sell";
};

export const getScoreColor = (score: number): string => {
  if (score >= 70) return "#22c55e"; // green-500 - BUY
  if (score >= 40) return "#eab308"; // yellow-500 - HOLD  
  return "#ef4444"; // red-500 - SELL
};
