// services/enhancedTrendingService.js
const dataSourceManager = require('./dataSourceManager');
const cacheService = require('./cacheService');
const apiTrackingService = require('./apiTrackingService');
const axios = require('axios');

class EnhancedTrendingService {
  constructor() {
    this.tradingViewBaseUrl = 'https://scanner.tradingview.com';
    
    // Popular symbols to use for fallback trending data
    this.popularSymbols = [
      'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC',
      'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD', 'MA', 'DIS', 'PYPL', 'ADBE'
    ];
  }

  async getTrendingStocks(category) {
    const cacheKey = `enhanced_trending_${category}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return { ...cached, source: 'cache' };

    try {
      // First, try TradingView scanner (if CORS allows)
      const tradingViewData = await this.fetchFromTradingView(category);
      if (tradingViewData && tradingViewData.length > 0) {
        const result = {
          results: tradingViewData,
          source: 'TradingView',
          category,
          timestamp: new Date().toISOString()
        };
        
        // Cache for 2 minutes
        cacheService.set(cacheKey, result);
        return result;
      }
    } catch (error) {
      console.warn('TradingView API failed:', error.message);
    }

    try {
      // Fallback: Use Alpha Vantage TOP_GAINERS_LOSERS
      const alphaVantageData = await this.fetchFromAlphaVantage(category);
      if (alphaVantageData && alphaVantageData.length > 0) {
        const result = {
          results: alphaVantageData,
          source: 'Alpha Vantage',
          category,
          timestamp: new Date().toISOString()
        };
        
        cacheService.set(cacheKey, result);
        return result;
      }
    } catch (error) {
      console.warn('Alpha Vantage trending failed:', error.message);
    }

    // Final fallback: Generate mock trending data
    const mockData = this.generateMockTrending(category);
    const result = {
      results: mockData,
      source: 'Mock Data',
      category,
      timestamp: new Date().toISOString()
    };
    
    cacheService.set(cacheKey, result);
    return result;
  }

  async fetchFromTradingView(category) {
    const startTime = Date.now();
    
    try {
      const filters = this.getTradingViewFilters(category);
      const url = `${this.tradingViewBaseUrl}/america/scan`;
      
      apiTrackingService.logAPICall('TradingView', 'SCAN', category, null, true, 0);
      
      const response = await axios.post(url, filters, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
        throw new Error('Invalid TradingView response format');
      }

      const symbols = response.data.data.slice(0, 20).map(item => ({
        symbol: item.s,
        name: item.n || item.s,
        price: item.d[0] || 0,
        change: item.d[1] || 0,
        changePercent: item.d[2] || 0,
        volume: this.formatVolume(item.d[3] || 0),
        exchange: this.getExchangeFromSymbol(item.s)
      }));

      apiTrackingService.logAPICall('TradingView', 'SCAN', category, null, true, responseTime);
      return symbols;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      apiTrackingService.logAPICall('TradingView', 'SCAN', category, null, false, responseTime);
      throw error;
    }
  }

  async fetchFromAlphaVantage(category) {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) throw new Error('Alpha Vantage API key not available');

    const startTime = Date.now();
    
    try {
      const url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${apiKey}`;
      
      apiTrackingService.logAPICall('Alpha Vantage', 'TOP_GAINERS_LOSERS', category, null, true, 0);
      
      const response = await axios.get(url, { timeout: 15000 });
      const data = response.data;
      const responseTime = Date.now() - startTime;
      
      if (data.Note || data['Error Message']) {
        throw new Error(data.Note || data['Error Message']);
      }

      let categoryData;
      switch (category) {
        case 'gainers':
          categoryData = data.top_gainers || [];
          break;
        case 'losers':
          categoryData = data.top_losers || [];
          break;
        case 'mostActive':
          categoryData = data.most_actively_traded || [];
          break;
        default:
          throw new Error(`Unknown category: ${category}`);
      }

      const symbols = categoryData.slice(0, 20).map(item => ({
        symbol: item.ticker,
        name: item.ticker, // Alpha Vantage doesn't provide company names in this endpoint
        price: parseFloat(item.price) || 0,
        change: parseFloat(item.change_amount) || 0,
        changePercent: parseFloat(item.change_percentage?.replace('%', '')) || 0,
        volume: this.formatVolume(parseInt(item.volume) || 0),
        exchange: 'NASDAQ' // Default exchange
      }));

      apiTrackingService.logAPICall('Alpha Vantage', 'TOP_GAINERS_LOSERS', category, null, true, responseTime);
      return symbols;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      apiTrackingService.logAPICall('Alpha Vantage', 'TOP_GAINERS_LOSERS', category, null, false, responseTime);
      throw error;
    }
  }

  generateMockTrending(category) {
    const baseData = this.popularSymbols.slice(0, 20).map(symbol => {
      const basePrice = 50 + Math.random() * 200; // $50-$250
      let change, changePercent;
      
      switch (category) {
        case 'gainers':
          changePercent = 1 + Math.random() * 8; // 1-9% gain
          change = (basePrice * changePercent) / 100;
          break;
        case 'losers':
          changePercent = -(1 + Math.random() * 8); // 1-9% loss
          change = (basePrice * changePercent) / 100;
          break;
        case 'mostActive':
          changePercent = (Math.random() - 0.5) * 10; // -5% to +5%
          change = (basePrice * changePercent) / 100;
          break;
        default:
          changePercent = (Math.random() - 0.5) * 6; // -3% to +3%
          change = (basePrice * changePercent) / 100;
      }
      
      const volume = Math.floor(1000000 + Math.random() * 50000000); // 1M-51M volume
      
      return {
        symbol,
        name: this.getCompanyName(symbol),
        price: parseFloat(basePrice.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        volume: this.formatVolume(volume),
        exchange: 'NASDAQ'
      };
    });

    // Sort based on category
    switch (category) {
      case 'gainers':
        return baseData.sort((a, b) => b.changePercent - a.changePercent);
      case 'losers':
        return baseData.sort((a, b) => a.changePercent - b.changePercent);
      case 'mostActive':
        return baseData.sort((a, b) => parseInt(b.volume.replace(/[KMB]/g, '')) - parseInt(a.volume.replace(/[KMB]/g, '')));
      default:
        return baseData;
    }
  }

  getTradingViewFilters(category) {
    const baseFilter = [
      { left: 'market_cap_basic', operation: 'greater', right: 1000000000 }, // > $1B
      { left: 'volume', operation: 'greater', right: 1000000 } // > 1M volume
    ];

    switch (category) {
      case 'gainers':
        return {
          filter: [
            ...baseFilter,
            { left: 'change', operation: 'greater', right: 0 }
          ],
          sort: { sortBy: 'change', sortOrder: 'desc' },
          options: { lang: 'en' },
          range: [0, 20]
        };
      case 'losers':
        return {
          filter: [
            ...baseFilter,
            { left: 'change', operation: 'less', right: 0 }
          ],
          sort: { sortBy: 'change', sortOrder: 'asc' },
          options: { lang: 'en' },
          range: [0, 20]
        };
      case 'mostActive':
        return {
          filter: baseFilter,
          sort: { sortBy: 'volume', sortOrder: 'desc' },
          options: { lang: 'en' },
          range: [0, 20]
        };
      default:
        throw new Error(`Unknown category: ${category}`);
    }
  }

  formatVolume(volume) {
    if (volume >= 1000000000) return `${(volume / 1000000000).toFixed(1)}B`;
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  }

  getExchangeFromSymbol(symbol) {
    // Simple heuristic based on symbol format
    if (symbol.includes('.')) {
      const parts = symbol.split('.');
      const suffix = parts[parts.length - 1];
      switch (suffix) {
        case 'L': return 'LSE';
        case 'TO': return 'TSX';
        case 'AX': return 'ASX';
        default: return 'Other';
      }
    }
    return 'NASDAQ'; // Default to NASDAQ for US symbols
  }

  getCompanyName(symbol) {
    const companyMap = {
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'MSFT': 'Microsoft Corporation',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'META': 'Meta Platforms Inc.',
      'NVDA': 'NVIDIA Corporation',
      'NFLX': 'Netflix Inc.',
      'AMD': 'Advanced Micro Devices',
      'INTC': 'Intel Corporation',
      'JPM': 'JPMorgan Chase & Co.',
      'JNJ': 'Johnson & Johnson',
      'V': 'Visa Inc.',
      'PG': 'Procter & Gamble Co.',
      'UNH': 'UnitedHealth Group Inc.',
      'HD': 'Home Depot Inc.',
      'MA': 'Mastercard Inc.',
      'DIS': 'Walt Disney Co.',
      'PYPL': 'PayPal Holdings Inc.',
      'ADBE': 'Adobe Inc.'
    };
    return companyMap[symbol] || `${symbol} Company`;
  }

  // Get usage statistics
  getStatus() {
    return {
      service: 'Enhanced Trending Service',
      dataSources: ['TradingView Scanner', 'Alpha Vantage TOP_GAINERS_LOSERS', 'Mock Data'],
      cacheStats: cacheService.stats(),
      supportedCategories: ['gainers', 'losers', 'mostActive'],
      fallbackSymbols: this.popularSymbols.length
    };
  }
}

module.exports = new EnhancedTrendingService();