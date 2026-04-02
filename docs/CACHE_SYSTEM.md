# Cache & API Tracking System

Database-backed caching and API tracking for StockViz, replacing in-memory implementations for production readiness.

## Overview

The system provides:

- **Persistent cache** - Analysis results cached in Supabase `analysis_cache` table
- **API tracking** - All external API calls logged to `api_call_log` table
- **Automatic cleanup** - Expired entries removed via scheduled script

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  DataSourceManager                                          │
│  ├─ fetchStockData() → checks cache first                   │
│  ├─ searchSymbols() → checks cache first                    │
│  └─ fetchFundamentalData() → checks cache first             │
├─────────────────────────────────────────────────────────────┤
│  HybridCacheService          DatabaseApiTracker             │
│  ├─ get()                    ├─ logAPICall()                │
│  ├─ set()                    └─ getAPIStatistics()          │
│  └─ stats()                                              │
├─────────────────────────────────────────────────────────────┤
│                    Supabase Database                        │
│  ├─ analysis_cache (key-value with TTL)                     │
│  └─ api_call_log (append-only log)                          │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### `analysis_cache`

| Column       | Type        | Description                              |
| ------------ | ----------- | ---------------------------------------- |
| `cache_key`  | text        | Primary key (e.g., `stock_data_AAPL_1M`) |
| `data`       | jsonb       | Cached response data                     |
| `expires_at` | timestamptz | Expiration timestamp                     |
| `created_at` | timestamptz | Creation timestamp                       |

### `api_call_log`

| Column          | Type        | Description                           |
| --------------- | ----------- | ------------------------------------- |
| `id`            | bigint      | Auto-increment ID                     |
| `api_name`      | text        | Provider name (e.g., "Alpha Vantage") |
| `endpoint`      | text        | API endpoint called                   |
| `symbol`        | text        | Stock symbol (optional)               |
| `timeframe`     | text        | Timeframe param (optional)            |
| `success`       | boolean     | Whether call succeeded                |
| `response_time` | integer     | Response time in ms                   |
| `created_at`    | timestamptz | Call timestamp                        |

## Usage

### Cache Service

```javascript
const { createCacheService } = require("./lib/cache");

const cache = createCacheService({ defaultTimeout: 5 * 60 * 1000 });

// Set cache (TTL in milliseconds)
await cache.set("my_key", { data: "value" }, 10 * 60 * 1000);

// Get cache (returns null if expired or missing)
const value = await cache.get("my_key");

// Get stats
const stats = await cache.stats();
// { total: 10, valid: 8, expired: 2, timeout: 300000 }

// Clear all
await cache.clear();
```

### API Tracker

```javascript
const { createApiTracker } = require("./lib/observability");

const tracker = createApiTracker({ maxRecords: 1000 });

// Log API call
await tracker.logAPICall(
  "Alpha Vantage",
  "TIME_SERIES",
  "AAPL",
  "1M",
  true,
  342,
);

// Get statistics
const stats = await tracker.getAPIStatistics();
// {
//   totalCalls: 150,
//   apis: { 'Alpha Vantage': { total: 50, successful: 48, failed: 2, averageResponseTime: 320 } },
//   recentCalls: [...]
// }
```

## Cleanup

### Manual Cleanup

Run the cleanup script to remove expired cache entries and old API logs:

```bash
npm run cache:cleanup
```

### Scheduled Cleanup

For production, schedule the cleanup script to run periodically:

**cron (Linux/macOS):**

```cron
# Run every hour
0 * * * * cd /path/to/stockviz && node --import tsx scripts/cleanup-cache.ts
```

**Task Scheduler (Windows):**
Create a scheduled task running:

```
node --import tsx C:\path\to\stockviz\scripts\cleanup-cache.ts
```

**Docker/Container:**
Use a cron container or Kubernetes CronJob.

## Environment Variables

```bash
# Required for cache/tracking operations
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:64321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Required for cleanup script (bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Cache Keys

Cache keys follow this pattern:

| Pattern                           | Description      | TTL      |
| --------------------------------- | ---------------- | -------- |
| `stock_data_{SYMBOL}_{TIMEFRAME}` | OHLCV data       | 5-15 min |
| `fundamentals_{SYMBOL}`           | Fundamental data | 24 hours |
| `search_{QUERY}`                  | Search results   | 1 hour   |

## Migration from In-Memory

The hybrid wrappers (`lib/cache/index.js` and `lib/observability/index.js`) provide the same interface as the old in-memory services. Update imports:

**Before:**

```javascript
const { createCacheService } = require("./market/cache-service");
const { createApiTracker } = require("./market/api-tracker");
```

**After:**

```javascript
const { createCacheService } = require("./cache");
const { createApiTracker } = require("./observability");
```

## Troubleshooting

### Cache not working

1. Check Supabase connection in `.env.local`
2. Verify `analysis_cache` table exists (run migrations)
3. Check RLS policies allow service_role access

### API tracking not logging

1. Verify `api_call_log` table exists
2. Check RLS policies for insert access
3. Review console logs for errors

### Cleanup script fails

1. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
2. Service role key bypasses RLS - keep it secret
3. Check network connectivity to Supabase

## Performance Considerations

- **Cache reads**: Single row lookup by primary key (fast)
- **Cache writes**: UPSERT operation (efficient)
- **API logging**: Append-only insert (fast)
- **Cleanup**: Batch delete with index on `expires_at`

For high-traffic scenarios:

- Consider adding Redis layer in front of database cache
- Increase cleanup frequency during peak usage
- Monitor `api_call_log` table size
