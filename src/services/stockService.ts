

export type StockAnalysisResponse = {
  url: string;
  text: string;
  symbol: string;
};

// Function to clean the analysis text by replacing <br> tags with newlines
const cleanAnalysisText = (text: string): string => {
  return text.replace(/<br\s*\/?>/gi, '\n');
};

// API configuration
const API_BASE_URL = import.meta.env.PROD
  ? 'https://egiiqbgumgltatfljbcs.supabase.co/functions/v1/stock-analysis-proxy'
  : '/api/stock-analysis';

// Direct API URL as fallback - updated with new endpoint
const DIRECT_API_URL = 'https://kingaakash.app.n8n.cloud/webhook/stock-chart-analysis';

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 2000; // 2 seconds

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchStockAnalysis = async (symbol: string, exchange: string): Promise<StockAnalysisResponse> => {
  const sanitizedSymbol = symbol.trim().replace(/[^\w.-]/g, '');
  const sanitizedExchange = exchange.trim().replace(/[^\w.-]/g, '');
  
  console.log('Fetching stock analysis for:', { symbol: sanitizedSymbol, exchange: sanitizedExchange });
  console.log('Environment:', import.meta.env.PROD ? 'Production' : 'Development');
  
  // Try with retries
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${MAX_RETRIES} - Using API URL:`, API_BASE_URL);
      
      const payload = JSON.stringify({
        symbol: sanitizedSymbol,
        exchange: sanitizedExchange
      });
      
      console.log('Sending payload:', payload);
      
      // Try primary API with timeout
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: payload,
        signal: AbortSignal.timeout(45000) // Reduced to 45 seconds to allow for retries
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);
      
      // Check if response has url property and it's not an error URL
      if (!data.url || (data.url && data.url.includes("placeholder-chart.com/error"))) {
        console.warn('Received error response from API, trying direct API call');
        return await tryDirectApiCall(sanitizedSymbol, sanitizedExchange);
      }
      
      return {
        url: data.url || "https://placeholder-chart.com/default",
        text: cleanAnalysisText(data.text || ""),
        symbol: data.symbol || sanitizedSymbol
      };
      
    } catch (error) {
      console.error(`Attempt ${attempt}/${MAX_RETRIES} failed:`, error);
      
      // If it's the last attempt, handle the error
      if (attempt === MAX_RETRIES) {
        // Handle SSL certificate errors specifically
        if (error instanceof TypeError && (
          error.message.includes('Failed to fetch') || 
          error.message.includes('ERR_CERT_AUTHORITY_INVALID') ||
          error.message.includes('SSL')
        )) {
          console.error('SSL/Network error detected. Attempting direct API call as fallback.');
          
          try {
            return await tryDirectApiCall(sanitizedSymbol, sanitizedExchange);
          } catch (directError) {
            console.error('Direct API call also failed:', directError);
            return provideMockAnalysis(sanitizedSymbol, 'API connectivity issues');
          }
        }
        
        // Handle timeout errors
        if (error instanceof DOMException && error.name === 'TimeoutError') {
          console.error('Request timed out after multiple attempts. Providing mock analysis.');
          return provideMockAnalysis(sanitizedSymbol, 'Request timeout');
        }
        
        // For any other error, provide mock analysis
        return provideMockAnalysis(sanitizedSymbol, error instanceof Error ? error.message : 'Unknown error');
      }
      
      // Wait before retrying (except for the last attempt)
      if (attempt < MAX_RETRIES) {
        console.log(`Waiting ${RETRY_DELAY}ms before retry...`);
        await sleep(RETRY_DELAY);
      }
    }
  }
  
  // This should never be reached, but just in case
  return provideMockAnalysis(sanitizedSymbol, 'Maximum retries exceeded');
};

// Try a direct API call as a fallback mechanism
const tryDirectApiCall = async (symbol: string, exchange: string): Promise<StockAnalysisResponse> => {
  console.log('Attempting direct API call to:', DIRECT_API_URL);
  
  try {
    const directResponse = await fetch(DIRECT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'StockAnalysisClient/1.0'
      },
      body: JSON.stringify({ symbol, exchange }),
      signal: AbortSignal.timeout(30000) // Shorter timeout for direct API
    });
    
    console.log('Direct API response status:', directResponse.status);
    
    if (!directResponse.ok) {
      throw new Error(`Direct API call failed with status ${directResponse.status}`);
    }
    
    const directData = await directResponse.json();
    console.log('Direct API response data:', directData);
    
    // Handle response that may not have url property
    return {
      url: directData.url || "https://placeholder-chart.com/analysis",
      text: cleanAnalysisText(directData.text || ""),
      symbol: directData.symbol || symbol
    };
  } catch (error) {
    console.error('Error in direct API call:', error);
    throw error;
  }
};

// Provide mock analysis data for better user experience when APIs fail
const provideMockAnalysis = (symbol: string, reason: string): StockAnalysisResponse => {
  console.log('Providing mock analysis for symbol:', symbol, 'Reason:', reason);
  
  return {
    url: "https://placeholder-chart.com/error",
    text: `# Technical Analysis for ${symbol}\n\n## Service Temporarily Unavailable\n\nWe're currently experiencing issues with our analysis service.\n\n**Issue**: ${reason}\n\n### What's Happening\n\n- Our external analysis API is not responding\n- This could be due to high traffic or temporary maintenance\n- We're working to resolve this issue\n\n### What You Can Do\n\n1. **Try again in a few minutes** - The service may come back online\n2. **Check another stock** - The issue might be symbol-specific\n3. **Use the live chart above** - You can still view real-time price data\n4. **Contact support** if the issue persists\n\n### Alternative Analysis\n\nWhile our automated analysis is unavailable, you can:\n- Review the live TradingView chart above\n- Check recent news and market trends\n- Look at volume and price patterns\n- Consider fundamental analysis factors\n\n*This is a temporary fallback message. Our full analysis service will return shortly.*`,
    symbol: symbol
  };
};
