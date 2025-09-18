
import StockAnalysis from "@/components/StockAnalysis";
import TradingViewChart from "@/components/TradingViewChart";
import GraphLogo from "@/components/GraphLogo";
import NewsFeed from "@/components/NewsFeed";
import { StockScoreCard } from "@/components/StockScoreCard";
import { useState } from "react";

const NASDAQ_INDICES = [
  { symbol: "IXIC", name: "NASDAQ Composite", exchange: "NASDAQ" },
  { symbol: "NDX", name: "NASDAQ-100", exchange: "NASDAQ" },
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla", exchange: "NASDAQ" }
];

const Index = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>("AAPL");

  // This function will be called when a stock analysis is completed
  const handleAnalysisComplete = (symbol: string) => {
    setSelectedSymbol(symbol);
  };
 
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Centered Logo */}
        <div className="flex flex-col items-center mb-10">
          <GraphLogo />
          <div className="text-center mt-6">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Stock Analysis Dashboard
            </h1>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-400">
              Get detailed analysis and insights for any publicly traded company
            </p>
          </div>
        </div>

        {/* Stock Score Aggregator */}
        <div className="mb-12">
          <StockScoreCard />
        </div>

        <StockAnalysis onAnalysisComplete={handleAnalysisComplete} />
        
        {/* NASDAQ Indices Section */}
        <div className="mt-48">
          <h2 className="text-2xl font-bold text-gray-200 mb-6">NASDAQ Market Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {NASDAQ_INDICES.map((index) => (
              <div key={index.symbol} className="glass-card rounded-lg overflow-hidden hover-lift">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-200">{index.name}</h3>
                  <p className="text-sm text-gray-400">{index.exchange}:{index.symbol}</p>
                </div>
                <TradingViewChart 
                  symbol={index.symbol} 
                  exchange={index.exchange}
                  height={250} 
                />
              </div>
            ))}
          </div>
        </div>

        {/* News Feed Section */}
        <NewsFeed symbol={selectedSymbol} />
        
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>Data provided for informational purposes only. Not financial advice.</p>
          <p className="mt-1">© {new Date().getFullYear()} Stock Analysis Dashboard</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
