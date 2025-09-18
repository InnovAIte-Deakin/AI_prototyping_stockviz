
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { NewsItem } from "@/services/yahooFinanceService";

interface NewsCardProps {
  news: NewsItem;
}

const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  // Format publication date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold line-clamp-2">{news.title}</CardTitle>
        <CardDescription className="text-xs">{formatDate(news.pubDate)} • {news.source}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-600 line-clamp-3">{news.summary}</p>
      </CardContent>
      <CardFooter className="pt-2 border-t">
        <a href={news.link} target="_blank" rel="noopener noreferrer" className="w-full">
          <Button variant="outline" className="w-full text-finance-primary flex items-center gap-2">
            Read Full Article
            <ExternalLink size={16} />
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
};

export default NewsCard;
