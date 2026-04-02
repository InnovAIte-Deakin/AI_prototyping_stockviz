import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart, 
  BarChart3, 
  Target,
  Plus,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

const Portfolio = () => {
  const [showValues, setShowValues] = useState(true);

  const portfolioData = {
    totalValue: 125430.50,
    totalChange: 2340.75,
    totalChangePercent: 1.91,
    dailyChange: 890.25,
    dailyChangePercent: 0.71
  };

  const holdings = [
    { symbol: 'AAPL', name: 'Apple Inc.', shares: 25, avgPrice: 175.50, currentPrice: 185.92, value: 4648.00, change: 260.50, changePercent: 5.93 },
    { symbol: 'MSFT', name: 'Microsoft', shares: 15, avgPrice: 380.20, currentPrice: 415.26, value: 6228.90, change: 525.90, changePercent: 9.22 },
    { symbol: 'GOOGL', name: 'Alphabet', shares: 20, avgPrice: 140.80, currentPrice: 142.56, value: 2851.20, change: 35.20, changePercent: 1.25 },
    { symbol: 'AMZN', name: 'Amazon', shares: 30, avgPrice: 165.40, currentPrice: 178.12, value: 5343.60, change: 381.60, changePercent: 7.69 },
    { symbol: 'NVDA', name: 'NVIDIA', shares: 8, avgPrice: 850.00, currentPrice: 950.02, value: 7600.16, change: 800.16, changePercent: 11.78 }
  ];

  const assetAllocation = [
    { category: 'Technology', percentage: 45, value: 56443.86, color: 'bg-blue-500' },
    { category: 'Healthcare', percentage: 20, value: 25086.10, color: 'bg-green-500' },
    { category: 'Financial', percentage: 15, value: 18814.58, color: 'bg-yellow-500' },
    { category: 'Consumer', percentage: 12, value: 15051.66, color: 'bg-purple-500' },
    { category: 'Other', percentage: 8, value: 10034.44, color: 'bg-red-500' }
  ];

  const performanceData = [
    { period: '1D', change: 890.25, changePercent: 0.71 },
    { period: '1W', change: 2340.75, changePercent: 1.91 },
    { period: '1M', change: 5670.50, changePercent: 4.73 },
    { period: '3M', change: 12340.25, changePercent: 10.89 },
    { period: '1Y', change: 23450.75, changePercent: 23.01 }
  ];

  const getTrendIcon = (change: number) => {
    return change >= 0 ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getTrendColor = (change: number) => {
    return change >= 0 ? 'text-green-500' : 'text-red-500';
  };

  const formatCurrency = (value: number) => {
    return showValues ? new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value) : '••••••';
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
                <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
              Portfolio Management
            </h1>
            
            <p className="max-w-3xl mx-auto text-lg text-muted-foreground leading-relaxed">
              Track your investments, analyze performance, and optimize your portfolio with advanced tools and insights.
            </p>
          </div>
        </div>
      </section>

      {/* Portfolio Overview */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Portfolio Stats */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <span>Portfolio Overview</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowValues(!showValues)}
                  >
                    {showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                    <p className="text-3xl font-bold">{formatCurrency(portfolioData.totalValue)}</p>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(portfolioData.totalChange)}
                      <span className={`text-sm font-medium ${getTrendColor(portfolioData.totalChange)}`}>
                        {formatCurrency(portfolioData.totalChange)} ({portfolioData.totalChangePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Today's Change</p>
                    <p className="text-2xl font-bold">{formatCurrency(portfolioData.dailyChange)}</p>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(portfolioData.dailyChange)}
                      <span className={`text-sm font-medium ${getTrendColor(portfolioData.dailyChange)}`}>
                        {portfolioData.dailyChangePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Chart Placeholder */}
                <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Performance Chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Asset Allocation */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {assetAllocation.map((asset, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{asset.category}</span>
                      <span className="text-sm text-muted-foreground">{asset.percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${asset.color}`} 
                        style={{ width: `${asset.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{formatCurrency(asset.value)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Holdings */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Current Holdings</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Position
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Symbol</th>
                      <th className="text-left p-4 font-medium">Shares</th>
                      <th className="text-left p-4 font-medium">Avg Price</th>
                      <th className="text-left p-4 font-medium">Current Price</th>
                      <th className="text-left p-4 font-medium">Value</th>
                      <th className="text-left p-4 font-medium">Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding) => (
                      <tr key={holding.symbol} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{holding.symbol}</p>
                            <p className="text-sm text-muted-foreground">{holding.name}</p>
                          </div>
                        </td>
                        <td className="p-4">{holding.shares}</td>
                        <td className="p-4">${holding.avgPrice.toFixed(2)}</td>
                        <td className="p-4">${holding.currentPrice.toFixed(2)}</td>
                        <td className="p-4">{formatCurrency(holding.value)}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {getTrendIcon(holding.change)}
                            <div className={`${getTrendColor(holding.change)}`}>
                              <p className="font-medium">{formatCurrency(holding.change)}</p>
                              <p className="text-xs">{holding.changePercent.toFixed(2)}%</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Performance Analysis */}
      <section className="py-8 sm:py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Performance Analysis</h2>
            <p className="text-muted-foreground">Track your portfolio performance across different time periods</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {performanceData.map((period) => (
              <Card key={period.period}>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">{period.period}</p>
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    {getTrendIcon(period.change)}
                    <p className={`font-semibold ${getTrendColor(period.change)}`}>
                      {period.changePercent.toFixed(2)}%
                    </p>
                  </div>
                  <p className={`text-xs ${getTrendColor(period.change)}`}>
                    {formatCurrency(period.change)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Portfolio Tools</h2>
            <p className="text-muted-foreground">Manage and optimize your portfolio with these tools</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h3 className="font-semibold mb-2">Rebalance</h3>
                <p className="text-sm text-muted-foreground mb-4">Optimize your asset allocation</p>
                <Button variant="outline" size="sm" className="w-full">
                  Start Rebalancing
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="font-semibold mb-2">Analytics</h3>
                <p className="text-sm text-muted-foreground mb-4">Deep dive into performance</p>
                <Button variant="outline" size="sm" className="w-full">
                  View Analytics
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <CardContent className="p-6 text-center">
                <Settings className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <h3 className="font-semibold mb-2">Settings</h3>
                <p className="text-sm text-muted-foreground mb-4">Customize your preferences</p>
                <Button variant="outline" size="sm" className="w-full">
                  Manage Settings
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <CardContent className="p-6 text-center">
                <Plus className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                <h3 className="font-semibold mb-2">Add Position</h3>
                <p className="text-sm text-muted-foreground mb-4">Expand your portfolio</p>
                <Button variant="outline" size="sm" className="w-full">
                  Add Stock
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Portfolio;
