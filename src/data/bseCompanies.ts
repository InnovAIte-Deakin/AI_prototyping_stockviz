export interface Company {
  name: string;
  symbol: string;
  exchange: string;
}

export const BSE_COMPANIES: Company[] = [
  // BSE Companies
  { name: "Reliance Industries Limited", symbol: "RELIANCE", exchange: "BSE" },
  { name: "Tata Consultancy Services Limited", symbol: "TCS", exchange: "BSE" },
  { name: "HDFC Bank Limited", symbol: "HDFCBANK", exchange: "BSE" },
  { name: "Infosys Limited", symbol: "INFY", exchange: "BSE" },
  { name: "ICICI Bank Limited", symbol: "ICICIBANK", exchange: "BSE" },
  { name: "Housing Development Finance Corporation", symbol: "HDFC", exchange: "BSE" },
  { name: "ITC Limited", symbol: "ITC", exchange: "BSE" },
  { name: "State Bank of India", symbol: "SBIN", exchange: "BSE" },
  { name: "Bharti Airtel Limited", symbol: "BHARTIARTL", exchange: "BSE" },
  { name: "Kotak Mahindra Bank Limited", symbol: "KOTAKBANK", exchange: "BSE" }
]; 