import { safeNumber, roundToDecimal } from '../utils/normalize';
import { PillarScore } from '../types/stockTypes';

export const scoreSentiment = (data: any): PillarScore => {
  const notes: string[] = [];
  const subscores: Record<string, number | null> = {};
  const dataUsed: Record<string, unknown> = {};

  let sentimentScore = 50; // Default neutral
  let lowNews = false;
  let articleCount = 0;

  if (data.newsSentiment?.feed) {
    const articles = data.newsSentiment.feed;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let weightedSentimentSum = 0;
    let totalWeight = 0;
    const recentArticles: any[] = [];

    articles.forEach((article: any) => {
      const publishedAt = new Date(article.time_published);
      
      // Only consider articles from last 7 days
      if (publishedAt >= sevenDaysAgo) {
        // Get overall sentiment score (-1 to +1)
        const sentimentValue = safeNumber(article.overall_sentiment_score) || 0;
        
        // Calculate age in days
        const ageDays = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
        
        // Calculate decay weight with half-life of ~3 days
        // w = exp(-ln(2) * age_days / 3)
        const weight = Math.exp(-Math.log(2) * ageDays / 3);
        
        weightedSentimentSum += sentimentValue * weight;
        totalWeight += weight;
        articleCount++;
        
        recentArticles.push({
          sentiment: sentimentValue,
          weight: weight,
          ageDays: ageDays
        });
      }
    });

    // Calculate aggregate polarity
    let aggregatePolarity = 0;
    if (totalWeight > 0) {
      aggregatePolarity = weightedSentimentSum / totalWeight;
    }

    // Check for low news coverage
    if (articleCount < 3) {
      lowNews = true;
      notes.push("Low news coverage - sentiment may not be reliable");
    }

    // Map polarity (-1 to +1) to score (0 to 100)
    // S = round(50 * (P + 1))
    sentimentScore = Math.round(50 * (aggregatePolarity + 1));
    
    // Ensure score is within bounds
    sentimentScore = Math.max(0, Math.min(100, sentimentScore));

    // Store data for transparency
    dataUsed.articleCount = articleCount;
    dataUsed.aggregatePolarity = aggregatePolarity;
    dataUsed.weightedSentimentSum = weightedSentimentSum;
    dataUsed.totalWeight = totalWeight;
    dataUsed.lowNews = lowNews;

    // Add interpretive notes
    if (aggregatePolarity > 0.3) {
      notes.push("Strong positive sentiment in recent news");
    } else if (aggregatePolarity > 0.1) {
      notes.push("Moderately positive sentiment");
    } else if (aggregatePolarity > -0.1) {
      notes.push("Neutral sentiment in recent news");
    } else if (aggregatePolarity > -0.3) {
      notes.push("Moderately negative sentiment");
    } else {
      notes.push("Strong negative sentiment in recent news");
    }

    notes.push(`Based on ${articleCount} articles from last 7 days`);

  } else {
    // No news data available
    lowNews = true;
    sentimentScore = 50; // Neutral
    notes.push("No recent news data available - using neutral sentiment");
    dataUsed.articleCount = 0;
    dataUsed.aggregatePolarity = 0;
    dataUsed.lowNews = true;
  }

  // Store the low news flag for use in final aggregation
  subscores.sentiment7d = sentimentScore;
  subscores.lowNewsFlag = lowNews ? 1 : 0; // Store as number for consistency

  return {
    score: roundToDecimal(sentimentScore),
    subscores,
    data_used: dataUsed,
    notes
  };
};
