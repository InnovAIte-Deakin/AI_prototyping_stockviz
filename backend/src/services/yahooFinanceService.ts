export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  summary: string;
}

export const fetchFinanceNews = async (symbol: string): Promise<NewsItem[]> => {
  try {
    // Using a free RSS to JSON converter API for Yahoo Finance news
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://finance.yahoo.com/rss/headline?s=${symbol}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }
    
    const data = await response.json();
    
    if (data.status !== 'ok') {
      throw new Error(data.message || 'Error fetching news data');
    }
    
    return data.items.map((item: any) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: item.source || 'Yahoo Finance',
      summary: item.description?.replace(/<[^>]*>?/gm, '') || '' // Strip HTML tags from summary
    }));
  } catch (error) {
    console.error('Error fetching finance news:', error);
    throw error;
  }
};
