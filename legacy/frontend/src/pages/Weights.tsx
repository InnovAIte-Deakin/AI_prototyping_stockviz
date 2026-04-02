import { useWeightDefaults } from '../lib/queries'
import EnhancedWeightsPanel from '../components/EnhancedWeightsPanel'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Activity, MessageSquare, Lightbulb, BarChart3, Sliders } from 'lucide-react'

export default function Weights() {
  const { data } = useWeightDefaults()
  const [weights, setWeights] = useState({ fundamental: 40, technical: 35, sentiment: 25 })
  const presets = data?.examples ?? []
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analysis Weights</h1>
            <p className="text-muted-foreground mt-2">
              Customize the importance of different analysis factors for your investment strategy
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            <Sliders className="h-3 w-3 mr-1" />
            {weights.fundamental}% / {weights.technical}% / {weights.sentiment}%
          </Badge>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Weights Panel - Takes up 2 columns on XL screens */}
        <div className="xl:col-span-2">
          <EnhancedWeightsPanel 
            initial={weights}
            onChange={setWeights} 
          />
        </div>
        
        {/* Info Sidebar */}
        <div className="space-y-6">
          {/* Analysis Components Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Analysis Components</span>
              </CardTitle>
              <CardDescription>
                Understanding the three pillars of stock analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-5 w-5 mt-1 text-blue-500" />
                  <div>
                    <h4 className="font-medium text-sm">Fundamental Analysis</h4>
                    <p className="text-xs text-muted-foreground">
                      Company financials, ratios, valuation metrics, and intrinsic value
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Activity className="h-5 w-5 mt-1 text-purple-500" />
                  <div>
                    <h4 className="font-medium text-sm">Technical Analysis</h4>
                    <p className="text-xs text-muted-foreground">
                      Price patterns, indicators, trends, and market momentum
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MessageSquare className="h-5 w-5 mt-1 text-green-500" />
                  <div>
                    <h4 className="font-medium text-sm">Sentiment Analysis</h4>
                    <p className="text-xs text-muted-foreground">
                      News sentiment, social media mood, and market psychology
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preset Strategies */}
          {presets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>Preset Strategies</span>
                </CardTitle>
                <CardDescription>
                  Quick start with proven weighting strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {presets.map((p: any, i: number) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => setWeights({ fundamental: p.fundamental, technical: p.technical, sentiment: p.sentiment })}
                    >
                      <div className="text-left">
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          F:{p.fundamental}% T:{p.technical}% S:{p.sentiment}%
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strategy Explanations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Strategy Guide</CardTitle>
              <CardDescription>
                Understanding different weighting approaches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium">Conservative Value</h4>
                  <p className="text-xs text-muted-foreground">
                    High fundamental weight for long-term investors prioritizing financial health
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Technical Trading</h4>
                  <p className="text-xs text-muted-foreground">
                    High technical weight for active traders using chart patterns
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Sentiment Momentum</h4>
                  <p className="text-xs text-muted-foreground">
                    High sentiment weight for news-driven and momentum trading
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Balanced Approach</h4>
                  <p className="text-xs text-muted-foreground">
                    Equal consideration for well-rounded investment decisions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
