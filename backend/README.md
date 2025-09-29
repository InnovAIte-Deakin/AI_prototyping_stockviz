# Hybrid Stock Analysis API (v3.0)

A modular Node.js API that provides comprehensive stock analysis by combining **fundamental, technical, and sentiment** data, summarized by Google's Gemini AI. The backend is designed for scalability and performance, featuring services/controllers, in-memory caching, and rate limiting.

---

## ✨ Features

- **Multi-faceted Analysis:** Analyze stocks using a hybrid approach that integrates fundamentals, technical indicators, and news sentiment
- **AI-Powered Insights:** Get a clear, concise AI-generated summary of the analysis for easy interpretation
- **Dynamic Analysis Modes:**
  - **`normal` mode:** Provides fundamentals and an AI summary
  - **`advanced` mode:** A comprehensive analysis that generates a single `weightedScore` from all three data points
- **Advanced Technical Suite:** Support for key indicators including **RSI, SMA/EMA, MACD, Bollinger Bands, Stochastic, ATR, and OBV**, with configurable parameters per request
- **Pattern Recognition:** Automatic candlestick pattern detection for enhanced technical analysis
- **Flexible Weighting & Presets:** Customize the influence of each data point (`fundamental`, `technical`, `sentiment`) or use built-in presets like `conservative`, `technical`, `sentiment`, and `balanced`
- **Custom Indicators:** Enable/disable specific indicators and customize their parameters
- **Centralized Caching:** Unified cache management with monitoring and maintenance endpoints
- **Developer-Friendly:** Includes health checks, API key validation, and connectivity tests for quick setup and debugging

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Data & APIs:**
  - **Axios** for HTTP requests
  - **Alpha Vantage** for market data
  - **Google Gemini** for AI summaries
- **Utilities:** Centralized in-memory caching, technical indicator calculations

---

## 🏗️ Backend Structure

The backend follows a modular architecture with the following components:

### Controllers
- **`stockController.js`**: Handles main stock analysis functionality, technical indicators, and weight configurations
- **`searchController.js`**: Manages stock symbol search and trending stocks functionality

### Services
- **`analysisService.js`**: Core analysis logic combining fundamental, technical, and sentiment data
- **`dataService.js`**: Fetches stock data from Alpha Vantage or generates mock data as fallback
- **`cacheService.js`**: Manages in-memory caching with expiration and statistics
- **`apiTrackingService.js`**: Tracks API calls to external services (Alpha Vantage, Gemini)
- **`geminiService.js`**: Interfaces with Google Gemini for AI-powered insights
- **`fundamentalAnalysisService.js`**: Processes fundamental stock data
- **`sentimentService.js`**: Analyzes market sentiment
- **`technicalAnalysisService.js`**: Calculates technical indicators and patterns
- **`weightService.js`**: Manages weight configurations for analysis modes

### Routes
- **`stockRoutes.js`**: Defines API endpoints for stock analysis, search, and technical indicators

### Utils
- Contains utility functions for testing connections and other helper functions

### Middleware
- Rate limiting and CORS configuration

---

## 🚀 Quickstart

### Prerequisites

- Node.js version 18 or higher
- npm (Node Package Manager)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>.git
cd <your-repo-folder>
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Create .env file in project root
PORT=3001
NODE_ENV=development

# External APIs
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
GEMINI_API_KEY=your_gemini_key
```

4. Start the server:
```bash
node server.js
```

> **Tip:** For development, use `nodemon` to automatically restart the server on code changes:
> ```bash
> npx nodemon server.js
> ```

### Sanity Checks

Verify your setup with these endpoints:

```bash
# Health Check
curl "http://localhost:3001/health"

# Verify API Keys (returns true/false flags)
curl "http://localhost:3001/test-keys"

# Test Live Connectivity to External APIs
curl "http://localhost:3001/test-connections"

# Check API Key Configuration
curl "http://localhost:3001/test-keys"

# Check Cache Status
curl "http://localhost:3001/cache/status"
```

> **Windows PowerShell Tip:** Use `Invoke-WebRequest` instead of `curl`:
> ```powershell
> Invoke-WebRequest "http://localhost:3001/health"
> ```

---

## 📜 API Endpoints

**Base URL:** `http://localhost:3001`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Overview & API docs |
| `GET` | `/health` | Server health check |
| `GET` | `/test-keys` | API key validation flags |
| `GET` | `/test-connections` | Live connectivity checks |
| `GET` | `/cache/status` | Get cache statistics |
| `DELETE` or `GET` | `/cache/clear` | Clear all cache |
| `POST` or `GET` | `/cache/cleanup` | Clean up expired cache entries |
| `GET` | `/api/tracking` | Get API usage statistics |
| `GET` | `/api/tracking/calls` | Get detailed API call logs |
| `DELETE` | `/api/tracking/clear` | Clear API tracking data |

