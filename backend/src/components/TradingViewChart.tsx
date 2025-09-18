
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewChartProps {
  symbol: string;
  exchange?: string;
  height?: number;
}

const TradingViewChart = ({ symbol, exchange = 'NASDAQ', height = 300 }: TradingViewChartProps) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create the script element for TradingView Widget
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (container.current && window.TradingView) {
        // Format the symbol correctly with exchange
        const formattedSymbol = symbol.includes(':') ? symbol : `${exchange}:${symbol}`;
        
        console.log('TradingView Widget initializing with symbol:', formattedSymbol);
        
        new window.TradingView.widget({
          width: '100%',
          height: height,
          symbol: formattedSymbol,
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#1e293b', // Tailwind slate-800
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: container.current.id,
          hide_top_toolbar: false,
          hide_side_toolbar: false,
          withdateranges: true,
          studies: ['RSI@tv-basicstudies', 'MASimple@tv-basicstudies'],
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [symbol, exchange, height]);

  return (
    <div 
      id={`tradingview_${symbol.replace(/[^\w]/g, '_')}`} 
      ref={container} 
      className="w-full rounded-lg overflow-hidden"
      style={{ height: `${height}px` }} 
    />
  );
};

export default TradingViewChart;
