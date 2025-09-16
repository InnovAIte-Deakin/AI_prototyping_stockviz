// server.js
// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import routes
const stockRoutes = require('./routes/stockRoutes');

// Import cache service
const cacheService = require('./services/cacheService');
const apiTrackingService = require('./services/apiTrackingService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Basic rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    message: 'Hybrid Stock Analysis API is running!'
  });
});

// Test endpoint for API keys
app.get('/test-keys', async (req, res) => {
  const hasAlphaVantage = !!process.env.ALPHA_VANTAGE_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  
  res.json({
    alpha_vantage_configured: hasAlphaVantage,
    gemini_configured: hasGemini,
    ready_for_development: hasAlphaVantage && hasGemini
  });
});

// Import test functions
const { testAlphaVantage, testGemini } = require('./utils/testConnections');

// Test API connections endpoint
app.get('/test-connections', async (req, res) => {
  console.log('🧪 Testing API connections...');
  
  const alphaVantageOK = await testAlphaVantage();
  const geminiOK = await testGemini();
  
  res.json({
    alpha_vantage: {
      status: alphaVantageOK ? 'connected' : 'failed',
      ready: alphaVantageOK
    },
    gemini: {
      status: geminiOK ? 'connected' : 'failed',
      ready: geminiOK
    },
    overall_status: alphaVantageOK && geminiOK ? 'ready' : 'configuration_needed'
  });
});

// Cache management endpoints
app.get('/cache/status', (req, res) => {
  const stats = cacheService.stats();
  res.json({
    status: 'success',
    cache: stats,
    message: `Cache contains ${stats.valid} valid items and ${stats.expired} expired items`
  });
});

// API tracking endpoints
app.get('/api/tracking', (req, res) => {
  const stats = apiTrackingService.getAPIStatistics();
  res.json({
    status: 'success',
    statistics: stats
  });
});

app.get('/api/tracking/calls', (req, res) => {
  const calls = apiTrackingService.getAPICalls();
  res.json({
    status: 'success',
    calls: calls
  });
});

app.delete('/api/tracking/clear', (req, res) => {
  apiTrackingService.clearTracking();
  res.json({
    status: 'success',
    message: 'API tracking data cleared'
  });
});

// Support both DELETE and GET for cache clear
app.delete('/cache/clear', (req, res) => {
  handleCacheClear(req, res);
});

app.get('/cache/clear', (req, res) => {
  handleCacheClear(req, res);
});

// Support both POST and GET for cache cleanup
app.post('/cache/cleanup', (req, res) => {
  handleCacheCleanup(req, res);
});

app.get('/cache/cleanup', (req, res) => {
  handleCacheCleanup(req, res);
});

// Helper functions for cache operations
function handleCacheClear(req, res) {
  const beforeSize = cacheService.size();
  cacheService.clear();
  res.json({
    status: 'success',
    message: `Cache cleared (removed ${beforeSize} items)`
  });
}

function handleCacheCleanup(req, res) {
  const removed = cacheService.cleanup();
  res.json({
    status: 'success',
    message: `Removed ${removed} expired cache entries`
  });
}

// API Routes - Updated to use plural 'stocks'
app.use('/api/stocks', stockRoutes);

