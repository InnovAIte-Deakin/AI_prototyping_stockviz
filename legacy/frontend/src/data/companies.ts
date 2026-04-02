export interface Company {
  name: string;
  symbol: string;
  exchange: string;
}

export const NASDAQ_COMPANIES: Company[] = [
  { name: "Apple Inc.", symbol: "AAPL", exchange: "NASDAQ" },
  { name: "Microsoft Corporation", symbol: "MSFT", exchange: "NASDAQ" },
  { name: "Alphabet Inc.", symbol: "GOOGL", exchange: "NASDAQ" },
  { name: "Amazon.com Inc.", symbol: "AMZN", exchange: "NASDAQ" },
  { name: "Meta Platforms Inc.", symbol: "META", exchange: "NASDAQ" },
  { name: "NVIDIA Corporation", symbol: "NVDA", exchange: "NASDAQ" },
  { name: "Tesla Inc.", symbol: "TSLA", exchange: "NASDAQ" },
  { name: "Netflix Inc.", symbol: "NFLX", exchange: "NASDAQ" },
  { name: "Adobe Inc.", symbol: "ADBE", exchange: "NASDAQ" },
  { name: "PayPal Holdings Inc.", symbol: "PYPL", exchange: "NASDAQ" },
  // (truncated) The full upstream file contains many more entries. Add as needed.
];
