const dataSourceManager = require('./dataSourceManager');

class DataService {
  constructor() {
    // Delegate to the new DataSourceManager
    this.dataSourceManager = dataSourceManager;
  }

  async fetchStockData(symbol, timeframe) {
    console.log(`📊 Fetching data for ${symbol} (${timeframe}) via DataSourceManager`);
    
    try {
      // Use the new multi-source manager
      return await this.dataSourceManager.fetchStockData(symbol, timeframe);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return this.dataSourceManager.generateMockData(symbol, timeframe);
    }
  }

  async fetchAlphaVantageData(symbol, timeframe) {
    const startTime = Date.now();
    let success = false;
    
    try {
      // Map timeframe to Alpha Vantage interval/keying
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

      // Alpha Vantage intraday endpoints use function=TIME_SERIES_INTRADAY&interval=5min
      let url;
      let timeSeriesKey;
      let endpoint;
      if (['1min','5min','15min','30min','60min','5min','30min'].includes(interval)) {
        // Use intraday function with interval param
        url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&apikey=${this.alphaVantageKey}&outputsize=full`;
        timeSeriesKey = `Time Series (${interval})`;
        endpoint = 'TIME_SERIES_INTRADAY';
      } else if (interval === 'weekly') {
        url = `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${encodeURIComponent(symbol)}&apikey=${this.alphaVantageKey}&outputsize=full`;
        timeSeriesKey = 'Weekly Time Series';
        endpoint = 'TIME_SERIES_WEEKLY';
      } else {
        // daily (EOD)
        url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&apikey=${this.alphaVantageKey}&outputsize=full`;
        timeSeriesKey = 'Time Series (Daily)';
        endpoint = 'TIME_SERIES_DAILY';
      }

      // Track API call
      apiTrackingService.logAPICall('Alpha Vantage', endpoint, symbol, timeframe, true, 0);
      
      const response = await axios.get(url, { timeout: 15000 });
      const data = response?.data;
      const responseTime = Date.now() - startTime;
      success = true;

      // Detailed error handling for common Alpha Vantage responses
      if (!data) {
        console.error('Alpha Vantage returned empty body');
        apiTrackingService.logAPICall('Alpha Vantage', endpoint, symbol, timeframe, false, responseTime);
        return null;
      }
      if (data.Note) {
        console.warn('Alpha Vantage rate limit notice:', data.Note);
        apiTrackingService.logAPICall('Alpha Vantage', endpoint, symbol, timeframe, false, responseTime);
        return null;
      }
      if (data['Error Message']) {
        console.error('Alpha Vantage error message:', data['Error Message']);
        apiTrackingService.logAPICall('Alpha Vantage', endpoint, symbol, timeframe, false, responseTime);
        return null;
      }
      // Alpha Vantage sometimes returns an 'Information' field (e.g., when symbol missing or other notices)
      if (data.Information) {
        console.warn('Alpha Vantage information:', data.Information);
        apiTrackingService.logAPICall('Alpha Vantage', endpoint, symbol, timeframe, false, responseTime);
        return null;
      }

      const timeSeries = data[timeSeriesKey];
      if (!timeSeries || Object.keys(timeSeries).length === 0) {
        console.warn('Alpha Vantage returned no time series data (keys: ' + Object.keys(data).join(', ') + ')');
        apiTrackingService.logAPICall('Alpha Vantage', endpoint, symbol, timeframe, false, responseTime);
        return null;
      }

      // Convert to OHLCV format
      const ohlcv = [];
      for (const [date, values] of Object.entries(timeSeries)) {
        ohlcv.push({
          date,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseFloat(values['5. volume'] || values['6. volume'] || 0)
        });
      }

      // Sort by date ascending
      ohlcv.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Limit based on timeframe
      const limitMap = {
        '1D': 96, // 5min intervals in 8 hours
        '1W': 56, // 30min intervals in 1 week
        '1M': 30,
        '3M': 90,
        '6M': 180,
        '1Y': 52,
        '2Y': 104
      };

      // Log successful API call with response time
      apiTrackingService.logAPICall('Alpha Vantage', endpoint, symbol, timeframe, true, responseTime);
      return ohlcv.slice(-(limitMap[timeframe] || 90));
    } catch (error) {
      // Log helpful details for debugging but do not crash the caller
      const responseTime = Date.now() - startTime;
      console.error('Alpha Vantage API error:', error && error.message ? error.message : error);
      apiTrackingService.logAPICall('Alpha Vantage', 'TIME_SERIES', symbol, timeframe, false, responseTime);
      return null;
    }
  }

  generateMockData(symbol, timeframe) {
    console.log('📋 Using mock data for', symbol);
    
    // Generate realistic mock OHLCV data
    const ohlcv = [];
    let price = 100 + Math.random() * 50; // Start between 100-150
    
    const dataPointsMap = {
      '1D': 96, // 5min intervals in 8 hours
      '1W': 56, // 30min intervals in 1 week
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 52,
      '2Y': 104
    };
    
    const dataPoints = dataPointsMap[timeframe] || 30;
    const baseVolume = 1000000;
    
    for (let i = 0; i < dataPoints; i++) {
      const change = (Math.random() - 0.5) * 4; // Random change between -2 and +2
      const open = price;
      price += change;
      const high = Math.max(open, price) + Math.random() * 1;
      const low = Math.min(open, price) - Math.random() * 1;
      const close = price;
      const volume = baseVolume * (0.8 + Math.random() * 0.4); // Volume with some randomness
      
      // Generate a date based on the timeframe and index
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
}

module.exports = new DataService();