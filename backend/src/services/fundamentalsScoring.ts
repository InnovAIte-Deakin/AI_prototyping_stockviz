import { safeNumber, roundToDecimal } from '../utils/normalize';
import { PillarScore } from '../types/stockTypes';

export const scoreFundamentals = (data: any): PillarScore => {
  const notes: string[] = [];
  const subscores: Record<string, number | null> = {};
  const dataUsed: Record<string, unknown> = {};
  
  // Extract data from OVERVIEW only (as per new specification)
  const overview = data.overview;
  
  if (!overview) {
    notes.push("No company overview data available");
    return {
      score: 50, // Neutral score when no data
      subscores: {},
      data_used: {},
      notes
    };
  }

  // Extract metrics from overview
  const evEbitda = safeNumber(overview.EVToEBITDA);
  const roe = safeNumber(overview.ReturnOnEquityTTM);
  const operatingMargin = safeNumber(overview.OperatingMarginTTM);
  const revenueGrowth = safeNumber(overview.QuarterlyRevenueGrowthYOY);
  const earningsGrowth = safeNumber(overview.QuarterlyEarningsGrowthYOY);
  const dividendYield = safeNumber(overview.DividendYield);

  // Store raw data
  dataUsed.evEbitda = evEbitda;
  dataUsed.roe = roe;
  dataUsed.operatingMargin = operatingMargin;
  dataUsed.revenueGrowth = revenueGrowth;
  dataUsed.earningsGrowth = earningsGrowth;
  dataUsed.dividendYield = dividendYield;

  // Metric weights (must sum to 1.0)
  const weights = {
    evEbitda: 0.30,
    roe: 0.20,
    operatingMargin: 0.15,
    revenueGrowth: 0.20,
    earningsGrowth: 0.10,
    dividendYield: 0.05
  };

  // Scoring functions based on specified bands

  // 1. EV/EBITDA (lower is better) - 30%
  const scoreEvEbitda = (value: number | null): number | null => {
    if (value === null || value === undefined) return null;
    if (value <= 6) return 90;
    if (value <= 8) return 80;
    if (value <= 10) return 65;
    if (value <= 14) return 45;
    return 25; // > 14
  };

  // 2. ROE TTM % - 20%
  const scoreRoe = (value: number | null): number | null => {
    if (value === null || value === undefined) return null;
    const roePercent = value * 100; // Convert to percentage
    if (roePercent >= 20) return 90;
    if (roePercent >= 12) return 75;
    if (roePercent >= 8) return 60;
    if (roePercent >= 4) return 45;
    return 25; // < 4%
  };

  // 3. Operating Margin TTM % - 15%
  const scoreOperatingMargin = (value: number | null): number | null => {
    if (value === null || value === undefined) return null;
    const marginPercent = value * 100; // Convert to percentage
    if (marginPercent >= 20) return 85;
    if (marginPercent >= 10) return 70;
    if (marginPercent >= 5) return 55;
    if (marginPercent >= 0) return 40;
    return 25; // < 0%
  };

  // 4. Revenue Growth YoY % - 20%
  const scoreRevenueGrowth = (value: number | null): number | null => {
    if (value === null || value === undefined) return null;
    const growthPercent = value * 100; // Convert to percentage
    if (growthPercent >= 15) return 80;
    if (growthPercent >= 5) return 65;
    if (growthPercent >= 0) return 50;
    if (growthPercent >= -10) return 35;
    return 20; // < -10%
  };

  // 5. Earnings Growth YoY % - 10%
  const scoreEarningsGrowth = (value: number | null): number | null => {
    if (value === null || value === undefined) return null;
    const growthPercent = value * 100; // Convert to percentage
    if (growthPercent >= 25) return 85;
    if (growthPercent >= 10) return 70;
    if (growthPercent >= 0) return 55;
    if (growthPercent >= -10) return 40;
    return 25; // < -10%
  };

  // 6. Dividend Yield % - 5%
  const scoreDividendYield = (value: number | null): number | null => {
    if (value === null || value === undefined) return null;
    const yieldPercent = value * 100; // Convert to percentage
    if (yieldPercent >= 3) return 75;
    if (yieldPercent >= 1) return 60;
    if (yieldPercent >= 0) return 45;
    return 25; // < 0%
  };

  // Calculate individual scores
  subscores.evEbitda = scoreEvEbitda(evEbitda);
  subscores.roe = scoreRoe(roe);
  subscores.operatingMargin = scoreOperatingMargin(operatingMargin);
  subscores.revenueGrowth = scoreRevenueGrowth(revenueGrowth);
  subscores.earningsGrowth = scoreEarningsGrowth(earningsGrowth);
  subscores.dividendYield = scoreDividendYield(dividendYield);

  // Add interpretive notes
  if (evEbitda !== null) {
    if (evEbitda <= 8) notes.push("EV/EBITDA ratio looks reasonable");
    else if (evEbitda > 14) notes.push("High EV/EBITDA - may be overvalued");
  }

  if (roe !== null) {
    if (roe * 100 >= 15) notes.push("Strong return on equity");
    else if (roe * 100 < 8) notes.push("Low return on equity");
  }

  if (operatingMargin !== null) {
    if (operatingMargin * 100 >= 15) notes.push("Strong operating margins");
    else if (operatingMargin * 100 < 5) notes.push("Weak operating margins");
  }

  if (revenueGrowth !== null) {
    if (revenueGrowth * 100 >= 10) notes.push("Strong revenue growth");
    else if (revenueGrowth * 100 < 0) notes.push("Revenue declining");
  }

  if (earningsGrowth !== null) {
    if (earningsGrowth * 100 >= 15) notes.push("Strong earnings growth");
    else if (earningsGrowth * 100 < 0) notes.push("Earnings declining");
  }

  // Calculate weighted average, handling missing data by re-weighting
  let totalScore = 0;
  let totalWeight = 0;
  const availableMetrics: string[] = [];

  Object.entries(subscores).forEach(([metric, score]) => {
    if (score !== null && score !== undefined) {
      const weight = weights[metric as keyof typeof weights];
      totalScore += score * weight;
      totalWeight += weight;
      availableMetrics.push(metric);
    }
  });

  // If we have any valid metrics, normalize the score
  let finalScore = 50; // Default neutral score
  if (totalWeight > 0) {
    finalScore = totalScore / totalWeight; // Re-weight remaining metrics
  }

  // Add note about missing data if significant
  const missingCount = Object.values(subscores).filter(score => score === null).length;
  const totalCount = Object.keys(subscores).length;
  
  if (missingCount > 0) {
    notes.push(`${missingCount}/${totalCount} fundamental metrics missing - re-weighted remaining metrics`);
  }

  if (availableMetrics.length === 0) {
    notes.push("No fundamental data available - using neutral score");
    finalScore = 50;
  }

  return {
    score: roundToDecimal(finalScore),
    subscores,
    data_used: dataUsed,
    notes
  };
};