// Home/Documentation endpoint - Updated with new endpoints
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Hybrid Stock Analysis API with Advanced Technical Indicators',
    version: '3.0.0',
    features: [
      'Stock Symbol Search',
      'Trending Stocks',
      'Normal Analysis (Fundamental + AI)',
      'Advanced Analysis (Fundamental + Technical + Sentiment + AI)',
      'Custom Weight Analysis',
      'Advanced Technical Indicators (RSI, MACD, Bollinger Bands, etc.)',
      'Pattern Recognition (Candlestick Patterns)',
      'Customizable Indicator Parameters',
      'Cache Management',
      'API Usage Tracking'
    ],
    endpoints: {
      testKeys: '/test-keys',
      testConnections: '/test-connections',
      cacheStatus: '/cache/status',
      cacheClear: '/cache/clear (DELETE or GET)',
      cacheCleanup: '/cache/cleanup (POST or GET)',
      apiTracking: '/api/tracking',
      apiTrackingCalls: '/api/tracking/calls',
      apiTrackingClear: '/api/tracking/clear (DELETE)',
      technicalIndicators: '/api/stocks/indicators',
      stockSearch: '/api/stocks/search?query=SYMBOL',
      trendingStocks: '/api/stocks/trending',
      normalAnalysis: '/api/stocks/analysis/AAPL?timeframe=1M&mode=normal',
      advancedAnalysis: '/api/stocks/analysis/AAPL?timeframe=3M&mode=advanced',
      customWeightAnalysis: '/api/stocks/analysis/AAPL?timeframe=6M&mode=advanced&fundamental=30&technical=40&sentiment=30',
      customIndicators: '/api/stocks/analysis/AAPL?timeframe=1M&mode=advanced&indicators={"RSI":{"period":14},"MACD":{"fastPeriod":12,"slowPeriod":26,"signalPeriod":9}}',
      disablePatterns: '/api/stocks/analysis/AAPL?timeframe=1M&mode=advanced&indicators={"patterns":{"enabled":false}}',
      defaultWeights: '/api/stocks/weights/defaults'
    },
    examples: {
      search: 'curl "http://localhost:3001/api/stocks/search?query=apple"',
      trending: 'curl "http://localhost:3001/api/stocks/trending"',
      indicators: 'curl "http://localhost:3001/api/stocks/indicators"',
      normalAnalysis: 'curl "http://localhost:3001/api/stocks/analysis/AAPL?timeframe=1M&mode=normal"',
      advancedAnalysis: 'curl "http://localhost:3001/api/stocks/analysis/AAPL?timeframe=3M&mode=advanced"',
      customWeights: 'curl "http://localhost:3001/api/stocks/analysis/AAPL?timeframe=3M&mode=advanced&fundamental=30&technical=40&sentiment=30"',
      customIndicators: 'curl "http://localhost:3001/api/stocks/analysis/AAPL?timeframe=1M&mode=advanced&indicators={\"RSI\":{\"period\":14},\"MACD\":{\"fastPeriod\":12,\"slowPeriod\":26,\"signalPeriod\":9}}"',
      disablePatterns: 'curl "http://localhost:3001/api/stocks/analysis/AAPL?timeframe=1M&mode=advanced&indicators={\"patterns\":{\"enabled\":false}}"'
    },
    timeframeOptions: {
      description: 'Timeframe parameter controls the historical data period for analysis',
      options: [
        {value: '1D', description: '1 Day - Intraday data'},
        {value: '1W', description: '1 Week - Short-term trends'},
        {value: '1M', description: '1 Month - Medium-term trends (default)'},
        {value: '3M', description: '3 Months - Quarter analysis'},
        {value: '6M', description: '6 Months - Half-year trends'},
        {value: '1Y', description: '1 Year - Annual performance'},
        {value: '2Y', description: '2 Years - Long-term trends'}
      ]
    },
    weightingOptions: {
      conservative: { fundamental: 50, technical: 30, sentiment: 20 },
      technical: { fundamental: 20, technical: 60, sentiment: 20 },
      sentiment: { fundamental: 30, technical: 25, sentiment: 45 },
      balanced: { fundamental: 40, technical: 35, sentiment: 25 }
    }
  });
});

