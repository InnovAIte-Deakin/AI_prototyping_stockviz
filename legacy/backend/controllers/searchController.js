// controllers/searchController.js
const dataSourceManager = require('../services/dataSourceManager');
const cacheService = require('../services/cacheService');

class SearchController {
  constructor() {
    // Internal cache removed - using shared cacheService
  }

  // ----------------------------
  //  Symbol search
  // ----------------------------
  async searchSymbols(req, res) {
    try {
      const { query } = req.query;

      if (!query || query.length < 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Query parameter is required and must be at least 1 character'
        });
      }

      console.log(`🔍 Searching symbols for: ${query}`);

      // Check cache using shared cache service
      const cacheKey = `search_${query.toLowerCase()}`;
      const cached = cacheService.get(cacheKey);

      if (cached) {
        console.log('📋 Returning cached results');
        return res.json({
          status: 'success',
          query,
          results: cached,
          source: 'cache'
        });
      }

      // Use the new multi-source data manager for search
      let searchResults;
      try {
        const searchResponse = await dataSourceManager.searchSymbols(query);
        searchResults = searchResponse.results || [];
      } catch (error) {
        console.log('⚠️ Multi-source search failed, using fallback');
        searchResults = this.generateFallbackSearchResults(query);
      }

      // Cache results using shared cache service
      cacheService.set(cacheKey, searchResults);

      return res.json({
        status: 'success',
        query,
        results: searchResults,
        source: 'live'
      });
    } catch (error) {
      console.error('❌ Search error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to search symbols',
        error: error.message
      });
    }
  }

  // Get data sources status (new endpoint)
  async getDataSourcesStatus(req, res) {
    try {
      const status = dataSourceManager.getStatus();
      return res.json({
        status: 'success',
        dataSources: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error getting data sources status:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to get data sources status',
        error: error.message
      });
    }
  }

  // Keep existing Alpha Vantage method for backwards compatibility
  async fetchSymbolSearch(query) {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${apiKey}`;

    const response = await axios.get(url, { timeout: 10000 });

    if (response.data['Error Message']) {
      throw new Error('API Error: ' + response.data['Error Message']);
    }
    if (response.data['Note']) {
      throw new Error('API Rate Limit: ' + response.data['Note']);
    }

    const matches = response.data['bestMatches'] || [];
    return matches.slice(0, 10).map(match => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'],
      region: match['4. region'],
      marketOpen: match['5. marketOpen'],
      marketClose: match['6. marketClose'],
      timezone: match['7. timezone'],
      currency: match['8. currency']
    }));
  }

  // Fallback search results when API fails
  generateFallbackSearchResults(query) {
    const popularStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Equity', region: 'United States' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'META', name: 'Meta Platforms Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Equity', region: 'United States' },
      { symbol: 'NFLX', name: 'Netflix Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'INTC', name: 'Intel Corporation', type: 'Equity', region: 'United States' }
    ];

    const lowerQuery = query.toLowerCase();
    return popularStocks
      .filter(
        s =>
          s.symbol.toLowerCase().includes(lowerQuery) ||
          s.name.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5);
  }

  // -----------------------------------------
  //  Alpha Vantage TOP_GAINERS_LOSERS helper
  // -----------------------------------------
  async fetchTopGainersLosers() {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) throw new Error('Missing ALPHA_VANTAGE_API_KEY');

    const url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${encodeURIComponent(apiKey)}`;
    const resp = await axios.get(url, { timeout: 10000 });
    const data = resp?.data || {};

    if (data.Note) throw new Error(`API Rate Limit: ${data.Note}`);
    if (data['Error Message']) throw new Error(`API Error: ${data['Error Message']}`);

    const lastUpdated = data.last_updated || new Date().toISOString();

    const normalize = (arr = [], category) =>
      arr.map(item => ({
        symbol: item.ticker,
        name: item.ticker, // name not provided by this endpoint
        price: item.price ? Number(item.price) : null,
        changeAmount: item.change_amount ? Number(item.change_amount) : null,
        change: item.change_percentage || null, // string like "3.21%"
        volume: item.volume ? Number(item.volume) : null,
        category
      }));

    return {
      lastUpdated,
      gainers: normalize(data.top_gainers, 'gainer'),
      losers: normalize(data.top_losers, 'loser'),
      mostActive: normalize(data.most_actively_traded, 'most_active')
    };
  }

  // Optional: light enrichment of names using SYMBOL_SEARCH (best-effort)
  async enrichNames(list = []) {
    const out = [];
    for (const r of list.slice(0, 10)) { // cap to avoid rate limits
      try {
        const matches = await this.fetchSymbolSearch(r.symbol);
        const exact = matches.find(m => m.symbol.toUpperCase() === r.symbol.toUpperCase());
        out.push({ ...r, name: exact?.name || r.name });
      } catch {
        out.push(r); // keep original on failure
      }
    }
    return out.concat(list.slice(10));
  }

  // ----------------------------
  //  Trending
  // ----------------------------
  async getTrendingSymbols(req, res) {
    try {
      console.log('📈 Fetching trending symbols via enhanced trending service...');

      const { category } = req.query;
      const validCategories = ['gainers', 'losers', 'mostActive'];
      const catKey = (category || 'gainers').toLowerCase();
      
      if (!validCategories.includes(catKey)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid category. Use: gainers, losers, or mostActive'
        });
      }

      // Use enhanced trending service for better reliability
      const enhancedTrendingService = require('../services/enhancedTrendingService');
      const trendingData = await enhancedTrendingService.getTrendingStocks(catKey);

      return res.json({
        status: 'success',
        trending: trendingData.results,
        source: trendingData.source,
        category: catKey,
        timestamp: trendingData.timestamp
      });
    } catch (error) {
      console.error('❌ Enhanced trending symbols error:', error.message);

      // Final fallback to brief generated list
      const fallback = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 175.50, change: 3.75, changePercent: 2.18, volume: '52.3M', category: 'gainer' },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.20, change: 14.20, changePercent: 6.07, volume: '89.1M', category: 'gainer' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 145.80, change: -2.15, changePercent: -1.45, volume: '45.2M', category: 'loser' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 875.50, change: 65.30, changePercent: 8.05, volume: '67.3M', category: 'most_active' }
      ];

      return res.status(200).json({
        status: 'success',
        trending: fallback,
        source: 'fallback',
        category: req.query.category || 'gainers',
        note: 'All trending services unavailable; returned generated data',
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Export a single instance (singleton pattern)
module.exports = new SearchController();