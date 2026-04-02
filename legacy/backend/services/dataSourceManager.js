// services/dataSourceManager.js
const axios = require('axios');
const apiTrackingService = require('./apiTrackingService');
const cacheService = require('./cacheService');

class DataSourceManager {
  constructor() {
    // API Keys
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.twelveDataKey = process.env.TWELVE_DATA_API_KEY;
    this.polygonKey = process.env.POLYGON_API_KEY;
    this.finnhubKey = process.env.FINNHUB_API_KEY;
    this.fmpKey = process.env.FMP_API_KEY; // Financial Modeling Prep

    // Rate limiting counters (reset daily)
    this.usageLimits = {
      alphaVantage: { daily: 25, current: 0, resetTime: this.getNextResetTime() },
      twelveData: { daily: 800, current: 0, resetTime: this.getNextResetTime() },
      polygon: { daily: 100, current: 0, resetTime: this.getNextResetTime() },
      finnhub: { daily: 1000, current: 0, resetTime: this.getNextResetTime() }, // 60/min but we track daily
      fmp: { daily: 250, current: 0, resetTime: this.getNextResetTime() }
    };

    // Priority order for different data types
    this.priorityOrder = {
      stockData: ['twelveData', 'polygon', 'alphaVantage', 'yahooFinance'],
      fundamentals: ['fmp', 'alphaVantage', 'finnhub', 'twelveData'],
      sentiment: ['alphaVantage', 'finnhub'],
      search: ['finnhub', 'twelveData', 'alphaVantage']
    };
  }

  getNextResetTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  resetCountersIfNeeded() {
    const now = Date.now();
    Object.keys(this.usageLimits).forEach(source => {
      if (now >= this.usageLimits[source].resetTime) {
        this.usageLimits[source].current = 0;
        this.usageLimits[source].resetTime = this.getNextResetTime();
      }
    });
  }

  canUseSource(sourceName) {
    this.resetCountersIfNeeded();
    const limits = this.usageLimits[sourceName];
    return limits && limits.current < limits.daily;
  }

  incrementUsage(sourceName) {
    if (this.usageLimits[sourceName]) {
      this.usageLimits[sourceName].current++;
    }
  }

  getAvailableSource(dataType) {
    const sources = this.priorityOrder[dataType] || [];
    for (const source of sources) {
      if (this.canUseSource(source) && this.hasApiKey(source)) {
        return source;
      }
    }
    return null;
  }

  hasApiKey(source) {
    switch (source) {
      case 'alphaVantage': return !!this.alphaVantageKey;
      case 'twelveData': return !!this.twelveDataKey;
      case 'polygon': return !!this.polygonKey;
      case 'finnhub': return !!this.finnhubKey;
      case 'fmp': return !!this.fmpKey;
      case 'yahooFinance': return true; // No API key needed
      default: return false;
    }
  }

  // =================== STOCK DATA FETCHING ===================

  async fetchStockData(symbol, timeframe) {
    const cacheKey = `stock_data_${symbol}_${timeframe}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return { ...cached, source: 'cache' };

    const source = this.getAvailableSource('stockData');
    if (!source) {
      console.warn('⚠️ No available data sources, using mock data');
      return this.generateMockData(symbol, timeframe);
    }

    try {
      let data;
      switch (source) {
        case 'twelveData':
          data = await this.fetchTwelveData(symbol, timeframe);
          break;
        case 'polygon':
          data = await this.fetchPolygonData(symbol, timeframe);
          break;
        case 'alphaVantage':
          data = await this.fetchAlphaVantageData(symbol, timeframe);
          break;
        case 'yahooFinance':
          data = await this.fetchYahooFinanceData(symbol, timeframe);
          break;
        default:
          throw new Error(`Unknown source: ${source}`);
      }

      if (data && data.ohlcv && data.ohlcv.length > 0) {
        // Cache successful results for 5-15 minutes depending on timeframe
        const cacheTime = timeframe === '1D' ? 5 * 60 * 1000 : 15 * 60 * 1000;
        cacheService.set(cacheKey, data);
        this.incrementUsage(source);
        return data;
      }
    } catch (error) {
      console.error(`Error fetching from ${source}:`, error.message);
    }

    // Fallback to next available source
    return this.generateMockData(symbol, timeframe);
  }

  // =================== TWELVE DATA API ===================

  async fetchTwelveData(symbol, timeframe) {
    const startTime = Date.now();
    
    try {
      const intervalMap = {
        '1D': '5min',
        '1W': '30min', 
        '1M': '1day',
        '3M': '1day',
        '6M': '1day',
        '1Y': '1week',
        '2Y': '1week'
      };

      const interval = intervalMap[timeframe] || '1day';
      const outputSize = timeframe === '1D' ? '96' : '100';
      
      const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputSize}&apikey=${this.twelveDataKey}`;
      
      apiTrackingService.logAPICall('Twelve Data', 'TIME_SERIES', symbol, timeframe, true, 0);
      
      const response = await axios.get(url, { timeout: 15000 });
      const data = response.data;
      const responseTime = Date.now() - startTime;

      if (data.status === 'error') {
        throw new Error(data.message || 'Twelve Data API error');
      }

      if (!data.values || !Array.isArray(data.values)) {
        throw new Error('Invalid response format from Twelve Data');
      }

      const ohlcv = data.values.map(item => ({
        date: item.datetime,
        open: parseFloat(item.open),
        high: parseFloat(item.high), 
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume || 0)
      })).reverse(); // Twelve Data returns newest first

