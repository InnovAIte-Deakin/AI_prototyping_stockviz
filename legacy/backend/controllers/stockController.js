// controllers/stockController.js
const cacheService = require('../services/cacheService');
const weightService = require('../services/weightService');
const analysisService = require('../services/analysisService');
const dataService = require('../services/dataService');
const technicalAnalysisService = require('../services/technicalAnalysisService');

class StockController {
  constructor() {
    this.defaultWeights = weightService.defaultWeights;
  }

  // Get default weights
  async getDefaultWeights(req, res) {
    res.json({
      status: 'success',
      defaultWeights: this.defaultWeights,
      description: {
        fundamental: 'Company financials, ratios, and intrinsic value',
        technical: 'Price patterns, indicators, and market trends',
        sentiment: 'News sentiment, social media, and market psychology'
      },
      examples: [
        { name: 'Conservative', fundamental: 50, technical: 30, sentiment: 20 },
        { name: 'Technical Trader', fundamental: 20, technical: 60, sentiment: 20 },
        { name: 'Sentiment Focus', fundamental: 30, technical: 25, sentiment: 45 },
        { name: 'Balanced', fundamental: 40, technical: 35, sentiment: 25 }
      ]
    });
  }

  // Get available technical indicators
  async getTechnicalIndicators(req, res) {
    try {
      const availableIndicators = technicalAnalysisService.getAvailableIndicators();
      const defaultConfig = technicalAnalysisService.getDefaultConfig();
      
      res.json({
        status: 'success',
        availableIndicators,
        defaultConfig,
        description: 'Available technical indicators for advanced analysis'
      });
    } catch (error) {
      console.error('Error getting technical indicators:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get technical indicators'
      });
    }
  }

  // Helper method to parse indicators configuration
  parseIndicatorsConfig(indicatorsParam) {
    if (!indicatorsParam) return {};
    
    try {
      const config = JSON.parse(indicatorsParam);
      
      // Validate the structure
      const validIndicators = [
        'SMA', 'EMA', 'MACD', 'RSI', 'Stochastic', 
        'BollingerBands', 'ATR', 'OBV', 'patterns'
      ];
      
      const validatedConfig = {};
      for (const [indicator, settings] of Object.entries(config)) {
        if (validIndicators.includes(indicator)) {
          validatedConfig[indicator] = settings;
        } else {
          console.warn(`Unknown indicator: ${indicator}`);
        }
      }
      
      return validatedConfig;
    } catch (error) {
      console.warn('Invalid indicators parameter, using default configuration:', error.message);
      return {};
    }
  }

  // Main analysis method with weight support
  async getStockAnalysis(req, res) {
    try {
      const { symbol } = req.params;
      const { 
        timeframe = '1M', 
        mode = 'normal',
        // Weight parameters for advanced mode
        fundamental = this.defaultWeights.fundamental,
        technical = this.defaultWeights.technical,
        sentiment = this.defaultWeights.sentiment,
        // Technical indicator configuration
        indicators = '{}'
      } = req.query;

      // Validate symbol
      if (!symbol || symbol.length < 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Valid symbol is required'
        });
      }

      // Parse and validate weights for advanced mode
      let weights = this.defaultWeights;
      if (mode === 'advanced') {
        weights = weightService.validateAndParseWeights({
          fundamental: parseFloat(fundamental),
          technical: parseFloat(technical),
          sentiment: parseFloat(sentiment)
        });
      }

      // Parse technical indicators configuration
      const indicatorsConfig = this.parseIndicatorsConfig(indicators);

      console.log(`📊 Analyzing ${symbol.toUpperCase()} - ${timeframe} - ${mode} mode`);
      if (mode === 'advanced') {
        console.log(`⚖️  Weights: F:${weights.fundamental}% T:${weights.technical}% S:${weights.sentiment}%`);
        console.log(`📈 Indicators: ${Object.keys(indicatorsConfig).join(', ') || 'Default'}`);
        console.log(`🤖 AI Analysis: Enhanced mode with full data integration`);
      }

      // Check cache using shared cache service
      const cacheKey = `${symbol}_${timeframe}_${mode}_${JSON.stringify(weights)}_${JSON.stringify(indicatorsConfig)}`;
      const cached = cacheService.get(cacheKey);
      
      if (cached) {
        console.log('📋 Returning cached analysis');
        return res.json(cached);
      }

      // Fetch stock data
      const stockData = await dataService.fetchStockData(symbol, timeframe);
      
      let analysis;
      if (mode === 'normal') {
        analysis = await analysisService.performNormalAnalysis(symbol, stockData, timeframe);
      } else if (mode === 'advanced') {
        analysis = await analysisService.performAdvancedAnalysis(
          symbol, 
          stockData, 
          timeframe, 
          weights, 
          indicatorsConfig
        );
      } else {
        throw new Error('Invalid analysis mode. Use "normal" or "advanced"');
      }

      // Cache the result using shared cache service
      cacheService.set(cacheKey, analysis);

      res.json(analysis);

    } catch (error) {
      console.error('❌ Analysis error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to analyze stock',
        error: error.message
      });
    }
  }

  // Enhanced Technical Chart Analysis - Visual insights with candlestick patterns, volume, and indicators
  async getTechnicalChartAnalysis(req, res) {
    try {
      const { symbol } = req.params;
      const { 
        timeframe = '1y',
        mode = 'normal' // 'normal' for beginners, 'advanced' for pro traders
      } = req.query;

      // Validate symbol
      if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
        return res.status(400).json({
          status: 'error',
          message: 'Valid symbol is required'
        });
      }

      // Validate mode
      const validModes = ['normal', 'advanced'];
      const userMode = validModes.includes(mode) ? mode : 'normal';

      console.log(`📊 Starting technical chart analysis for ${symbol.toUpperCase()} - ${timeframe} - ${userMode} mode`);
      console.log(`🔍 Chart Analysis: Candlestick patterns, volume analysis, RSI/DMI interpretation`);
      console.log(`🎯 Focus: Support/resistance levels and trade setup recommendations`);

      // Check cache for chart analysis
      const cacheKey = `chart_analysis_${symbol}_${timeframe}_${userMode}`;
      const cached = cacheService.get(cacheKey);
      
      if (cached) {
        console.log('📋 Returning cached chart analysis');
        return res.json(cached);
      }

      // Fetch stock data for chart analysis
      const stockData = await dataService.fetchStockData(symbol, timeframe);
      
      // Perform technical chart analysis
      const chartAnalysis = await analysisService.performTechnicalChartAnalysis(
        symbol,
        stockData,
        timeframe,
        userMode
      );

      // Cache the result (shorter cache time for chart analysis due to frequent updates)
      cacheService.set(cacheKey, chartAnalysis, 3 * 60 * 1000); // 3 minutes cache

      console.log(`✅ Technical chart analysis completed for ${symbol.toUpperCase()}`);
      res.json(chartAnalysis);

    } catch (error) {
      console.error('❌ Technical chart analysis error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate technical chart analysis',
        error: error.message,
        fallback: 'Chart analysis is temporarily unavailable. Please try the regular analysis endpoint.'
      });
    }
  }

  // Enhanced Analysis - Detailed breakdown with confidence levels and advanced scoring
  async getEnhancedAnalysis(req, res) {
    try {
      const { symbol } = req.params;
      const { 
        timeframe = '1y',
        fundamental = this.defaultWeights.fundamental,
        technical = this.defaultWeights.technical,
        sentiment = this.defaultWeights.sentiment,
        indicators = ''
      } = req.query;

      // Validate symbol
      if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
        return res.status(400).json({
          status: 'error',
          message: 'Valid symbol is required'
        });
      }

      // Parse and validate weights
      const weights = weightService.validateAndParseWeights({
        fundamental: parseFloat(fundamental),
        technical: parseFloat(technical),
        sentiment: parseFloat(sentiment)
      });

      // Parse technical indicators configuration
      const indicatorsConfig = this.parseIndicatorsConfig(indicators);

      console.log(`🚀 Enhanced analysis for ${symbol.toUpperCase()} - ${timeframe}`);
      console.log(`⚖️  Enhanced Weights: F:${weights.fundamental}% T:${weights.technical}% S:${weights.sentiment}%`);
      console.log(`📈 Advanced Scoring: Confidence levels, detailed breakdown, and reasoning`);
      console.log(`🎯 Enhanced Algorithms: Integrated from stock-whisperer-frontend`);

      // Check cache for enhanced analysis
      const cacheKey = `enhanced_${symbol}_${timeframe}_${JSON.stringify(weights)}_${JSON.stringify(indicatorsConfig)}`;
      const cached = cacheService.get(cacheKey);
      
      if (cached) {
        console.log('📋 Returning cached enhanced analysis');
        return res.json(cached);
      }

      // Fetch stock data
      const stockData = await dataService.fetchStockData(symbol, timeframe);
      
      // Perform enhanced analysis
      const enhancedAnalysis = await analysisService.performEnhancedAnalysis(
        symbol,
        stockData,
        timeframe,
        weights,
        indicatorsConfig
      );

      // Cache the result (standard 5-minute cache)
      cacheService.set(cacheKey, enhancedAnalysis);

      console.log(`✅ Enhanced analysis completed for ${symbol.toUpperCase()}: ${enhancedAnalysis.analysis.enhanced.aggregateScore}/100 (${enhancedAnalysis.analysis.enhanced.recommendation})`);
      res.json(enhancedAnalysis);

    } catch (error) {
      console.error('❌ Enhanced analysis error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate enhanced analysis',
        error: error.message,
        fallback: 'Enhanced analysis is temporarily unavailable. Please try the regular analysis endpoint.'
      });
    }
  }
}

module.exports = new StockController();