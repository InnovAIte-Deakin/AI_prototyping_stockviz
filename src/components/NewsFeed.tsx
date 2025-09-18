
import React, { useState, useEffect } from 'react';
import { fetchFinanceNews, NewsItem } from '@/services/yahooFinanceService';
import NewsCard from './NewsCard';
import { Loader, Newspaper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NewsFeedProps {
  symbol?: string;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ symbol = 'AAPL' }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadNews = async (tickerSymbol: string) => {
    if (!tickerSymbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const newsData = await fetchFinanceNews(tickerSymbol);
      setNews(newsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch news';
      setError(errorMessage);
      toast({
        title: "Error loading news",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews(symbol);
  }, [symbol]);

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <Newspaper className="text-finance-primary" />
        <h2 className="text-2xl font-bold text-gray-900">Latest Finance News</h2>
        {symbol && <span className="text-lg text-finance-accent font-semibold ml-2">for {symbol}</span>}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="w-10 h-10 text-finance-primary animate-spin mb-4" />
          <p className="text-gray-600">Loading latest news...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">Unable to load news: {error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.length > 0 ? (
            news.map((item, index) => (
              <NewsCard key={`${item.title}-${index}`} news={item} />
            ))
          ) : (
            <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No news available for {symbol}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
