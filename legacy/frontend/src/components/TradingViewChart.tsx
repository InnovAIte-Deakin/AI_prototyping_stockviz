import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewChartProps {
  symbol?: string;
  height?: number;
  width?: string;
}

// Helper function to format symbol for TradingView
const formatSymbolForTradingView = (symbol: string): string => {
  if (!symbol) return 'NASDAQ:AAPL';
  if (symbol.includes(':')) return symbol.toUpperCase();

  // Pre-populated exchange map for common stocks
  const exchangeMap: Record<string, string> = {
    'AAPL': 'NASDAQ', 'GOOGL': 'NASDAQ', 'MSFT': 'NASDAQ', 'AMZN': 'NASDAQ', 'TSLA': 'NASDAQ',
    'META': 'NASDAQ', 'NFLX': 'NASDAQ', 'NVDA': 'NASDAQ', 'AMD': 'NASDAQ', 'INTC': 'NASDAQ',
    'JPM': 'NYSE', 'JNJ': 'NYSE', 'V': 'NYSE', 'PG': 'NYSE', 'UNH': 'NYSE',
    'HD': 'NYSE', 'MA': 'NYSE', 'BAC': 'NYSE', 'XOM': 'NYSE', 'CVX': 'NYSE',
    'RELIANCE': 'BSE', 'TCS': 'BSE', 'HDFCBANK': 'BSE',
    'INFY': 'NSE', 'HDFC': 'NSE', 'ICICIBANK': 'NSE',
  };

  const upperSymbol = symbol.toUpperCase();
  const exchange = exchangeMap[upperSymbol] || 'NASDAQ'; // Default to NASDAQ
  return `${exchange}:${upperSymbol}`;
};

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol = 'AAPL',
  height = 500,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const { resolvedTheme } = useTheme();
  const formattedSymbol = formatSymbolForTradingView(symbol);

  useEffect(() => {
    const createWidget = () => {
      if (!containerRef.current || !window.TradingView) {
        return;
      }

      const widgetOptions = {
        autosize: true,
        symbol: formattedSymbol,
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: resolvedTheme === 'dark' ? 'dark' : 'light',
        style: '1',
        locale: 'en',
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: `tradingview-widget-container-${symbol}`,
      };

      new window.TradingView.widget(widgetOptions);
    };

    const container = containerRef.current;
    if (!container) return;

    // Clear previous widget
    container.innerHTML = '';
    const widgetContainer = document.createElement('div');
    widgetContainer.id = `tradingview-widget-container-${symbol}`;
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';
    container.appendChild(widgetContainer);

    if (scriptRef.current && document.body.contains(scriptRef.current)) {
      // If script is already there, just create the widget
      if (window.TradingView) {
        createWidget();
      } else {
        scriptRef.current.onload = createWidget;
      }
    } else {
      // If script is not there, create and append it
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = createWidget;
      document.body.appendChild(script);
      scriptRef.current = script;
    }

    return () => {
      // Cleanup script on component unmount
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        // To prevent memory leaks, we might not want to remove the script itself,
        // as it could be used by other chart instances.
        // Instead, we just clean the container.
        if (container) {
          container.innerHTML = '';
        }
      }
    };
  }, [symbol, resolvedTheme, formattedSymbol]);

  return (
    <div className="w-full border rounded-md overflow-hidden bg-white dark:bg-gray-900">
      <div className="p-2 border-b bg-gray-50 dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {formattedSymbol} Chart
        </h3>
      </div>
      <div
        ref={containerRef}
        className="w-full"
        style={{ height: `${height}px` }}
      />
    </div>
  );
};

export default memo(TradingViewChart);