### Stock API Routes (`/api/stocks`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/search?query=...` | Search for a company name to get its symbol |
| `GET` | `/trending` | Get a list of trending stocks (cached) - includes gainers, losers, and most active stocks |
| `GET` | `/indicators` | List all supported technical indicators |
| `GET` | `/weights/defaults` | Get default weight configurations |
| `GET` | `/analysis/:symbol` | Perform stock analysis |

---

## ⚙️ Usage & Parameters

The core analysis endpoint is `GET /api/stocks/analysis/:symbol`.

### Common Parameters

- `timeframe`: **1D, 1W, 1M** (default), **3M, 6M, 1Y, 2Y**
- `mode`: **`normal`** or **`advanced`**

### `advanced` Mode Parameters

- **`fundamental`, `technical`, `sentiment`**: Integers that must sum to `100`
  - **Example:** `...&mode=advanced&fundamental=30&technical=40&sentiment=30`
- **`indicators`**: A URL-encoded JSON string to customize indicator parameters
  - **Example:** `...&indicators={"RSI":{"period":14},"MACD":{...}}`
  - **Disable patterns:** `...&indicators={"patterns":{"enabled":false}}`

---

## 🌐 Example Calls

### Search for "Apple"
```bash
curl "http://localhost:3001/api/stocks/search?query=apple"
```

### Get Trending Stocks
```bash
curl "http://localhost:3001/api/stocks/trending"
```

### Get Technical Indicators
```bash
curl "http://localhost:3001/api/stocks/indicators"
```

### Normal Analysis for AAPL
```bash
curl "http://localhost:3001/api/stocks/analysis/AAPL?timeframe=1M&mode=normal"
```

### Advanced Analysis for AAPL with Custom Weights
```bash
curl "http://localhost:3001/api/stocks/analysis/AAPL?timeframe=3M&mode=advanced&fundamental=40&technical=35&sentiment=25"
```

### Advanced Analysis with Custom Indicators
```bash
curl "http://localhost:3001/api/stocks/analysis/AAPL?timeframe=1M&mode=advanced&indicators=%7B%22RSI%22%3A%7B%22period%22%3A14%7D%2C%22MACD%22%3A%7B%22fastPeriod%22%3A12%2C%22slowPeriod%22%3A26%2C%22signalPeriod%22%3A9%7D%7D"
```

### Advanced Analysis with Disabled Patterns
```bash
curl "http://localhost:3001/api/stocks/analysis/AAPL?timeframe=1M&mode=advanced&indicators=%7B%22patterns%22%3A%7B%22enabled%22%3Afalse%7D%7D"
```

### Cache Management Examples
```bash
# Check cache status
curl "http://localhost:3001/cache/status"

# Clear all cache (supports both DELETE and GET methods)
curl -X DELETE "http://localhost:3001/cache/clear"
# Or: curl "http://localhost:3001/cache/clear"

# Clean up expired cache entries (supports both POST and GET methods)
curl -X POST "http://localhost:3001/cache/cleanup"
# Or: curl "http://localhost:3001/cache/cleanup"
```

---

## 📝 Notes & Behaviors

- **Centralized Caching:** All caching is now handled through a unified cache service with monitoring and management endpoints
- **Cache Duration:** Data is cached in-memory for 5 minutes to reduce API calls and latency
- **Rate Limiting:** The API uses a server-side rate limit of **100 requests per 15 minutes** per IP address
- **Error Handling:** The API provides consistent JSON error envelopes with clear status codes (e.g., `400` for bad input, `500` for server errors)
- **Modular Design:** The project is structured with separate **controllers** (request/response logic) and **services** (data fetching, analysis, caching)
- **Technical Indicators:** Supports RSI, MACD, Bollinger Bands, SMA, EMA, Stochastic, ATR, and OBV with customizable parameters
- **Pattern Recognition:** Automatically detects common candlestick patterns for enhanced technical analysis
- **API Tracking:** All external API calls are logged with response times and success/failure status
- **Fallback Strategy:** When Alpha Vantage API is unavailable, the system generates realistic mock data to ensure continuous operation
- **Flexible Cache Endpoints:** Cache management endpoints support multiple HTTP methods (e.g., both DELETE and GET for cache clear, both POST and GET for cache cleanup)
- **Trending Stocks Enhancement:** The trending endpoint supports categorization options (gainers, losers, most_active) and optional name enrichment
- **Comprehensive API Testing:** Includes dedicated endpoints for verifying API key configuration and connectivity to external services
- **Cache Statistics:** Detailed cache statistics include counts of valid vs. expired entries for better monitoring

---

## 🗺️ Roadmap

- [ ] Connect trending data to a live, external feed with backoff/circuit-breaker logic
- [ ] Add more sentiment data sources and richer market health checks
- [ ] Provide a Postman collection and example JSON responses for easier testing
- [ ] Generate an OpenAPI 3.1 specification for full documentation
- [ ] Add persistent caching options (Redis integration)
- [ ] Implement more advanced technical indicators and chart patterns

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## ⚠️ Disclaimer

This API is for educational and research purposes only. Not financial advice. Stock investments carry risks, and past performance doesn't guarantee future results.