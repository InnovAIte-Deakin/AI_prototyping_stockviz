// controllers/searchController.js
const axios = require('axios');
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

      // Fetch from Alpha Vantage or use fallback
      let searchResults;
      try {
        searchResults = await this.fetchSymbolSearch(query);
      } catch (error) {
        console.log('⚠️ Alpha Vantage search failed, using fallback');
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

  // Alpha Vantage SYMBOL_SEARCH (helper)
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
      console.log('📈 Fetching trending symbols (live from Alpha Vantage)...');

      const { category, enrich } = req.query; // category: gainers|losers|most_active; enrich=true to look up names
      const catKey = (category || 'all').toLowerCase();
      const enrichFlag = String(enrich).toLowerCase() === 'true';

      // Cache check using shared cache service
      const cacheKey = `trending_${catKey}_${enrichFlag ? 'enriched' : 'plain'}`;
      const cached = cacheService.get(cacheKey);

      if (cached) {
        console.log('📋 Returning cached trending results');
        return res.json({
          status: 'success',
          trending: cached,
          source: 'cache',
          timestamp: new Date().toISOString()
        });
      }

      // Live fetch
      const live = await this.fetchTopGainersLosers();

      // Shape payload
      let payload;
      if (catKey === 'gainers') payload = live.gainers;
      else if (catKey === 'losers') payload = live.losers;
      else if (catKey === 'most_active' || catKey === 'actives' || catKey === 'mostactive')
        payload = live.mostActive;
      else payload = { lastUpdated: live.lastUpdated, ...live };

      // Optional enrichment (only for array payloads)
      if (enrichFlag && Array.isArray(payload)) {
        payload = await this.enrichNames(payload);
      }

      // Cache using shared cache service
      cacheService.set(cacheKey, payload);

      return res.json({
        status: 'success',
        trending: payload,
        source: 'alpha_vantage',
        lastUpdated: live.lastUpdated,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Trending symbols error:', error.message);

      // graceful fallback to brief generated list
      const fallback = [
        { symbol: 'AAPL', name: 'Apple Inc.', change: '+2.15%', volume: 52300000, category: 'gainer' },
        { symbol: 'TSLA', name: 'Tesla Inc.', change: '+5.67%', volume: 89100000, category: 'gainer' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', change: '-1.45%', volume: 45200000, category: 'loser' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', change: '+7.89%', volume: 67300000, category: 'most_active' }
      ];

      return res.status(200).json({
        status: 'success',
        trending: fallback,
        source: 'fallback',
        note: 'Alpha Vantage unavailable or rate-limited; returned cached/generated data',
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Export a single instance (singleton pattern)
module.exports = new SearchController();