import EnhancedIndicatorsPanel from '../components/EnhancedIndicatorsPanel'
import { useState } from 'react'
import { useIndicators } from '../lib/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Activity, BarChart3, Target } from 'lucide-react'

export default function Indicators() {
  const [config, setConfig] = useState<Record<string, any>>({})
  const { data } = useIndicators()
  
  // Calculate some stats from the config
  const enabledCount = Object.values(config).filter(cfg => cfg?.enabled !== false).length
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Technical Indicators</h1>
            <p className="text-muted-foreground mt-2">
              Configure technical indicators for advanced stock analysis
            </p>
          </div>
          {enabledCount > 0 && (
            <Badge variant="secondary" className="text-sm">
              {enabledCount} indicators selected
            </Badge>
          )}
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Indicators Panel - Takes up 2 columns on XL screens */}
        <div className="xl:col-span-2">
          <EnhancedIndicatorsPanel onChange={setConfig} />
        </div>
        
        {/* Info Sidebar */}
        <div className="space-y-6">
          {/* Current Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration Summary</CardTitle>
              <CardDescription>
                Current indicator selection overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enabledCount === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No indicators selected. Choose from the panel to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Total Selected:</span>
                    <Badge>{enabledCount}</Badge>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(config)
                      .filter(([_, cfg]) => cfg?.enabled !== false)
                      .slice(0, 5)
                      .map(([name, cfg]) => (
                        <div key={name} className="flex justify-between text-xs">
                          <span className="font-medium">{name}</span>
                          <span className="text-muted-foreground">
                            {Object.keys(cfg || {}).length - 1} params
                          </span>
                        </div>
                      ))
                    }
                    {enabledCount > 5 && (
                      <p className="text-xs text-muted-foreground">
                        ... and {enabledCount - 5} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* About Technical Indicators */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Indicator Categories</span>
              </CardTitle>
              <CardDescription>
                Understanding different types of technical indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-4 w-4 mt-1 text-blue-500" />
                  <div>
                    <h4 className="font-medium text-sm">Trend Indicators</h4>
                    <p className="text-xs text-muted-foreground">
                      Identify direction and strength of price movements
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Activity className="h-4 w-4 mt-1 text-green-500" />
                  <div>
                    <h4 className="font-medium text-sm">Momentum Indicators</h4>
                    <p className="text-xs text-muted-foreground">
                      Show the speed and strength of price changes
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <BarChart3 className="h-4 w-4 mt-1 text-purple-500" />
                  <div>
                    <h4 className="font-medium text-sm">Volatility Indicators</h4>
                    <p className="text-xs text-muted-foreground">
                      Measure price fluctuation intensity
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Target className="h-4 w-4 mt-1 text-orange-500" />
                  <div>
                    <h4 className="font-medium text-sm">Volume Indicators</h4>
                    <p className="text-xs text-muted-foreground">
                      Analyze trading volume patterns
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Pattern Recognition */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pattern Recognition</CardTitle>
              <CardDescription>
                Automated candlestick pattern detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">
                  The system automatically detects common patterns:
                </p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Hammer and Hanging Man</li>
                  <li>• Bullish and Bearish Engulfing</li>
                  <li>• Morning and Evening Star</li>
                  <li>• Doji and Spinning Tops</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3">
                  Patterns include confidence scores for reliability assessment.
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Usage Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Usage Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Start with basic indicators like RSI and MACD</li>
                <li>• Adjust periods based on your trading timeframe</li>
                <li>• Use multiple indicators for confirmation</li>
                <li>• Test different combinations to find your edge</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Configuration Debug (only show if there are indicators selected) */}
      {Object.keys(config).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuration JSON</CardTitle>
            <CardDescription>
              Raw configuration data for debugging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">
              {JSON.stringify(config, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
