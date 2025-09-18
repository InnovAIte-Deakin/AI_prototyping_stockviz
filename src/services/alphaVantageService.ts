import { AlphaVantageData } from '../types/stockTypes';

const API_KEY = import.meta.env.VITE_ALPHAVANTAGE_API_KEY;
const BASE_URL = import.meta.env.VITE_AV_BASE_URL || 'https://www.alphavantage.co';

interface RequestCache {
  [key: string]: { data: any; timestamp: number };
}

class AlphaVantageService {
  private cache: RequestCache = {};
  private requestQueue: Promise<any>[] = [];
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_MS = 12000; // 5 requests per minute

  private async makeRequest(url: string): Promise<any> {
    // Check cache first (5 minute TTL)
    const cached = this.cache[url];
    if (cached && Date.now() - cached.timestamp < 300000) {
      return cached.data;
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_MS - timeSinceLastRequest));
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      // Check for API error messages
      if (data.Error || data['Error Message']) {
        throw new Error(data.Error || data['Error Message']);
      }

      if (data.Note && data.Note.includes('call frequency')) {
        throw new Error('API rate limit exceeded');
      }
      
      // Cache the response
      this.cache[url] = { data, timestamp: Date.now() };
      this.lastRequestTime = Date.now();
      
      return data;
    } catch (error) {
      console.error(`Alpha Vantage request failed: ${url}`, error);
      
      // Retry once with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        this.cache[url] = { data, timestamp: Date.now() };
        this.lastRequestTime = Date.now();
        
        return data;
      } catch (retryError) {
        console.error(`Alpha Vantage retry failed: ${url}`, retryError);
        return null; // Graceful degradation
      }
    }
  }

  async getCompanyOverview(symbol: string) {
    const url = `${BASE_URL}/query?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`;
    return this.makeRequest(url);
  }

  async getIncomeStatement(symbol: string) {
    const url = `${BASE_URL}/query?function=INCOME_STATEMENT&symbol=${symbol}&apikey=${API_KEY}`;
    return this.makeRequest(url);
  }

  async getBalanceSheet(symbol: string) {
    const url = `${BASE_URL}/query?function=BALANCE_SHEET&symbol=${symbol}&apikey=${API_KEY}`;
    return this.makeRequest(url);
  }

  async getCashFlow(symbol: string) {
    const url = `${BASE_URL}/query?function=CASH_FLOW&symbol=${symbol}&apikey=${API_KEY}`;
    return this.makeRequest(url);
  }

  async getDailyAdjusted(symbol: string) {
    const url = `${BASE_URL}/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${API_KEY}`;
    return this.makeRequest(url);
  }

  async getSMA(symbol: string, interval: string = 'daily', period: number = 50) {
    const url = `${BASE_URL}/query?function=SMA&symbol=${symbol}&interval=${interval}&time_period=${period}&series_type=close&apikey=${API_KEY}`;
    return this.makeRequest(url);
  }

  async getRSI(symbol: string, interval: string = 'daily', period: number = 14) {
    const url = `${BASE_URL}/query?function=RSI&symbol=${symbol}&interval=${interval}&time_period=${period}&series_type=close&apikey=${API_KEY}`;
    return this.makeRequest(url);
  }

  async getMACD(symbol: string, interval: string = 'daily') {
    const url = `${BASE_URL}/query?function=MACD&symbol=${symbol}&interval=${interval}&series_type=close&apikey=${API_KEY}`;
    return this.makeRequest(url);
  }

  async getATR(symbol: string, interval: string = 'daily', period: number = 14) {
    const url = `${BASE_URL}/query?function=ATR&symbol=${symbol}&interval=${interval}&time_period=${period}&apikey=${API_KEY}`;
    return this.makeRequest(url);
  }

  async getNewsSentiment(symbol: string) {
    const url = `${BASE_URL}/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${API_KEY}`;
    return this.makeRequest(url);
  }

  async getAllData(symbol: string): Promise<AlphaVantageData> {
    try {
      console.log(`Fetching all data for ${symbol}...`);
      
      const [overview, income, balance, cashFlow, daily, sma50, sma200, rsi, macd, atr, news] = await Promise.allSettled([
        this.getCompanyOverview(symbol),
        this.getIncomeStatement(symbol),
        this.getBalanceSheet(symbol),
        this.getCashFlow(symbol),
        this.getDailyAdjusted(symbol),
        this.getSMA(symbol, 'daily', 50),
        this.getSMA(symbol, 'daily', 200),
        this.getRSI(symbol),
        this.getMACD(symbol),
        this.getATR(symbol),
        this.getNewsSentiment(symbol)
      ]);

      return {
        overview: overview.status === 'fulfilled' ? overview.value : null,
        incomeStatement: income.status === 'fulfilled' ? income.value : null,
        balanceSheet: balance.status === 'fulfilled' ? balance.value : null,
        cashFlow: cashFlow.status === 'fulfilled' ? cashFlow.value : null,
        dailySeries: daily.status === 'fulfilled' ? daily.value : null,
        technicalIndicators: {
          sma50: sma50.status === 'fulfilled' ? sma50.value : null,
          sma200: sma200.status === 'fulfilled' ? sma200.value : null,
          rsi: rsi.status === 'fulfilled' ? rsi.value : null,
          macd: macd.status === 'fulfilled' ? macd.value : null,
          atr: atr.status === 'fulfilled' ? atr.value : null,
        },
        newsSentiment: news.status === 'fulfilled' ? news.value : null,
      };
    } catch (error) {
      console.error(`Failed to fetch data for ${symbol}:`, error);
      throw error;
    }
  }
}

export const alphaVantageService = new AlphaVantageService();
