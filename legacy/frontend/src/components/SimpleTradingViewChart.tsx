import { useTheme } from '../contexts/ThemeContext'

interface SimpleTradingViewChartProps {
  symbol?: string
  height?: number
}

// Helper function to format symbol for TradingView
const formatSymbolForTradingView = (symbol: string): string => {
  if (!symbol) return 'NASDAQ:AAPL'
  
  // If symbol already has exchange prefix, return as is
  if (symbol.includes(':')) return symbol
  
  // Common exchange mappings for popular symbols
  const exchangeMap: Record<string, string> = {
    // Major US stocks
    'AAPL': 'NASDAQ:AAPL',
    'GOOGL': 'NASDAQ:GOOGL',
    'MSFT': 'NASDAQ:MSFT',
    'AMZN': 'NASDAQ:AMZN',
    'TSLA': 'NASDAQ:TSLA',
    'META': 'NASDAQ:META',
    'NFLX': 'NASDAQ:NFLX',
    'NVDA': 'NASDAQ:NVDA',
    'AMD': 'NASDAQ:AMD',
    // Major NYSE stocks
    'JPM': 'NYSE:JPM',
    'JNJ': 'NYSE:JNJ',
    'V': 'NYSE:V',
    'PG': 'NYSE:PG',
    'UNH': 'NYSE:UNH',
    'HD': 'NYSE:HD',
    'MA': 'NYSE:MA',
    'BAC': 'NYSE:BAC',
    'XOM': 'NYSE:XOM',
    'CVX': 'NYSE:CVX'
  }
  
  // Check if we have a specific mapping
  const upperSymbol = symbol.toUpperCase()
  if (exchangeMap[upperSymbol]) {
    return exchangeMap[upperSymbol]
  }
  
  // Default to NASDAQ for unknown symbols (most tech stocks)
  return `NASDAQ:${upperSymbol}`
}

export default function SimpleTradingViewChart({ 
  symbol = 'AAPL', 
  height = 400 
}: SimpleTradingViewChartProps) {
  const { resolvedTheme } = useTheme()
  const formattedSymbol = formatSymbolForTradingView(symbol)
  
  // Create TradingView iframe URL
  const tradingViewUrl = `https://www.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${encodeURIComponent(formattedSymbol)}&interval=1D&hidesidetoolbar=0&symboledit=0&saveimage=0&toolbarbg=${resolvedTheme === 'dark' ? '1f2937' : 'f8fafc'}&studies=%5B%5D&theme=${resolvedTheme}&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=localhost&utm_medium=widget_new&utm_campaign=chart&utm_term=${encodeURIComponent(formattedSymbol)}`

  return (
    <div className="w-full border rounded-md overflow-hidden bg-white dark:bg-gray-900">
      <div className="p-2 border-b bg-gray-50 dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {formattedSymbol} Chart
        </h3>
      </div>
      <div style={{ height: `${height}px` }}>
        <iframe
          src={tradingViewUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allowTransparency={true}
          scrolling="no"
          style={{ border: 'none' }}
          title={`${formattedSymbol} TradingView Chart`}
        />
      </div>
    </div>
  )
}
