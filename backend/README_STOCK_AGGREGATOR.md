# Stock Score Aggregator

A comprehensive stock analysis tool that combines fundamentals, technicals, and sentiment analysis into a single aggregated score (0-100).

## Features

- **Fundamentals Analysis (50% weight)**:
  - Profitability: Net margin, operating margin
  - Efficiency: ROE, ROA  
  - Leverage: Debt-to-equity ratio
  - Growth: Revenue and EPS growth
  - Cash strength: Free cash flow margin
  - Valuation: P/E ratio

- **Technical Analysis (30% weight)**:
  - Trend: 50-day vs 200-day moving averages
  - Momentum: RSI indicator
  - MACD: Signal line crossovers
  - Volatility: ATR percentage

- **Sentiment Analysis (20% weight)**:
  - News sentiment over 7-day and 30-day windows
  - Weighted by article relevance scores

## Setup

1. **Environment Variables**:
   Copy `.env.example` to `.env` and configure:
   ```bash
   VITE_ALPHAVANTAGE_API_KEY=your_api_key_here
   VITE_AV_BASE_URL=https://www.alphavantage.co
   VITE_DEFAULT_TICKERS=TSLA,AAPL,MSFT
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

## Usage

### Basic Stock Analysis

```typescript
import { stockScoringService } from './services/scoringService';

// Analyze a single stock
const result = await stockScoringService.scoreStock('AAPL');
console.log(`${result.ticker}: ${result.aggregateScore}/100 (${result.label})`);

// Analyze multiple stocks
const results = await stockScoringService.scoreMultipleStocks(['AAPL', 'TSLA', 'MSFT']);
```

### Using Individual Scoring Modules

```typescript
import { scoreFundamentals } from './services/fundamentalsScoring';
import { scoreTechnicals } from './services/technicalsScoring';
import { scoreSentiment } from './services/sentimentScoring';

// Score individual pillars
const fundamentals = scoreFundamentals(fundamentalData);
const technicals = scoreTechnicals(technicalData);
const sentiment = scoreSentiment(sentimentData);
```

### React Component

```tsx
import { StockScoreCard } from './components/StockScoreCard';

function App() {
  return <StockScoreCard />;
}
```

## Scoring Model

### Final Score Calculation
- **Fundamentals**: 50% weight
- **Technicals**: 30% weight  
- **Sentiment**: 20% weight

### Score Labels
- **80-100**: Strong Buy
- **65-79**: Buy
- **45-64**: Hold
- **30-44**: Sell
- **<30**: Strong Sell

### Flags
- **HighVolatility**: ATR > 4% of price
- **HighLeverage**: Debt-to-equity > 2.0
- **NegativeEarnings**: P/E ≤ 0
- **DataGaps**: >40% of metrics missing
- **SentimentDivergence**: >25 point difference between 7d and 30d sentiment

## Alpha Vantage API

### Required Endpoints
- `OVERVIEW`: Company fundamentals
- `INCOME_STATEMENT`: Annual income statements
- `BALANCE_SHEET`: Annual balance sheets  
- `CASH_FLOW`: Annual cash flow statements
- `TIME_SERIES_DAILY_ADJUSTED`: Daily price data
- `SMA`: Simple moving averages (50, 200)
- `RSI`: Relative strength index
- `MACD`: Moving average convergence divergence
- `ATR`: Average true range
- `NEWS_SENTIMENT`: News and sentiment data

### Rate Limiting
- 5 requests per minute (free tier)
- 12-second delays between requests
- 5-minute response caching
- Automatic retry with exponential backoff

## Data Sources

Currently supports **Alpha Vantage** only. Future versions may include:
- Yahoo Finance
- IEX Cloud
- Quandl
- Custom data feeds

## Example Output

```json
{
  "ticker": "AAPL",
  "asOf": "2025-08-22T10:30:00.000Z",
  "scores": {
    "fundamentals": {
      "score": 78.5,
      "subscores": {
        "profitability": 85.2,
        "efficiency": 92.1,
        "leverage": 88.7,
        "growth": 65.3,
        "cashStrength": 82.9,
        "valuation": 45.8
      }
    },
    "technicals": {
      "score": 72.3,
      "subscores": {
        "trend": 78.5,
        "momentum": 68.2,
        "macd": 71.8,
        "volatility": 85.1
      }
    },
    "sentiment": {
      "score": 68.7,
      "subscores": {
        "sentiment7d": 72.1,
        "sentiment30d": 66.8
      }
    }
  },
  "aggregateScore": 75.2,
  "label": "Buy",
  "flags": ["HighVolatility"],
  "dataSources": {
    "provider": "AlphaVantage",
    "requests": ["OVERVIEW", "INCOME_STATEMENT", "..."]
  }
}
```

## Integration with n8n

For workflow automation, you can call the scoring service via HTTP:

1. **HTTP Request Node**: POST to your scoring endpoint
2. **Function Node**: Process the response
3. **LLM Node**: Generate summary and recommendations
4. **Sink Node**: Save to database/send notifications

## Error Handling

- **Rate Limit Exceeded**: Automatic retry with backoff
- **API Errors**: Graceful degradation with partial scores
- **Missing Data**: Continues analysis with available data
- **Network Issues**: Caches responses for offline use

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details
