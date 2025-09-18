export interface Company {
  name: string;
  symbol: string;
  exchange: string;
}

export const NYSE_COMPANIES: Company[] = [
  // NYSE Companies
  { name: "JPMorgan Chase & Co.", symbol: "JPM", exchange: "NYSE" },
  { name: "Bank of America Corporation", symbol: "BAC", exchange: "NYSE" },
  { name: "Wells Fargo & Company", symbol: "WFC", exchange: "NYSE" },
  { name: "The Coca-Cola Company", symbol: "KO", exchange: "NYSE" },
  { name: "Johnson & Johnson", symbol: "JNJ", exchange: "NYSE" },
  { name: "Procter & Gamble Co.", symbol: "PG", exchange: "NYSE" },
  { name: "Verizon Communications Inc.", symbol: "VZ", exchange: "NYSE" },
  { name: "AT&T Inc.", symbol: "T", exchange: "NYSE" },
  { name: "Exxon Mobil Corporation", symbol: "XOM", exchange: "NYSE" },
  { name: "Chevron Corporation", symbol: "CVX", exchange: "NYSE" }
]; 