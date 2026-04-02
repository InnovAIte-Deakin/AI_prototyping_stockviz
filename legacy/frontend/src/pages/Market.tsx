import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Globe, 
  BookOpen, 
  Play, 
  Maximize2,
  Info,
  Lightbulb,
  Target,
  Activity
} from 'lucide-react';

const Market = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [selectedChart, setSelectedChart] = useState('NASDAQ');

  const marketIndices = [
    { symbol: 'NASDAQ', name: 'NASDAQ Composite', value: '16,742.38', change: '+0.85%', trend: 'up', volume: '2.1B' },
    { symbol: 'S&P500', name: 'S&P 500', value: '5,234.18', change: '+0.32%', trend: 'up', volume: '3.8B' },
    { symbol: 'DOW', name: 'Dow Jones', value: '39,807.37', change: '-0.12%', trend: 'down', volume: '1.2B' },
    { symbol: 'RUSSELL', name: 'Russell 2000', value: '2,108.05', change: '+1.23%', trend: 'up', volume: '890M' },
  ];

  const popularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: '185.92', change: '+1.2%', trend: 'up' },
    { symbol: 'MSFT', name: 'Microsoft', price: '415.26', change: '+0.8%', trend: 'up' },
    { symbol: 'GOOGL', name: 'Alphabet', price: '142.56', change: '-0.3%', trend: 'down' },
    { symbol: 'AMZN', name: 'Amazon', price: '178.12', change: '+2.1%', trend: 'up' },
    { symbol: 'META', name: 'Meta', price: '485.58', change: '+1.5%', trend: 'up' },
    { symbol: 'NVDA', name: 'NVIDIA', price: '950.02', change: '+3.2%', trend: 'up' },
  ];

  const educationalContent = [
    {
      title: "Understanding Technical Analysis",
      description: "Learn how to read charts and identify patterns",
      icon: BarChart3,
      difficulty: "Beginner",
      duration: "15 min"
    },
    {
      title: "Market Indicators Explained",
      description: "RSI, MACD, Moving Averages and more",
      icon: Activity,
      difficulty: "Intermediate",
      duration: "20 min"
    },
    {
      title: "Risk Management Strategies",
      description: "Protect your investments with proper risk management",
      icon: Target,
      difficulty: "Advanced",
      duration: "25 min"
    }
  ];

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-lg">
                <Globe className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
              StockViz Market Overview
            </h1>
            
            <p className="max-w-3xl mx-auto text-lg text-muted-foreground leading-relaxed">
              Explore real-time market data, interactive charts, and educational content. 
              Learn while you analyze with our comprehensive market tools.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
              {marketIndices.map((index) => (
                <Card key={index.symbol} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {index.symbol}
                      </Badge>
                      {getTrendIcon(index.trend)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-bold">{index.value}</p>
                      <p className={`text-sm font-medium ${getTrendColor(index.trend)}`}>
                        {index.change}
                      </p>
                      <p className="text-xs text-muted-foreground">Vol: {index.volume}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Charts Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Interactive Market Charts
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore different timeframes and instruments. Click on any chart to expand and analyze in detail.
            </p>
          </div>

          {/* Chart Controls */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Timeframe:</span>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1D">1D</SelectItem>
                  <SelectItem value="1W">1W</SelectItem>
                  <SelectItem value="1M">1M</SelectItem>
                  <SelectItem value="3M">3M</SelectItem>
                  <SelectItem value="1Y">1Y</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Chart:</span>
              <Select value={selectedChart} onValueChange={setSelectedChart}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NASDAQ">NASDAQ</SelectItem>
                  <SelectItem value="S&P500">S&P 500</SelectItem>
                  <SelectItem value="DOW">Dow Jones</SelectItem>
                  <SelectItem value="AAPL">Apple</SelectItem>
                  <SelectItem value="MSFT">Microsoft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {marketIndices.slice(0, 4).map((index) => (
              <Card key={index.symbol} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">{index.name}</CardTitle>
                      <CardDescription className="text-muted-foreground">{index.symbol}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {index.change}
                      </Badge>
                      <Maximize2 className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Chart placeholder</p>
                      <p className="text-xs text-muted-foreground">Click to expand</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Stocks Section */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Popular Stocks
            </h2>
            <p className="text-muted-foreground">
              Track the most actively traded stocks with real-time data
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularStocks.map((stock) => (
              <Card key={stock.symbol} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{stock.name}</h3>
                      <p className="text-sm text-muted-foreground">{stock.symbol}</p>
                    </div>
                    {getTrendIcon(stock.trend)}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-foreground">${stock.price}</span>
                      <Badge className={getTrendColor(stock.trend)}>
                        {stock.change}
                      </Badge>
                    </div>
                    
                    <div className="h-32 bg-muted/50 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    
                    <Button className="w-full" variant="outline">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analyze
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Educational Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Learn & Explore
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enhance your trading knowledge with our educational content and interactive lessons
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {educationalContent.map((content, index) => {
              const Icon = content.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-center mb-2">{content.title}</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">{content.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <Badge variant="outline" className="text-xs">
                        {content.difficulty}
                      </Badge>
                      <span>{content.duration}</span>
                    </div>
                    
                    <Button className="w-full" variant="outline">
                      <Play className="mr-2 h-4 w-4" />
                      Start Learning
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Market Insights */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Market Insights
            </h2>
            <p className="text-muted-foreground">
              Stay informed with the latest market analysis and trends
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <span>Today's Market Sentiment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Bullish</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '65%' }} />
                    </div>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Neutral</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: '25%' }} />
                    </div>
                    <span className="text-sm font-medium">25%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Bearish</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: '10%' }} />
                    </div>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  <span>Key Market Events</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { time: "9:30 AM", event: "Market Open", status: "completed" },
                  { time: "10:00 AM", event: "Fed Chair Speech", status: "upcoming" },
                  { time: "2:00 PM", event: "Earnings: AAPL", status: "upcoming" },
                  { time: "4:00 PM", event: "Market Close", status: "upcoming" }
                ].map((event, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      event.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-sm font-medium">{event.time}</span>
                    <span className="text-sm text-muted-foreground flex-1">{event.event}</span>
                    <Badge variant="outline" className="text-xs">
                      {event.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Market;