      apiTrackingService.logAPICall('Twelve Data', 'TIME_SERIES', symbol, timeframe, true, responseTime);
      
      return {
        symbol,
        ohlcv,
        timeframe,
        source: 'Twelve Data'
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      apiTrackingService.logAPICall('Twelve Data', 'TIME_SERIES', symbol, timeframe, false, responseTime);
      throw error;
    }
  }

  // =================== POLYGON.IO API ===================

  async fetchPolygonData(symbol, timeframe) {
    const startTime = Date.now();
    
    try {
      // Polygon uses different endpoints for different timeframes
      let url;
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      
      // Calculate start date based on timeframe
      const daysBack = {
        '1D': 1,
        '1W': 7, 
        '1M': 30,
        '3M': 90,
        '6M': 180,
        '1Y': 365,
        '2Y': 730
      };
      
      startDate.setDate(startDate.getDate() - (daysBack[timeframe] || 30));
      const startDateStr = startDate.toISOString().split('T')[0];
      
      if (timeframe === '1D') {
        // Use minute bars for intraday
        url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/5/minute/${startDateStr}/${endDate}?adjusted=true&sort=asc&apikey=${this.polygonKey}`;
      } else {
        // Use daily bars for longer timeframes
        url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${startDateStr}/${endDate}?adjusted=true&sort=asc&apikey=${this.polygonKey}`;
      }
      
      apiTrackingService.logAPICall('Polygon', 'AGGREGATES', symbol, timeframe, true, 0);
      
      const response = await axios.get(url, { timeout: 15000 });
      const data = response.data;
      const responseTime = Date.now() - startTime;

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        throw new Error('No data returned from Polygon');
      }

      const ohlcv = data.results.map(item => ({
        date: new Date(item.t).toISOString().split('T')[0],
        open: item.o,
        high: item.h,
        low: item.l, 
        close: item.c,
        volume: item.v
      }));

      apiTrackingService.logAPICall('Polygon', 'AGGREGATES', symbol, timeframe, true, responseTime);
      
      return {
        symbol,
        ohlcv,
        timeframe,
        source: 'Polygon.io'
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      apiTrackingService.logAPICall('Polygon', 'AGGREGATES', symbol, timeframe, false, responseTime);
      throw error;
    }
  }

  // =================== YAHOO FINANCE FALLBACK ===================

  async fetchYahooFinanceData(symbol, timeframe) {
    const startTime = Date.now();
    
    try {
      // This is a simplified Yahoo Finance implementation
      // In production, you'd use a proper Yahoo Finance library or API
      const periodMap = {
        '1D': '1d',
        '1W': '5d',
        '1M': '1mo', 
        '3M': '3mo',
        '6M': '6mo',
        '1Y': '1y',
        '2Y': '2y'
      };
      
      const intervalMap = {
        '1D': '5m',
        '1W': '30m',
        '1M': '1d',
        '3M': '1d', 
        '6M': '1d',
        '1Y': '1wk',
        '2Y': '1wk'
      };

      const period = periodMap[timeframe] || '1mo';
      const interval = intervalMap[timeframe] || '1d';
      
      // Using Yahoo Finance's query1 API (unofficial but widely used)
      const daysBack = {
        '1D': 1,
        '1W': 7,
        '1M': 30,
        '3M': 90,
        '6M': 180,
        '1Y': 365,
        '2Y': 730
      };
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${Math.floor(Date.now()/1000) - (daysBack[timeframe] || 30) * 24 * 60 * 60}&period2=${Math.floor(Date.now()/1000)}&interval=${interval}`;
      
      apiTrackingService.logAPICall('Yahoo Finance', 'CHART', symbol, timeframe, true, 0);
      
      const response = await axios.get(url, { timeout: 15000 });
      const data = response.data;
      const responseTime = Date.now() - startTime;

      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        throw new Error('Invalid Yahoo Finance response');
      }

      const result = data.chart.result[0];
      const quotes = result.indicators.quote[0];
      const timestamps = result.timestamp;

      const ohlcv = timestamps.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        open: quotes.open[index],
        high: quotes.high[index], 
        low: quotes.low[index],
        close: quotes.close[index],
        volume: quotes.volume[index] || 0
      })).filter(item => item.open !== null);

      apiTrackingService.logAPICall('Yahoo Finance', 'CHART', symbol, timeframe, true, responseTime);
      
      return {
        symbol,
        ohlcv, 
        timeframe,
        source: 'Yahoo Finance'
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      apiTrackingService.logAPICall('Yahoo Finance', 'CHART', symbol, timeframe, false, responseTime);
      throw error;
    }
  }

  // Keep existing Alpha Vantage method for compatibility
  async fetchAlphaVantageData(symbol, timeframe) {
    // ... (existing Alpha Vantage implementation from dataService.js)
    // This is kept for compatibility but moved to lower priority
    const startTime = Date.now();
    
    try {
      const intervalMap = {
        '1D': '5min',
        '1W': '30min',
        '1M': 'daily',
        '3M': 'daily',
        '6M': 'daily',
        '1Y': 'weekly',
        '2Y': 'weekly'
      };

      const interval = intervalMap[timeframe] || 'daily';
      let url, timeSeriesKey;

      if (['1min','5min','15min','30min','60min'].includes(interval)) {
        url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(symbol)}&interval=${interval}&apikey=${this.alphaVantageKey}&outputsize=full`;
        timeSeriesKey = `Time Series (${interval})`;
      } else if (interval === 'weekly') {
        url = `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${encodeURIComponent(symbol)}&apikey=${this.alphaVantageKey}&outputsize=full`;
        timeSeriesKey = 'Weekly Time Series';
      } else {
        url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&apikey=${this.alphaVantageKey}&outputsize=full`;
        timeSeriesKey = 'Time Series (Daily)';
      }

      apiTrackingService.logAPICall('Alpha Vantage', 'TIME_SERIES', symbol, timeframe, true, 0);
      
      const response = await axios.get(url, { timeout: 15000 });
      const data = response.data;
      const responseTime = Date.now() - startTime;

      if (data.Note || data['Error Message'] || data.Information) {
        throw new Error(data.Note || data['Error Message'] || data.Information);
      }

      const timeSeries = data[timeSeriesKey];
      if (!timeSeries) {
        throw new Error('No time series data returned');
      }

      const ohlcv = Object.entries(timeSeries).map(([date, values]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']), 
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseFloat(values['5. volume'] || values['6. volume'] || 0)
      })).sort((a, b) => new Date(a.date) - new Date(b.date));

      apiTrackingService.logAPICall('Alpha Vantage', 'TIME_SERIES', symbol, timeframe, true, responseTime);
      
      return {
        symbol,
        ohlcv,
        timeframe,
        source: 'Alpha Vantage'
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      apiTrackingService.logAPICall('Alpha Vantage', 'TIME_SERIES', symbol, timeframe, false, responseTime);
      throw error;
    }
  }

  // =================== MOCK DATA GENERATOR ===================

  generateMockData(symbol, timeframe) {
    console.log('📋 Using mock data for', symbol);
    
    const ohlcv = [];
    let price = 100 + Math.random() * 50;
    
    const dataPointsMap = {
      '1D': 96,
      '1W': 56, 
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 52,
      '2Y': 104
    };
    
    const dataPoints = dataPointsMap[timeframe] || 30;
    const baseVolume = 1000000;
    
    for (let i = 0; i < dataPoints; i++) {
      const change = (Math.random() - 0.5) * 4;
      const open = price;
      price += change;
      const high = Math.max(open, price) + Math.random() * 1;
      const low = Math.min(open, price) - Math.random() * 1;
      const close = price;
      const volume = baseVolume * (0.8 + Math.random() * 0.4);
      
      const date = new Date();
      date.setDate(date.getDate() - (dataPoints - i));
      
      ohlcv.push({
        date: date.toISOString().split('T')[0],
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: Math.round(volume)
      });
    }
    
    return {
      symbol,
      ohlcv,
      timeframe,
      source: 'Mock Data'
    };
  }

  // =================== FUNDAMENTAL DATA ===================

  async fetchFundamentalData(symbol) {
    const cacheKey = `fundamentals_${symbol}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return { ...cached, source: 'cache' };

    const source = this.getAvailableSource('fundamentals');
    if (!source) {
      throw new Error('No available sources for fundamental data');
    }

    try {
      let data;
      switch (source) {
        case 'fmp':
          data = await this.fetchFMPFundamentals(symbol);
          break;
        case 'finnhub':
          data = await this.fetchFinnhubFundamentals(symbol);
          break;
        case 'alphaVantage':
          data = await this.fetchAlphaVantageFundamentals(symbol);
          break;
        default:
          throw new Error(`Unknown fundamental source: ${source}`);
      }

      if (data) {
        // Cache fundamental data for 24 hours
        cacheService.set(cacheKey, data);
        this.incrementUsage(source);
        return data;
      }
    } catch (error) {
      console.error(`Error fetching fundamentals from ${source}:`, error.message);
      throw error;
    }
  }

  async fetchFMPFundamentals(symbol) {
    // Financial Modeling Prep implementation
    const startTime = Date.now();
    
    try {
      const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${this.fmpKey}`;
      const metricsUrl = `https://financialmodelingprep.com/api/v3/key-metrics/${symbol}?apikey=${this.fmpKey}`;
      
      apiTrackingService.logAPICall('FMP', 'PROFILE', symbol, null, true, 0);
      
      const [profileResponse, metricsResponse] = await Promise.all([
        axios.get(profileUrl, { timeout: 10000 }),
        axios.get(metricsUrl, { timeout: 10000 })
      ]);
      
      const responseTime = Date.now() - startTime;
      
      const profile = profileResponse.data[0];
      const metrics = metricsResponse.data[0];
      
      if (!profile || !metrics) {
        throw new Error('Invalid FMP response');
      }

      apiTrackingService.logAPICall('FMP', 'PROFILE', symbol, null, true, responseTime);
      
      return {
        overview: {
          PERatio: metrics.peRatio,
          PEGRatio: metrics.pegRatio,
          PriceToBookRatio: metrics.pbRatio,
          ReturnOnEquityTTM: metrics.roe,
          ProfitMargin: profile.mktCap > 0 ? (profile.lastDiv / profile.price) * 100 : null,
          EPS: profile.eps
        },
        source: 'Financial Modeling Prep'
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      apiTrackingService.logAPICall('FMP', 'PROFILE', symbol, null, false, responseTime);
      throw error;
    }
  }

  async fetchFinnhubFundamentals(symbol) {
    // Finnhub implementation for basic metrics
    const startTime = Date.now();
    
    try {
      const url = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${this.finnhubKey}`;
      
      apiTrackingService.logAPICall('Finnhub', 'METRICS', symbol, null, true, 0);
      
      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data;
      const responseTime = Date.now() - startTime;
      
      if (!data.metric) {
        throw new Error('Invalid Finnhub response');
      }

      apiTrackingService.logAPICall('Finnhub', 'METRICS', symbol, null, true, responseTime);
      
      return {
        overview: {
          PERatio: data.metric.peBasicExclExtraTTM,
          PriceToBookRatio: data.metric.pbQuarterly,
          ReturnOnEquityTTM: data.metric.roeTTM,
          EPS: data.metric.epsBasicExclExtraItemsTTM
        },
        source: 'Finnhub'
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      apiTrackingService.logAPICall('Finnhub', 'METRICS', symbol, null, false, responseTime);
      throw error;
    }
  }

  async fetchAlphaVantageFundamentals(symbol) {
    // Keep existing Alpha Vantage fundamental logic
    const startTime = Date.now();
    
    try {
      const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${this.alphaVantageKey}`;
      
      apiTrackingService.logAPICall('Alpha Vantage', 'OVERVIEW', symbol, null, true, 0);
      
      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data;
      const responseTime = Date.now() - startTime;
      
      if (data.Note || data['Error Message']) {
        throw new Error(data.Note || data['Error Message']);
      }

      apiTrackingService.logAPICall('Alpha Vantage', 'OVERVIEW', symbol, null, true, responseTime);
      
      return {
        overview: data,
        source: 'Alpha Vantage'
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      apiTrackingService.logAPICall('Alpha Vantage', 'OVERVIEW', symbol, null, false, responseTime);
      throw error;
    }
  }

  // =================== SEARCH FUNCTIONALITY ===================

  async searchSymbols(query) {
    const cacheKey = `search_${query.toLowerCase()}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return { ...cached, source: 'cache' };

    const source = this.getAvailableSource('search');
    if (!source) {
      return { results: [], source: 'fallback' };
    }

    try {
      let results;
      switch (source) {
        case 'finnhub':
          results = await this.searchFinnhub(query);
          break;
        case 'twelveData':
          results = await this.searchTwelveData(query);
          break;
        case 'alphaVantage':
          results = await this.searchAlphaVantage(query);
          break;
        default:
          throw new Error(`Unknown search source: ${source}`);
      }

      if (results) {
        // Cache search results for 1 hour
        cacheService.set(cacheKey, results);
        this.incrementUsage(source);
        return results;
      }
    } catch (error) {
      console.error(`Error searching with ${source}:`, error.message);
    }

    return { results: [], source: 'fallback' };
  }

  async searchFinnhub(query) {
    const startTime = Date.now();
    
    try {
      const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${this.finnhubKey}`;
      
      apiTrackingService.logAPICall('Finnhub', 'SEARCH', query, null, true, 0);
      
      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data;
      const responseTime = Date.now() - startTime;
      
      if (!data.result) {
        throw new Error('Invalid Finnhub search response');
      }

      const results = data.result.slice(0, 20).map(item => ({
        symbol: item.symbol,
        name: item.description,
        region: item.type || 'US'
      }));

      apiTrackingService.logAPICall('Finnhub', 'SEARCH', query, null, true, responseTime);
      
      return {
        results,
        source: 'Finnhub'
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      apiTrackingService.logAPICall('Finnhub', 'SEARCH', query, null, false, responseTime);
      throw error;
    }
  }

  async searchTwelveData(query) {
    const startTime = Date.now();
    
    try {
      const url = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${this.twelveDataKey}`;
      
      apiTrackingService.logAPICall('Twelve Data', 'SEARCH', query, null, true, 0);
      
      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data;
      const responseTime = Date.now() - startTime;
      
      if (!data.data) {
        throw new Error('Invalid Twelve Data search response');
      }

      const results = data.data.slice(0, 20).map(item => ({
        symbol: item.symbol,
        name: item.instrument_name,
        region: item.exchange
      }));

      apiTrackingService.logAPICall('Twelve Data', 'SEARCH', query, null, true, responseTime);
      
      return {
        results,
        source: 'Twelve Data'
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      apiTrackingService.logAPICall('Twelve Data', 'SEARCH', query, null, false, responseTime);
      throw error;
    }
  }

  async searchAlphaVantage(query) {
    const startTime = Date.now();
    
    try {
      const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${this.alphaVantageKey}`;
      
      apiTrackingService.logAPICall('Alpha Vantage', 'SEARCH', query, null, true, 0);
      
      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data;
      const responseTime = Date.now() - startTime;
      
      if (!data.bestMatches) {
        throw new Error('Invalid Alpha Vantage search response');
      }

      const results = data.bestMatches.slice(0, 20).map(item => ({
        symbol: item['1. symbol'],
        name: item['2. name'],
        region: item['4. region']
      }));

      apiTrackingService.logAPICall('Alpha Vantage', 'SEARCH', query, null, true, responseTime);
      
      return {
        results,
        source: 'Alpha Vantage'
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      apiTrackingService.logAPICall('Alpha Vantage', 'SEARCH', query, null, false, responseTime);
      throw error;
    }
  }

  // =================== STATUS AND MONITORING ===================

  getStatus() {
    this.resetCountersIfNeeded();
    
    return {
      sources: Object.keys(this.usageLimits).map(source => ({
        name: source,
        hasApiKey: this.hasApiKey(source),
        usage: this.usageLimits[source].current,
        limit: this.usageLimits[source].daily,
        available: this.canUseSource(source)
      })),
      priorityOrder: this.priorityOrder,
      cacheStats: cacheService.stats()
    };
  }
}

module.exports = new DataSourceManager();
