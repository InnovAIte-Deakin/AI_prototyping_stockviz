const { GoogleGenerativeAI } = require('@google/generative-ai');

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

  async generateInsights(prompt) {
    try {
      if (!this.model) {
        console.log('⚠️ Gemini AI not available, using fallback response');
        return this.getFallbackResponse(prompt);
      }

      console.log('🤖 Generating AI insights...');
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('✅ AI insights generated successfully');
      return text;

    } catch (error) {
      console.error('❌ Gemini AI error:', error.message);
      return this.getFallbackResponse(prompt);
    }
  }

  getFallbackResponse(prompt) {
    // Extract more information from the enhanced prompt
    const symbolMatch = prompt.match(/STOCK: ([A-Z]{1,5})/);
    const symbol = symbolMatch ? symbolMatch[1] : 'the stock';
    
    const fundamentalScoreMatch = prompt.match(/FUNDAMENTAL ANALYSIS[^]*?Score: (\d+)/);
    const fundamentalScore = fundamentalScoreMatch ? fundamentalScoreMatch[1] : 'N/A';
    
    const technicalScoreMatch = prompt.match(/TECHNICAL ANALYSIS[^]*?Score: (\d+)/);
    const technicalScore = technicalScoreMatch ? technicalScoreMatch[1] : 'N/A';
    
    const sentimentScoreMatch = prompt.match(/SENTIMENT ANALYSIS[^]*?Score: (\d+)/);
    const sentimentScore = sentimentScoreMatch ? sentimentScoreMatch[1] : 'N/A';
    
    const weightedScoreMatch = prompt.match(/Weighted Score: (\d+)/);
    const weightedScore = weightedScoreMatch ? weightedScoreMatch[1] : 'N/A';

    return `COMPREHENSIVE ANALYSIS REPORT FOR ${symbol}

EXECUTIVE SUMMARY:
Based on our multi-factor analysis, ${symbol} presents a mixed investment opportunity with an overall score of ${weightedScore}/100. The stock shows varying performance across fundamental, technical, and sentiment dimensions.

FUNDAMENTAL ASSESSMENT:
Fundamental Score: ${fundamentalScore}/100
The company's financial health shows ${fundamentalScore >= 70 ? 'strong' : fundamentalScore >= 50 ? 'moderate' : 'weak'} characteristics. Key metrics suggest ${fundamentalScore >= 70 ? 'favorable' : 'challenging'} conditions for long-term growth and stability.

TECHNICAL ASSESSMENT:
Technical Score: ${technicalScore}/100
Price action and technical indicators suggest ${technicalScore >= 70 ? 'bullish' : technicalScore >= 50 ? 'neutral' : 'bearish'} momentum. The stock is ${technicalScore >= 70 ? 'likely in an uptrend' : technicalScore >= 50 ? 'showing mixed signals' : 'likely in a downtrend'} based on technical analysis.

SENTIMENT ASSESSMENT:
Sentiment Score: ${sentimentScore}/100
Market sentiment toward ${symbol} is ${sentimentScore >= 70 ? 'largely positive' : sentimentScore >= 50 ? 'mixed' : 'predominantly negative'}. News flow and investor psychology ${sentimentScore >= 70 ? 'support' : sentimentScore >= 50 ? 'are neutral toward' : 'work against'} further price appreciation.

RISK ASSESSMENT:
- Market risk: Moderate given current market conditions
- Sector-specific risks: Should be evaluated based on industry trends
- Company-specific risks: Review recent earnings and guidance
- Recommendation: Implement appropriate position sizing and stop-loss levels

INVESTMENT RECOMMENDATION:
Based on the weighted analysis, our recommendation is ${weightedScore >= 70 ? 'BUY' : weightedScore >= 50 ? 'HOLD' : 'SELL'}.

${weightedScore >= 70 ? `
Price Target: 10-15% upside potential over the next 3-6 months
Time Horizon: Medium-term (3-12 months)
Entry Strategy: Consider scaling into positions on pullbacks` : weightedScore >= 50 ? `
Price Target: Limited near-term directionality expected
Time Horizon: Short to medium-term (1-6 months)
Strategy: Hold existing positions, but consider reducing exposure on strength` : `
Price Target: 5-10% downside risk in the near term
Time Horizon: Immediate to short-term (0-3 months)
Strategy: Consider reducing exposure or implementing hedging strategies`}

KEY MONITORING METRICS:
- Upcoming earnings reports and guidance
- Sector rotation trends
- Key technical levels: support at recent lows, resistance at recent highs
- Changes in analyst ratings and price targets

*Note: AI service temporarily unavailable - this is a comprehensive fallback analysis based on available data.*`;
  }

  // Test connection method
  async testConnection() {
    try {
      if (!this.model) {
        return { success: false, message: 'Gemini AI not initialized' };
      }

      const testPrompt = "Say 'Hello' if you can receive this message.";
      const result = await this.model.generateContent(testPrompt);
      const response = await result.response;
      const text = response.text();

      return { 
        success: true, 
        message: 'Gemini AI connection successful',
        response: text.substring(0, 100) + '...'
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Gemini AI connection failed: ${error.message}` 
      };
    }
  }
}

module.exports = new GeminiService();