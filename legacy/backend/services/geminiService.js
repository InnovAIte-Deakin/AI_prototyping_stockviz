const { GoogleGenerativeAI } = require('@google/generative-ai');
const apiTrackingService = require('./apiTrackingService');

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initialize();
  }

  initialize() {
    try {
      if (!process.env.GEMINI_API_KEY) {
        console.log('⚠️ GEMINI_API_KEY not found in environment variables');
        return;
      }

      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      console.log('✅ Gemini AI service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI:', error.message);
    }
  }

  async generateInsights(prompt, userMode = 'normal') {
    const startTime = Date.now();
    let success = false;
    
    try {
      if (!this.model) {
        console.log('⚠️ Gemini AI not available, using fallback response');
        return this.getEnhancedFallbackResponse(prompt, userMode);
      }

      console.log(`🤖 Generating AI insights for ${userMode} mode...`);
      
      // Track API call
      apiTrackingService.logAPICall('Gemini', 'generateContent', null, null, true, 0);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const responseTime = Date.now() - startTime;
      success = true;

      console.log('✅ AI insights generated successfully');
      // Log successful API call with response time
      apiTrackingService.logAPICall('Gemini', 'generateContent', null, null, true, responseTime);
      return text;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('❌ Gemini AI error:', error.message);
      apiTrackingService.logAPICall('Gemini', 'generateContent', null, null, false, responseTime);
      return this.getEnhancedFallbackResponse(prompt, userMode);
    }
  }

  // Enhanced method with dual-mode prompts for beginners and pros
  async generateWeightedAISummary(fundamentalData, technicalData, sentimentData, weights, symbol, timeframe, userMode = 'normal') {
    const prompt = userMode === 'advanced' 
      ? this.buildProTraderPrompt(fundamentalData, technicalData, sentimentData, weights, symbol, timeframe)
      : this.buildBeginnerPrompt(fundamentalData, technicalData, sentimentData, weights, symbol, timeframe);

    return this.generateInsights(prompt, userMode);
  }

  // Enhanced fallback with mode-specific responses
  getEnhancedFallbackResponse(prompt, userMode = 'normal') {
    // Extract information from prompt
    const symbolMatch = prompt.match(/(?:STOCK ANALYSIS FOR|ANALYSIS:|FOR) ([A-Z]{1,5})/);
    const symbol = symbolMatch ? symbolMatch[1] : 'the stock';
    
    const fundamentalScoreMatch = prompt.match(/(?:Health Score|Composite Score|Fundamental.*?):\s*(\d+)/);
    const fundamentalScore = fundamentalScoreMatch ? parseInt(fundamentalScoreMatch[1]) : 50;
    
    const technicalScoreMatch = prompt.match(/(?:Trend Strength|Technical Score):\s*(\d+)/);
    const technicalScore = technicalScoreMatch ? parseInt(technicalScoreMatch[1]) : 50;
    
    const sentimentScoreMatch = prompt.match(/(?:Investor Sentiment|Sentiment Score):\s*(\d+)/);
    const sentimentScore = sentimentScoreMatch ? parseInt(sentimentScoreMatch[1]) : 50;

    const overall = Math.round((fundamentalScore + technicalScore + sentimentScore) / 3);
    
    let recommendation = 'HOLD';
    let confidence = 'Medium';
    
    if (overall >= 75) { recommendation = 'STRONG BUY'; confidence = 'High'; }
    else if (overall >= 65) { recommendation = 'BUY'; confidence = 'Medium-High'; }
    else if (overall >= 55) { recommendation = 'WEAK BUY'; confidence = 'Medium'; }
    else if (overall >= 45) { recommendation = 'HOLD'; confidence = 'Medium'; }
    else if (overall >= 35) { recommendation = 'WEAK SELL'; confidence = 'Medium'; }
    else { recommendation = 'SELL'; confidence = 'Medium-High'; }

    if (userMode === 'advanced') {
      return this.getProFallbackSummary(symbol, overall, fundamentalScore, technicalScore, sentimentScore, recommendation, confidence);
    } else {
      return this.getBeginnerFallbackSummary(symbol, overall, fundamentalScore, technicalScore, sentimentScore, recommendation, confidence);
    }
  }

  // Keep the old method for backward compatibility
  getFallbackResponse(prompt) {
    return this.getEnhancedFallbackResponse(prompt, 'normal');
  }

  // 🎓 BEGINNER-FRIENDLY PROMPT - Educational and Simple
  buildBeginnerPrompt(fundamentalData, technicalData, sentimentData, weights, symbol, timeframe) {
    return `You are a friendly financial educator helping a beginner investor understand ${symbol} stock analysis. Use simple language and explain concepts clearly.

📊 STOCK ANALYSIS FOR ${symbol} (${timeframe} timeframe)

💰 COMPANY HEALTH CHECK (${weights.fundamental}% importance):
Overall Health Score: ${fundamentalData.score}/100 ${this.getScoreEmoji(fundamentalData.score)}
${this.formatBeginnerFundamentals(fundamentalData)}

📈 PRICE TREND ANALYSIS (${weights.technical}% importance):
Trend Strength: ${technicalData.score}/100 ${this.getScoreEmoji(technicalData.score)}
${this.formatBeginnerTechnicals(technicalData)}

📰 MARKET MOOD (${weights.sentiment}% importance):
Investor Sentiment: ${sentimentData.score}/100 ${this.getScoreEmoji(sentimentData.score)}
Current Feeling: ${sentimentData.summary || 'Mixed opinions in the market'}

🎯 PLEASE PROVIDE YOUR BEGINNER-FRIENDLY ANALYSIS:

1. **SIMPLE RECOMMENDATION**: Should I BUY, HOLD, or SELL? (with confidence level)

2. **EXPLAIN LIKE I'M 5**: What does this analysis mean in simple terms?

3. **GOOD THINGS** (2-3 strengths):
   • Why might this be a good investment?

4. **WATCH OUT FOR** (2-3 risks):
   • What could go wrong?

5. **INVESTMENT TIMELINE**: 
   • How long should I hold this stock?
   • Is this for short-term trading or long-term investing?

6. **LEARNING MOMENT**:
   • What should a beginner learn from this analysis?
   • Which metric is most important to watch?

Keep it conversational, encouraging, and educational. Use analogies and simple examples. Limit to 250 words.`;
  }

  // 🏆 PRO TRADER PROMPT - Advanced and Technical
  buildProTraderPrompt(fundamentalData, technicalData, sentimentData, weights, symbol, timeframe) {
    return `You are an elite quantitative analyst providing institutional-grade analysis for ${symbol}. Deliver precise, actionable insights with specific entry/exit strategies.

⚡ PROFESSIONAL ANALYSIS: ${symbol} | ${timeframe} HORIZON

📊 FUNDAMENTAL METRICS (Weight: ${weights.fundamental}%):
Composite Score: ${fundamentalData.score}/100
${this.formatProFundamentals(fundamentalData)}

📈 TECHNICAL SETUP (Weight: ${weights.technical}%):
Technical Score: ${technicalData.score}/100
${this.formatProTechnicals(technicalData)}

📰 SENTIMENT PROFILE (Weight: ${weights.sentiment}%):
Sentiment Score: ${sentimentData.score}/100
Market Psychology: ${sentimentData.summary || 'Neutral positioning'}

🎯 DELIVER PROFESSIONAL ANALYSIS:

1. **TRADE RECOMMENDATION**: 
   • Position: BUY/HOLD/SELL with conviction level (1-10)
   • Price Target: Specific entry, target, and stop-loss levels
   • Position Size: Suggested allocation percentage

2. **RISK-REWARD PROFILE**:
   • Expected return vs. maximum drawdown
   • Probability of success (%)
   • Key risk factors with hedging strategies

3. **CATALYST ANALYSIS**:
   • Upcoming events that could move the stock
   • Fundamental inflection points
   • Technical breakout/breakdown levels

4. **SECTOR & MACRO CONTEXT**:
   • Relative performance vs sector/market
   • Economic cycle positioning
   • Correlation risks and diversification benefits

5. **EXECUTION STRATEGY**:
   • Optimal entry timing and scaling approach
   • Monitoring metrics and adjustment triggers
   • Exit strategy for different scenarios

6. **PORTFOLIO INTEGRATION**:
   • How this fits in a diversified portfolio
   • Hedging considerations
   • Tax implications for different holding periods

Provide specific numbers, percentages, and quantitative metrics. Focus on actionable intelligence. Limit to 300 words.`;
  }

  // 📊 ENHANCED TECHNICAL CHART ANALYSIS PROMPT
  buildTechnicalChartAnalysisPrompt(symbol, technicalData, userMode = 'normal') {
    const basePrompt = `Please provide a comprehensive technical analysis of the stock chart for **${symbol}**. 

Focus on the following key areas with **detailed analysis** and **bold markdown formatting**:

## **1. 📈 CANDLESTICK PATTERNS & PRICE TRENDS**
Analyze the current candlestick formations and identify:
- **Reversal patterns** (Doji, Hammer, Shooting Star, Engulfing, etc.)
- **Continuation patterns** (Flag, Pennant, Triangle formations)
- **Overall price trend** direction and strength
- **Price action** signals and market structure

## **2. 📊 VOLUME ANALYSIS**
Examine volume patterns and provide insights on:
- **Volume confirmation** of price movements
- **Volume spikes** and their significance
- **Volume trends** (increasing/decreasing with price)
- **Accumulation/Distribution** patterns

## **3. ⚡ RSI (RELATIVE STRENGTH INDEX) INTERPRETATION**
Current RSI analysis including:
- **RSI level interpretation** (Overbought >70, Oversold <30, Neutral 30-70)
- **RSI divergences** with price action
- **RSI trend lines** and support/resistance levels
- **Momentum signals** from RSI movements

## **4. 🎯 DMI (DIRECTIONAL MOVEMENT INDEX) INTERPRETATION**
Analyze directional movement indicators:
- **+DI vs -DI** relationship and crossovers
- **ADX strength** indication (>25 strong trend, <20 weak trend)
- **Trend direction** confirmation or reversal signals
- **DMI divergences** and their implications

## **5. 🎨 KEY SUPPORT AND RESISTANCE LEVELS**
Identify critical price levels:
- **Major support levels** where price might find buying interest
- **Key resistance levels** where price might face selling pressure
- **Psychological levels** (round numbers, previous highs/lows)
- **Fibonacci retracement levels** if applicable

## **6. 🚀 OVERALL OUTLOOK & TRADE SETUP IDEAS**
Provide actionable insights:
- **Short-term outlook** (1-4 weeks)
- **Medium-term outlook** (1-3 months)
- **Potential entry points** and timing
- **Risk management** suggestions (stop-loss levels)
- **Price targets** and profit-taking levels

---

**Current Technical Data:**
${this.formatTechnicalChartData(technicalData)}

---
`;

    if (userMode === 'advanced') {
      return basePrompt + `
**PROFESSIONAL ANALYSIS REQUIREMENTS:**

Provide **institutional-grade technical analysis** with:
- **Quantitative metrics** and specific price levels
- **Risk-reward ratios** for suggested trades
- **Probability assessments** for different scenarios
- **Advanced pattern recognition** (Elliott Wave, Fibonacci clusters)
- **Inter-market analysis** considerations
- **Volatility analysis** and expected price ranges
- **Time-based analysis** with specific timeframes

**Format:** Use precise numbers, percentages, and professional terminology. Target 400-500 words with actionable intelligence.`;
    } else {
      return basePrompt + `
**BEGINNER-FRIENDLY ANALYSIS REQUIREMENTS:**

Provide **educational technical analysis** with:
- **Simple explanations** of what each indicator means
- **Visual analogies** to help understand concepts
- **Clear buy/sell signals** with reasoning
- **Risk warnings** and what could go wrong
- **Learning opportunities** from current chart setup
- **Next steps** for monitoring the stock

**Format:** Use conversational language with analogies. Explain technical terms. Target 300-400 words with educational value.

**Remember:** Help the reader **learn technical analysis** while analyzing this specific chart!`;
    }
  }

  // Helper method to format technical chart data
  formatTechnicalChartData(data) {
    if (!data || !data.indicators) return 'Technical chart data not available for detailed analysis.';
    
    const { indicators } = data;
    let chartData = '';
    
    // RSI Information
    if (indicators.RSI) {
      chartData += `\n**RSI Data:**`;
      chartData += `\n- Current RSI: ${indicators.RSI.current?.toFixed(2) || 'N/A'}`;
      chartData += `\n- RSI Signal: ${indicators.RSI.signal || 'Neutral'}`;
      chartData += `\n- RSI Period: ${indicators.RSI.period || 14} days`;
      if (indicators.RSI.divergence) {
        chartData += `\n- RSI Divergence: ${indicators.RSI.divergence}`;
      }
    }
    
    // MACD Information
    if (indicators.MACD) {
      chartData += `\n\n**MACD Data:**`;
      chartData += `\n- MACD Signal: ${indicators.MACD.signal || 'Neutral'}`;
      chartData += `\n- MACD Line: ${indicators.MACD.macd?.toFixed(4) || 'N/A'}`;
      chartData += `\n- Signal Line: ${indicators.MACD.signalLine?.toFixed(4) || 'N/A'}`;
      chartData += `\n- Histogram: ${indicators.MACD.histogram?.toFixed(4) || 'N/A'}`;
      if (indicators.MACD.crossover) {
        chartData += `\n- Recent Crossover: ${indicators.MACD.crossover}`;
      }
    }
    
    // Bollinger Bands Information
    if (indicators.BollingerBands) {
      chartData += `\n\n**Bollinger Bands Data:**`;
      chartData += `\n- BB Signal: ${indicators.BollingerBands.signal || 'Neutral'}`;
      chartData += `\n- Upper Band: $${indicators.BollingerBands.upper?.toFixed(2) || 'N/A'}`;
      chartData += `\n- Middle Band (SMA): $${indicators.BollingerBands.middle?.toFixed(2) || 'N/A'}`;
      chartData += `\n- Lower Band: $${indicators.BollingerBands.lower?.toFixed(2) || 'N/A'}`;
      if (indicators.BollingerBands.percentB) {
        chartData += `\n- %B Position: ${(indicators.BollingerBands.percentB * 100).toFixed(1)}%`;
      }
    }
    
    // Volume Information
    if (indicators.OBV || indicators.VolumeSMA) {
      chartData += `\n\n**Volume Analysis:**`;
      if (indicators.OBV) {
        chartData += `\n- OBV Signal: ${indicators.OBV.signal || 'Neutral'}`;
        chartData += `\n- OBV Trend: ${indicators.OBV.trend || 'Sideways'}`;
      }
      if (indicators.VolumeSMA) {
        chartData += `\n- Volume vs Average: ${indicators.VolumeSMA.signal || 'Normal'}`;
      }
    }
    
    // ATR (Volatility) Information
    if (indicators.ATR) {
      chartData += `\n\n**Volatility Data:**`;
      chartData += `\n- ATR (14-day): $${indicators.ATR.current?.toFixed(2) || 'N/A'}`;
      chartData += `\n- ATR % of Price: ${indicators.ATR.percentageOfPrice?.toFixed(2) || 'N/A'}%`;
      chartData += `\n- Volatility Level: ${this.getVolatilityLevel(indicators.ATR.percentageOfPrice)}`;
    }
    
    // Chart Patterns
    if (data.patterns && data.patterns.length > 0) {
      chartData += `\n\n**Identified Chart Patterns:**`;
      chartData += `\n- ${data.patterns.join(', ')}`;
    }
    
    // Support/Resistance Levels (if available)
    if (data.supportResistance) {
      chartData += `\n\n**Key Price Levels:**`;
      if (data.supportResistance.resistance) {
        chartData += `\n- Resistance: $${data.supportResistance.resistance.join(', $')}`;
      }
      if (data.supportResistance.support) {
        chartData += `\n- Support: $${data.supportResistance.support.join(', $')}`;
      }
    }
    
    return chartData || 'Basic technical indicators available for analysis.';
  }

  // Helper method to determine volatility level
  getVolatilityLevel(atrPercentage) {
    if (!atrPercentage) return 'Unknown';
    if (atrPercentage > 4) return 'Very High';
    if (atrPercentage > 3) return 'High';
    if (atrPercentage > 2) return 'Moderate';
    if (atrPercentage > 1) return 'Low';
    return 'Very Low';
  }

  // New method to generate comprehensive technical chart analysis
  async generateTechnicalChartAnalysis(symbol, technicalData, userMode = 'normal') {
    const prompt = this.buildTechnicalChartAnalysisPrompt(symbol, technicalData, userMode);
    
    try {
      const analysis = await this.generateInsights(prompt, userMode);
      
      return {
        analysis: analysis,
        source: 'gemini',
        confidence: this.calculateTechnicalConfidence(technicalData),
        mode: userMode,
        type: 'technical_chart_analysis'
      };
    } catch (error) {
      console.error('❌ Technical chart analysis error:', error);
      return this.getTechnicalChartFallback(symbol, technicalData, userMode);
    }
  }

  // Helper method to format fundamentals for beginners
  formatBeginnerFundamentals(data) {
    if (!data || !data.breakdown) return 'Company health data not available';
    
    const { breakdown } = data;
    let explanation = '';
    
    if (breakdown.valuation) {
      const valueStatus = breakdown.valuation >= 70 ? 'fairly priced' : breakdown.valuation >= 40 ? 'might be expensive' : 'potentially undervalued';
      explanation += `\n• Stock Price: Currently ${valueStatus} (${breakdown.valuation}/100)`;
    }
    
    if (breakdown.profitability) {
      const profitStatus = breakdown.profitability >= 70 ? 'very profitable' : breakdown.profitability >= 40 ? 'moderately profitable' : 'struggling with profits';
      explanation += `\n• Profit Making: Company is ${profitStatus} (${breakdown.profitability}/100)`;
    }
    
    if (breakdown.growth) {
      const growthStatus = breakdown.growth >= 70 ? 'growing rapidly' : breakdown.growth >= 40 ? 'growing slowly' : 'not growing much';
      explanation += `\n• Business Growth: ${growthStatus} (${breakdown.growth}/100)`;
    }
    
    return explanation || 'Basic company metrics show mixed results';
  }

  // Helper method to format technicals for beginners
  formatBeginnerTechnicals(data) {
    if (!data || !data.indicators) return 'Price trend data not available';
    
    const { indicators } = data;
    let explanation = '';
    
    if (indicators.RSI) {
      const rsiLevel = indicators.RSI.current;
      const rsiStatus = rsiLevel > 70 ? 'overbought (might fall)' : rsiLevel < 30 ? 'oversold (might rise)' : 'neutral territory';
      explanation += `\n• Buying Pressure: Stock is ${rsiStatus} (RSI: ${rsiLevel.toFixed(1)})`;
    }
    
    if (indicators.MACD) {
      explanation += `\n• Momentum: ${indicators.MACD.signal} trend signal`;
    }
    
    if (indicators.SMA) {
      explanation += `\n• Price Direction: ${indicators.SMA.signal} compared to average price`;
    }
    
    return explanation || 'Technical signals are mixed';
  }

  // Helper method to format fundamentals for pros
  formatProFundamentals(data) {
    if (!data || !data.breakdown) return 'Fundamental data unavailable';
    
    const { breakdown } = data;
    return `
• Valuation Multiple: ${breakdown.valuation || 'N/A'}/100 (P/E: ${breakdown.pe_ratio || 'N/A'}, PEG: ${breakdown.peg_ratio || 'N/A'})
• Growth Trajectory: ${breakdown.growth || 'N/A'}/100 (Revenue CAGR: ${breakdown.revenue_growth || 'N/A'}%, EPS Growth: ${breakdown.eps_growth || 'N/A'}%)
• Profitability Metrics: ${breakdown.profitability || 'N/A'}/100 (ROE: ${breakdown.roe || 'N/A'}%, ROIC: ${breakdown.roic || 'N/A'}%, Margins: ${breakdown.profit_margin || 'N/A'}%)
• Balance Sheet: ${breakdown.financial_health || 'N/A'}/100 (D/E: ${breakdown.debt_equity || 'N/A'}, Current Ratio: ${breakdown.current_ratio || 'N/A'})
• Cash Generation: FCF Yield ${breakdown.fcf_yield || 'N/A'}%, Cash/Share: ${breakdown.cash_per_share || 'N/A'}`;
  }

  // Helper method to format technicals for pros
  formatProTechnicals(data) {
    if (!data || !data.indicators) return 'Technical data unavailable';
    
    const { indicators } = data;
    let analysis = '';
    
    if (indicators.RSI) {
      analysis += `\n• RSI(${indicators.RSI.period || 14}): ${indicators.RSI.current?.toFixed(2)} - ${indicators.RSI.signal} (Divergence: ${indicators.RSI.divergence || 'None'})`;
    }
    
    if (indicators.MACD) {
      analysis += `\n• MACD: ${indicators.MACD.signal} (Histogram: ${indicators.MACD.histogram?.toFixed(4) || 'N/A'}, Signal Line Cross: ${indicators.MACD.crossover || 'None'})`;
    }
    
    if (indicators.BollingerBands) {
      analysis += `\n• Bollinger Bands: ${indicators.BollingerBands.signal} (BB %B: ${indicators.BollingerBands.percentB?.toFixed(2) || 'N/A'}, Squeeze: ${indicators.BollingerBands.squeeze || 'No'})`;
    }
    
    if (indicators.ATR) {
      analysis += `\n• Volatility (ATR): ${indicators.ATR.current?.toFixed(2) || 'N/A'} (${indicators.ATR.percentageOfPrice?.toFixed(1) || 'N/A'}% of price)`;
    }
    
    if (data.patterns && data.patterns.length > 0) {
      analysis += `\n• Chart Patterns: ${data.patterns.join(', ')}`;
    }
    
    return analysis || 'Technical indicators show mixed signals';
  }

  // Score emoji helper
  getScoreEmoji(score) {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    if (score >= 40) return '🟠';
    return '🔴';
  }

  // Pro fallback summary
  getProFallbackSummary(symbol, overall, fundamentalScore, technicalScore, sentimentScore, recommendation, confidence) {
    return `**${recommendation}** | Confidence: ${confidence} | ${symbol}

**QUANTITATIVE ANALYSIS:**
• **Composite Score:** ${overall}/100 (F:${fundamentalScore} T:${technicalScore} S:${sentimentScore})
• **Risk-Adjusted Return:** ${this.calculateRiskAdjustedReturn(overall)}
• **Volatility Profile:** ${this.getVolatilityProfile(technicalScore)}

**EXECUTION FRAMEWORK:**
• **Entry Strategy:** ${this.getEntryStrategy(overall, technicalScore)}
• **Position Sizing:** ${this.getPositionSize(overall, confidence)}% of portfolio
• **Stop Loss:** ${this.getStopLoss(technicalScore)}% below entry
• **Price Target:** ${this.getPriceTarget(fundamentalScore, overall)}% upside potential

**RISK FACTORS:**
• **Fundamental Risk:** ${fundamentalScore < 50 ? 'High - Weak financials' : 'Low - Solid fundamentals'}
• **Technical Risk:** ${technicalScore < 50 ? 'High - Bearish setup' : 'Low - Bullish momentum'}
• **Sentiment Risk:** ${sentimentScore < 40 ? 'High - Negative sentiment' : 'Low - Positive sentiment'}

**PORTFOLIO CONTEXT:**
• **Sector Allocation:** Consider sector rotation dynamics
• **Correlation:** Monitor correlation with existing holdings
• **Rebalancing:** Review position monthly or on 15% move

*Quantitative analysis - AI insights unavailable*`;
  }

  // Beginner fallback summary
  getBeginnerFallbackSummary(symbol, overall, fundamentalScore, technicalScore, sentimentScore, recommendation, confidence) {
    return `**${recommendation}** 🎯 | ${symbol} Analysis

**SIMPLE EXPLANATION:**
Think of this like a report card for ${symbol} stock - it scored ${overall} out of 100 overall.

**WHAT THIS MEANS:**
${this.getBeginnerExplanation(overall, recommendation)}

**THE GOOD STUFF** ✅
• **Company Health:** ${fundamentalScore >= 60 ? 'The business is doing well financially' : 'The company has some financial challenges'}
• **Price Momentum:** ${technicalScore >= 60 ? 'Stock price is moving in a positive direction' : 'Stock price has been struggling lately'}
• **Investor Mood:** ${sentimentScore >= 60 ? 'People are generally optimistic about this stock' : sentimentScore >= 40 ? 'People have mixed feelings' : 'People are worried about this stock'}

**THINGS TO WATCH** ⚠️
• **Risk Level:** ${overall >= 60 ? 'Lower risk - more stable investment' : 'Higher risk - price could be volatile'}
• **Time Horizon:** ${overall >= 70 ? 'Good for long-term investing (1+ years)' : overall >= 50 ? 'Better for medium-term (6-12 months)' : 'Short-term only (1-6 months)'}

**YOUR NEXT STEP:**
${this.getBeginnerAction(overall, recommendation)}

**LEARNING TIP:** 💡
The most important number to watch is the overall score (${overall}/100). Scores above 70 are generally good, 50-70 are okay, and below 50 need careful consideration.

*Educational analysis - Learn more about investing fundamentals*`;
  }

  // Helper methods for advanced analysis
  calculateRiskAdjustedReturn(overall) {
    const expectedReturn = (overall - 50) * 0.4; // Rough estimate
    return `${expectedReturn.toFixed(1)}% annually`;
  }

  getVolatilityProfile(technicalScore) {
    if (technicalScore >= 70) return 'Low volatility expected';
    if (technicalScore >= 40) return 'Moderate volatility';
    return 'High volatility expected';
  }

  getEntryStrategy(overall, technicalScore) {
    if (overall >= 70 && technicalScore >= 60) return 'Aggressive - Full position';
    if (overall >= 60) return 'Scale in - 25% weekly over 4 weeks';
    return 'Wait for better setup - Monitor for improvement';
  }

  getPositionSize(overall, confidence) {
    const baseSize = Math.max(1, Math.min(10, overall / 10));
    const confidenceMultiplier = confidence.includes('High') ? 1.5 : confidence.includes('Low') ? 0.5 : 1;
    return Math.round(baseSize * confidenceMultiplier);
  }

  getStopLoss(technicalScore) {
    if (technicalScore >= 70) return '8-10';
    if (technicalScore >= 50) return '10-15';
    return '15-20';
  }

  getPriceTarget(fundamentalScore, overall) {
    const baseTarget = (overall - 50) * 0.8;
    const fundamentalBonus = fundamentalScore >= 70 ? 5 : 0;
    return Math.max(0, Math.round(baseTarget + fundamentalBonus));
  }

  // Helper methods for beginner analysis
  getBeginnerExplanation(overall, recommendation) {
    if (overall >= 70) {
      return `This is a pretty good stock! Like getting a B+ on a test - there are strong reasons to consider buying it.`;
    } else if (overall >= 50) {
      return `This stock is okay, like getting a C on a test. It's not bad, but not amazing either. You might want to hold onto it if you already own it.`;
    } else {
      return `This stock is struggling right now, like getting a D on a test. It might be better to avoid it or sell if you own it.`;
    }
  }

  getBeginnerAction(overall, recommendation) {
    if (recommendation.includes('BUY')) {
      return `Consider buying a small amount first (maybe 1-2% of your investment money) to test the waters.`;
    } else if (recommendation === 'HOLD') {
      return `If you own this stock, keep it for now but don't buy more. If you don't own it, wait for a better opportunity.`;
    } else {
      return `This might not be the best investment right now. Look for stocks with higher scores or wait for this one to improve.`;
    }
  }

  // Fallback for technical chart analysis
  getTechnicalChartFallback(symbol, technicalData, userMode = 'normal') {
    const indicators = technicalData?.indicators || {};
    
    if (userMode === 'advanced') {
      return {
        analysis: `# **📊 PROFESSIONAL TECHNICAL ANALYSIS: ${symbol}**

## **📈 CANDLESTICK PATTERNS & PRICE TRENDS**
**Current Setup:** Based on available data, ${symbol} shows ${this.getTrendDirection(indicators)} price action with ${this.getMomentumStatus(indicators)} momentum characteristics.

## **📊 VOLUME ANALYSIS**  
**Volume Profile:** ${indicators.OBV ? `OBV indicates ${indicators.OBV.signal} volume trend` : 'Volume analysis requires additional data for comprehensive assessment'}. Monitor for volume confirmation on breakouts.

## **⚡ RSI INTERPRETATION**
**RSI Level:** ${indicators.RSI ? `Current RSI at ${indicators.RSI.current?.toFixed(1)} indicates ${this.getRSIInterpretation(indicators.RSI.current)} conditions` : 'RSI data unavailable - recommend monitoring 14-period RSI'}

## **🎯 DMI ANALYSIS**
**Directional Movement:** DMI analysis requires real-time chart data. Recommend monitoring +DI/-DI crossovers and ADX above 25 for trend confirmation.

## **🎨 SUPPORT & RESISTANCE**
**Key Levels:** ${this.getSupportResistanceLevels(technicalData)} 
**Risk Management:** Set stops 2-3% below key support levels.

## **🚀 TRADE SETUP & OUTLOOK**
**Professional Assessment:** 
- **Entry Strategy:** ${this.getProEntryStrategy(indicators)}
- **Risk/Reward:** Monitor for 1:2 or better risk-reward setups
- **Time Horizon:** Technical signals suggest ${this.getTimeHorizon(indicators)} positioning
- **Stop Loss:** Implement at ${this.getStopLevel(indicators)}

*Professional technical analysis - Chart visualization recommended for complete assessment*`,
        source: 'fallback',
        confidence: 'medium',
        mode: 'advanced',
        type: 'technical_chart_analysis'
      };
    } else {
      return {
        analysis: `# **📊 BEGINNER'S TECHNICAL CHART GUIDE: ${symbol}**

## **📈 UNDERSTANDING PRICE PATTERNS**
**What the Chart Shows:** Think of a stock chart like a **heartbeat monitor** - it shows the health and energy of the stock price. ${symbol} currently shows ${this.getSimpleTrendExplanation(indicators)}.

## **📊 VOLUME: THE CROWD'S VOICE**  
**Volume Tells Us:** Volume is like **applause at a concert** - louder applause (higher volume) means more people are excited about the price move. ${indicators.OBV ? `Current volume suggests ${indicators.OBV.signal} investor interest.` : 'We need to watch if lots of people are buying or selling.'}

## **⚡ RSI: THE MOOD METER**
**What RSI Means:** RSI is like a **mood ring** for stocks (0-100 scale):
${indicators.RSI ? `
- **Current RSI: ${indicators.RSI.current?.toFixed(1)}** 
- ${this.getBeginnerRSIExplanation(indicators.RSI.current)}` : '- We need RSI data to check if the stock is "tired" or "energetic"'}

## **🎯 DMI: DIRECTION DETECTOR**
**Understanding Direction:** DMI is like a **compass** that shows which way the stock wants to go. We look for clear signals before making decisions.

## **🎨 SUPPORT & RESISTANCE: INVISIBLE WALLS**
**Key Price Levels:** Think of these like **invisible walls**:
- **Support:** Like a safety net - price bounces up from here
- **Resistance:** Like a ceiling - price has trouble breaking through
${this.getBeginnerSupportResistance(technicalData)}

## **🚀 WHAT SHOULD YOU DO?**
**Simple Action Plan:**
${this.getBeginnerActionPlan(indicators, symbol)}

**📚 LEARNING TIP:** Charts are like **weather maps** - they help predict what might happen, but weather can still surprise us! Always be prepared for unexpected changes.

*Educational technical analysis - Practice reading charts to improve your skills!*`,
        source: 'fallback',
        confidence: 'medium',
        mode: 'normal',
        type: 'technical_chart_analysis'
      };
    }
  }

  // Helper methods for technical analysis fallbacks
  getTrendDirection(indicators) {
    if (indicators.MACD && indicators.MACD.signal && indicators.MACD.signal.includes('Bullish')) return 'bullish';
    if (indicators.MACD && indicators.MACD.signal && indicators.MACD.signal.includes('Bearish')) return 'bearish';
    if (indicators.SMA && indicators.SMA.signal && indicators.SMA.signal.includes('Above')) return 'upward';
    if (indicators.SMA && indicators.SMA.signal && indicators.SMA.signal.includes('Below')) return 'downward';
    return 'sideways';
  }

  getMomentumStatus(indicators) {
    if (indicators.RSI) {
      const rsi = indicators.RSI.current;
      if (rsi > 70) return 'overbought';
      if (rsi < 30) return 'oversold';
      if (rsi > 50) return 'positive';
      return 'weakening';
    }
    return 'neutral';
  }

  getRSIInterpretation(rsi) {
    if (rsi > 80) return 'extremely overbought';
    if (rsi > 70) return 'overbought';
    if (rsi > 60) return 'bullish momentum';
    if (rsi > 40) return 'neutral momentum';
    if (rsi > 30) return 'bearish momentum';
    return 'oversold';
  }

  getBeginnerRSIExplanation(rsi) {
    if (rsi > 70) return '**Too Excited!** The stock might be "overheated" and could cool down soon.';
    if (rsi < 30) return '**Too Tired!** The stock might be "oversold" and could bounce back up.';
    if (rsi > 50) return '**Feeling Good!** The stock has positive energy and momentum.';
    return '**Taking a Break!** The stock is resting and could go either way.';
  }

  getSupportResistanceLevels(technicalData) {
    if (technicalData?.supportResistance) {
      return `Key resistance around $${technicalData.supportResistance.resistance?.join(', $') || 'TBD'}, support near $${technicalData.supportResistance.support?.join(', $') || 'TBD'}`;
    }
    return 'Support/resistance levels need chart analysis to identify';
  }

  getBeginnerSupportResistance(technicalData) {
    return `
- **Support Levels:** Look for prices where the stock has bounced up before
- **Resistance Levels:** Watch for prices where the stock has had trouble going higher
- **What to Watch:** If price breaks through resistance, it might keep going up!`;
  }

  getProEntryStrategy(indicators) {
    if (indicators.RSI && indicators.MACD) {
      const rsi = indicators.RSI.current;
      const macdSignal = indicators.MACD.signal;
      
      if (rsi < 40 && macdSignal && macdSignal.includes('Bullish')) {
        return 'Oversold bounce setup - Scale in on MACD confirmation';
      }
      if (rsi > 60 && macdSignal && macdSignal.includes('Bullish')) {
        return 'Momentum breakout - Wait for pullback entry';
      }
    }
    return 'Wait for clear setup - Monitor key indicators for confluence';
  }

  getBeginnerActionPlan(indicators, symbol) {
    const rsi = indicators.RSI?.current;
    const macdSignal = indicators.MACD?.signal;
    
    let plan = `**For ${symbol}:**\n`;
    
    if (rsi && rsi > 70) {
      plan += `- **Be Careful!** Stock might be too expensive right now\n`;
      plan += `- **Action:** Wait for a better price to buy\n`;
    } else if (rsi && rsi < 30) {
      plan += `- **Possible Opportunity!** Stock might be on sale\n`;
      plan += `- **Action:** Watch for signs of recovery before buying\n`;
    } else {
      plan += `- **Neutral Zone:** Stock is in a normal range\n`;
      plan += `- **Action:** Look for clear signals before making moves\n`;
    }
    
    plan += `- **Always Remember:** Only invest money you can afford to lose!`;
    
    return plan;
  }

  getSimpleTrendExplanation(indicators) {
    const trend = this.getTrendDirection(indicators);
    switch(trend) {
      case 'bullish': return '**positive energy** - like a rocket trying to go up! 🚀';
      case 'bearish': return '**negative pressure** - like a ball rolling downhill 📉';
      case 'upward': return '**climbing stairs** - going up step by step 📈';
      case 'downward': return '**sliding down** - losing altitude gradually 📉';
      default: return '**taking a rest** - moving sideways like a calm lake 🏞️';
    }
  }

  getTimeHorizon(indicators) {
    if (indicators.MACD && indicators.MACD.signal && indicators.MACD.signal.includes('Strong')) return 'medium-term (2-8 weeks)';
    if (indicators.RSI && indicators.RSI.current && (indicators.RSI.current > 70 || indicators.RSI.current < 30)) return 'short-term (1-4 weeks)';
    return 'flexible (monitor for clearer signals)';
  }

  getStopLevel(indicators) {
    if (indicators.ATR) {
      const atr = indicators.ATR.current;
      return `${(atr * 2).toFixed(2)} (2x ATR below entry)`;
    }
    return '5-8% below entry point';
  }

  calculateTechnicalConfidence(technicalData) {
    if (!technicalData || !technicalData.indicators) return 'low';
    
    const indicators = technicalData.indicators;
    let signals = 0;
    let total = 0;
    
    // Count agreeing signals
    if (indicators.RSI) {
      total++;
      if (indicators.RSI.signal && !indicators.RSI.signal.includes('Neutral')) signals++;
    }
    
    if (indicators.MACD) {
      total++;
      if (indicators.MACD.signal && !indicators.MACD.signal.includes('Neutral')) signals++;
    }
    
    if (indicators.BollingerBands) {
      total++;
      if (indicators.BollingerBands.signal && !indicators.BollingerBands.signal.includes('Neutral')) signals++;
    }
    
    const agreement = total > 0 ? signals / total : 0;
    
    if (agreement >= 0.75) return 'high';
    if (agreement >= 0.5) return 'medium';
    return 'low';
  }

  // Test connection method
  async testConnection() {
    const startTime = Date.now();
    let success = false;
    
    try {
      if (!this.model) {
        return { success: false, message: 'Gemini AI not initialized' };
      }

      const testPrompt = "Say 'Hello' if you can receive this message.";
      // Track API call
      apiTrackingService.logAPICall('Gemini', 'testConnection', null, null, true, 0);
      
      const result = await this.model.generateContent(testPrompt);
      const response = await result.response;
      const text = response.text();
      const responseTime = Date.now() - startTime;
      success = true;

      // Log successful API call with response time
      apiTrackingService.logAPICall('Gemini', 'testConnection', null, null, true, responseTime);
      return { 
        success: true, 
        message: 'Gemini AI connection successful',
        response: text.substring(0, 100) + '...'
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      apiTrackingService.logAPICall('Gemini', 'testConnection', null, null, false, responseTime);
      return { 
        success: false, 
        message: `Gemini AI connection failed: ${error.message}` 
      };
    }
  }
}

module.exports = new GeminiService();