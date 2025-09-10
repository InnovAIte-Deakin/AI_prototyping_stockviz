const axios = require('axios');

class DataService {
  constructor() {
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
  }

  async fetchStockData(symbol, timeframe) {
    console.log(`📊 Fetching data for ${symbol} (${timeframe})`);
    
    try {
      // Try to get real data from Alpha Vantage
      if (this.alphaVantageKey) {
        const ohlcvData = await this.fetchAlphaVantageData(symbol, timeframe);
        if (ohlcvData && ohlcvData.length > 0) {
          return {
            symbol,
            ohlcv: ohlcvData,
            timeframe,
            source: 'Alpha Vantage'
          };
        }
      }
      
      // Fall back to mock data if Alpha Vantage fails or no API key
      return this.generateMockData(symbol, timeframe);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return this.generateMockData(symbol, timeframe);
    }
  }

  async fetchAlphaVantageData(symbol, timeframe) {
    try {
      // Map timeframe to Alpha Vantage interval
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
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_${interval.toUpperCase()}&symbol=${symbol}&apikey=${this.alphaVantageKey}&outputsize=full`;
      
      const response = await axios.get(url);
      const data = response.data;
      
      // Parse the response based on interval
      let timeSeries;
      if (interval === 'daily') {
        timeSeries = data['Time Series (Daily)'];
      } else if (interval === 'weekly') {
        timeSeries = data['Weekly Time Series'];
      } else {
        timeSeries = data[`Time Series (${interval})`];
      }
      
      if (!timeSeries) {
        throw new Error('Invalid response from Alpha Vantage');
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
          volume: parseFloat(values['5. volume'])
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
      
      return ohlcv.slice(-(limitMap[timeframe] || 90));
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
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