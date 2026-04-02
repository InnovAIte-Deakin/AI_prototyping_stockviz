export interface Company {
  name: string;
  symbol: string;
  exchange: string;
}

export const NSE_COMPANIES: Company[] = [
  // NSE Companies
  { name: "Reliance Industries Limited", symbol: "RELIANCE", exchange: "NSE" },
  { name: "Tata Consultancy Services Limited", symbol: "TCS", exchange: "NSE" },
  { name: "HDFC Bank Limited", symbol: "HDFCBANK", exchange: "NSE" },
  { name: "Infosys Limited", symbol: "INFY", exchange: "NSE" },
  { name: "ICICI Bank Limited", symbol: "ICICIBANK", exchange: "NSE" },
  { name: "Housing Development Finance Corporation", symbol: "HDFC", exchange: "NSE" },
  { name: "ITC Limited", symbol: "ITC", exchange: "NSE" },
  { name: "State Bank of India", symbol: "SBIN", exchange: "NSE" },
  { name: "Bharti Airtel Limited", symbol: "BHARTIARTL", exchange: "NSE" },
  { name: "Kotak Mahindra Bank Limited", symbol: "KOTAKBANK", exchange: "NSE" }
]; 