// 404 handler - Updated with timeframe parameter info
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'Include timeframe parameter for stock analysis (e.g., timeframe=1M)',
    available_endpoints: [
      '/',
      '/health',
      '/test-keys',
      '/test-connections',
      '/cache/status',
      '/cache/clear',
      '/cache/cleanup',
      '/api/stocks/indicators',
      '/api/stocks/search?query=SYMBOL',
      '/api/stocks/trending',
      '/api/stocks/analysis/:symbol?timeframe=1M&mode=normal',
      '/api/stocks/weights/defaults'
    ],
    timeframe_examples: [
      '/api/stocks/analysis/AAPL?timeframe=1M&mode=normal',
      '/api/stocks/analysis/MSFT?timeframe=3M&mode=advanced',
      '/api/stocks/analysis/TSLA?timeframe=1Y&mode=advanced&fundamental=30&technical=40&sentiment=30'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log('🚀 Hybrid Stock Analysis API v3.0 Started!');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\n📋 Available Endpoints:');
  console.log(`🔍 Test Setup: http://localhost:${PORT}/test-keys`);
  console.log(`🧪 Test Connections: http://localhost:${PORT}/test-connections`);
    console.log(`📊 Cache Status: http://localhost:${PORT}/cache/status`);
  console.log(`🗑️  Clear Cache: http://localhost:${PORT}/cache/clear (DELETE or GET)`);
  console.log(`🧹 Cleanup Cache: http://localhost:${PORT}/cache/cleanup (POST or GET)`);
  console.log(`📈 Technical Indicators: http://localhost:${PORT}/api/stocks/indicators`);
  console.log(`🔎 Search Stocks: http://localhost:${PORT}/api/stocks/search?query=apple`);
  console.log(`📈 Trending: http://localhost:${PORT}/api/stocks/trending`);
  console.log(`📊 Normal Analysis: http://localhost:${PORT}/api/stocks/analysis/AAPL?timeframe=1M&mode=normal`);
  console.log(`⚖️  Advanced Analysis: http://localhost:${PORT}/api/stocks/analysis/AAPL?timeframe=3M&mode=advanced`);
  console.log(`🎯 Custom Weights: http://localhost:${PORT}/api/stocks/analysis/AAPL?timeframe=3M&mode=advanced&fundamental=30&technical=40&sentiment=30`);
  console.log(`⚙️  Custom Indicators: http://localhost:${PORT}/api/stocks/analysis/AAPL?timeframe=1M&mode=advanced&indicators={"RSI":{"period":14},"MACD":{"fastPeriod":12,"slowPeriod":26,"signalPeriod":9}}`);
  console.log(`🚫 Disable Patterns: http://localhost:${PORT}/api/stocks/analysis/AAPL?timeframe=1M&mode=advanced&indicators={"patterns":{"enabled":false}}`);
  console.log(`📊 API Tracking: http://localhost:${PORT}/api/tracking`);
  console.log(`📋 API Calls: http://localhost:${PORT}/api/tracking/calls`);
  console.log(`🗑️  Clear API Tracking: http://localhost:${PORT}/api/tracking/clear (DELETE)`);
  console.log(`⚙️  Default Weights: http://localhost:${PORT}/api/stocks/weights/defaults`);
  console.log('\n⏰ Timeframe Options:');
  console.log('   1D - 1 Day     1W - 1 Week    1M - 1 Month (default)');
  console.log('   3M - 3 Months  6M - 6 Months  1Y - 1 Year  2Y - 2 Years');
  console.log('\n✨ New Features: Advanced Technical Analysis!');
  console.log('   • Multiple Technical Indicators (RSI, MACD, Bollinger Bands, etc.)');
  console.log('   • Candlestick Pattern Recognition');
  console.log('   • Customizable Indicator Parameters');
  console.log('   • Cache Management Endpoints');
  console.log('   • Conservative: 50% Fund + 30% Tech + 20% Sent');
  console.log('   • Technical Focus: 20% Fund + 60% Tech + 20% Sent');
  console.log('   • Sentiment Focus: 30% Fund + 25% Tech + 45% Sent');
  console.log('   • Custom: Set your own percentages with timeframe support!');
  console.log('\n🎯 New: Custom Indicator Selection!');
  console.log('   • Choose specific indicators to calculate');
  console.log('   • Customize parameters for each indicator');
  console.log('   • Disable pattern recognition if not needed');

  // Test connections on startup
  console.log('\n🧪 Testing API connections...');
  const alphaVantageOK = await testAlphaVantage();
  const geminiOK = await testGemini();

  if (alphaVantageOK && geminiOK) {
    console.log('✅ All API connections successful!\n');
  } else {
    console.log('⚠️ Some API connections failed. Check /test-connections for details.\n');
  }
});