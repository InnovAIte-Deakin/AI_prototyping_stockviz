
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchStockAnalysis } from "@/services/stockService";
import { Loader, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ReactMarkdown from 'react-markdown';
import CompanySearch from "./CompanySearch";
import { Company } from "@/data/companies";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import TradingViewChart from "./TradingViewChart";

interface StockAnalysisProps {
  onAnalysisComplete?: (symbol: string) => void;
}

const StockAnalysis = ({ onAnalysisComplete }: StockAnalysisProps) => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisText, setAnalysisText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isMockData, setIsMockData] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [retryCount, setRetryCount] = useState<number>(0);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCompany) {
      toast({
        title: "Error",
        description: "Please select a company",
        variant: "destructive",
      });
      return;
    }

    await performAnalysis();
  };

  const performAnalysis = async () => {
    if (!selectedCompany) return;

    // Reset states
    setIsLoading(true);
    setAnalysisText("");
    setErrorMessage("");
    setIsMockData(false);
    setLoadingMessage("Connecting to analysis service...");

    // Set up progressive loading messages
    const loadingMessages = [
      "Connecting to analysis service...",
      "Fetching market data...",
      "Processing technical indicators...",
      "This is taking longer than expected...",
      "Still working on your analysis...",
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      if (messageIndex < loadingMessages.length - 1) {
        messageIndex++;
        setLoadingMessage(loadingMessages[messageIndex]);
      }
    }, 10000); // Update every 10 seconds

    try {
      console.log("Fetching stock analysis for:", selectedCompany);
      
      const sanitizedSymbol = selectedCompany.symbol.replace(/[^\w.-]/g, '');
      console.log("Using sanitized symbol:", sanitizedSymbol);
      
      const data = await fetchStockAnalysis(sanitizedSymbol, selectedCompany.exchange);
      console.log("Response received:", data);
      
      if (data.url.includes("placeholder-chart.com/error")) {
        setErrorMessage("");
        setAnalysisText(data.text);
        setIsMockData(true);
        
        toast({
          title: "Service Temporarily Unavailable",
          description: "Showing fallback information. You can try again or check the live chart.",
          variant: "destructive",
        });
      } else {
        setAnalysisText(data.text);
        setIsMockData(false);
        setRetryCount(0); // Reset retry count on success
        
        toast({
          title: "Analysis Complete",
          description: `Analysis for ${selectedCompany.exchange}:${sanitizedSymbol} loaded successfully`,
        });
      }
      
      if (onAnalysisComplete) {
        onAnalysisComplete(sanitizedSymbol);
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch analysis';
      setErrorMessage(errorMsg);
      setIsMockData(true);
      
      toast({
        title: "Analysis Failed",
        description: "The service is currently unavailable. You can try again or view the live chart.",
        variant: "destructive",
      });
      
      console.error("Error fetching stock analysis:", error);
    } finally {
      setIsLoading(false);
      clearInterval(messageInterval);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    performAnalysis();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="glass-card border-t-4 border-t-blue-600">
        <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900">
          <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            Stock Analysis
          </CardTitle>
          <CardDescription className="text-gray-300">
            Search and analyze any publicly traded company
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="company-search" className="block text-sm font-medium text-gray-300 mb-1">
                Search Company
              </label>
              <CompanySearch
                onSelect={setSelectedCompany}
                placeholder="Type company name or symbol..."
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isLoading || !selectedCompany}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" /> 
                    Analyzing...
                  </>
                ) : (
                  "Analyze"
                )}
              </Button>
              
              {(isMockData || errorMessage) && selectedCompany && (
                <Button 
                  type="button"
                  onClick={handleRetry}
                  disabled={isLoading}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>
          </form>

          {/* Loading state */}
          {isLoading && (
            <div className="mt-6 flex flex-col items-center justify-center py-8">
              <Loader className="w-12 h-12 text-blue-400 animate-spin mb-4" />
              <p className="text-gray-400 text-center">{loadingMessage}</p>
              {retryCount > 0 && (
                <p className="text-gray-500 text-sm mt-2">Retry attempt: {retryCount}</p>
              )}
            </div>
          )}

          {/* Error state */}
          {errorMessage && (
            <div className="mt-6 bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-400">{errorMessage}</p>
            </div>
          )}

          {/* Mock data notice */}
          {!isLoading && isMockData && (
            <Alert className="mt-6 bg-amber-900/30 border-amber-500">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertTitle>Service Notice</AlertTitle>
              <AlertDescription>
                Our analysis service is temporarily unavailable. The information below is a fallback message. The live chart above shows real market data.
              </AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {!isLoading && !errorMessage && analysisText && selectedCompany && (
            <div className="mt-6 space-y-6">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 border-b border-gray-700 pb-2">
                Technical Analysis for <span className="font-bold">{selectedCompany.exchange}:{selectedCompany.symbol}</span>
              </h2>
              
              {/* Live TradingView Chart */}
              <div className="border border-gray-700 rounded-lg overflow-hidden shadow-sm bg-gray-800/50 p-2">
                <TradingViewChart 
                  symbol={selectedCompany.symbol} 
                  exchange={selectedCompany.exchange}
                  height={400} 
                />
              </div>
              
              {/* Analysis text with markdown rendering */}
              {analysisText && (
                <div className="bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-700">
                  <div className="prose prose-invert max-w-none">  
                    <ReactMarkdown>{analysisText}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockAnalysis;
