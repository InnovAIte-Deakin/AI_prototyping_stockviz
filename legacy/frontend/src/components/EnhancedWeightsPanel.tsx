import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, BarChart, MessageSquare, Info, RotateCcw, Lightbulb } from 'lucide-react'

type Props = {
  initial?: { fundamental?: number, technical?: number, sentiment?: number }
  onChange?: (w: { fundamental: number, technical: number, sentiment: number }) => void
}

export default function EnhancedWeightsPanel({ initial, onChange }: Props) {
  const [fundamental, setF] = useState(initial?.fundamental ?? 40)
  const [technical, setT] = useState(initial?.technical ?? 35)
  const [sentiment, setS] = useState(initial?.sentiment ?? 25)

  useEffect(() => {
    const total = fundamental + technical + sentiment
    if (onChange) onChange({ 
      fundamental: Math.round(fundamental/total*100), 
      technical: Math.round(technical/total*100), 
      sentiment: Math.round(sentiment/total*100) 
    })
  }, [fundamental, technical, sentiment, onChange])

  // Determine weighting style
  const getWeightingStyle = () => {
    const max = Math.max(fundamental, technical, sentiment);
    if (fundamental === max && max > 40) return {
      style: 'Fundamental Value Investing',
      description: 'Focus on company fundamentals, financial health, and intrinsic value',
      icon: TrendingUp,
      color: 'text-blue-600'
    };
    if (technical === max && max > 40) return {
      style: 'Technical Trading Signals',
      description: 'Emphasis on price patterns, indicators, and market momentum',
      icon: BarChart,
      color: 'text-purple-600'
    };
    if (sentiment === max && max > 40) return {
      style: 'Market Sentiment & Psychology',
      description: 'Follow market mood, news impact, and investor behavior',
      icon: MessageSquare,
      color: 'text-green-600'
    };
    return {
      style: 'Balanced Multi-Factor Approach',
      description: 'Equal consideration of fundamentals, technicals, and sentiment',
      icon: Info,
      color: 'text-orange-600'
    };
  };

  // Suggest alternative weight combinations
  const suggestAlternatives = () => {
    const alternatives = [];
    
    // Conservative approach
    if (fundamental < 50) {
      alternatives.push({
        name: 'Conservative Value',
        weights: { fundamental: 60, technical: 25, sentiment: 15 },
        description: 'Focus on company fundamentals and intrinsic value',
        icon: TrendingUp,
        color: 'border-blue-200 hover:bg-blue-50'
      });
    }
    
    // Technical trading approach
    if (technical < 50) {
      alternatives.push({
        name: 'Technical Trader',
        weights: { fundamental: 20, technical: 60, sentiment: 20 },
        description: 'Emphasis on price action and technical indicators',
        icon: BarChart,
        color: 'border-purple-200 hover:bg-purple-50'
      });
    }
    
    // Sentiment-driven approach
    if (sentiment < 40) {
      alternatives.push({
        name: 'Sentiment Momentum',
        weights: { fundamental: 25, technical: 30, sentiment: 45 },
        description: 'Follow market psychology and news sentiment',
        icon: MessageSquare,
        color: 'border-green-200 hover:bg-green-50'
      });
    }
    
    return alternatives;
  };

  const resetWeights = () => {
    setF(40);
    setT(35);
    setS(25);
  };

  const weightingStyle = getWeightingStyle();
  const alternatives = suggestAlternatives();
  const StyleIcon = weightingStyle.icon;

  // Calculate normalized percentages for display
  const total = fundamental + technical + sentiment;
  const normalizedWeights = {
    fundamental: Math.round(fundamental/total*100),
    technical: Math.round(technical/total*100),
    sentiment: Math.round(sentiment/total*100)
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center space-x-2">
              <span>Analysis Weights</span>
            </CardTitle>
            <CardDescription>
              Customize the importance of different analysis factors
            </CardDescription>
          </div>
          
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Adjust weights to match your investment strategy</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetWeights}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset to balanced weights (40/35/25)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Weight Sliders */}
        <div className="space-y-5">
          {[
            { 
              label: 'Fundamental Analysis', 
              value: fundamental, 
              set: setF, 
              icon: TrendingUp, 
              color: 'text-blue-600',
              bgColor: 'bg-blue-100',
              description: 'Financial health, earnings, ratios'
            },
            { 
              label: 'Technical Analysis', 
              value: technical, 
              set: setT, 
              icon: BarChart, 
              color: 'text-purple-600',
              bgColor: 'bg-purple-100',
              description: 'Price patterns, indicators, trends'
            },
            { 
              label: 'Sentiment Analysis', 
              value: sentiment, 
              set: setS, 
              icon: MessageSquare, 
              color: 'text-green-600',
              bgColor: 'bg-green-100',
              description: 'News, social media, market mood'
            },
          ].map((row) => {
            const Icon = row.icon;
            const normalizedValue = Math.round(row.value/total*100);
            
            return (
              <div key={row.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-5 w-5 ${row.color}`} />
                    <div>
                      <label className="text-sm font-medium">{row.label}</label>
                      <div className="text-xs text-muted-foreground">{row.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg font-bold ${row.color}`}>{normalizedValue}%</span>
                    <div className={`text-xs px-2 py-1 rounded ${row.bgColor} ${row.color}`}>
                      {row.value}
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <input 
                    type="range" 
                    min={0} 
                    max={100} 
                    value={row.value} 
                    onChange={(e) => row.set(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, ${row.color.replace('text-', '')} 0%, ${row.color.replace('text-', '')} ${row.value}%, #e5e7eb ${row.value}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
              </div>
            );
          })}
          
          <div className="text-xs text-muted-foreground bg-accent/20 p-3 rounded-lg border">
            <Info className="h-4 w-4 inline mr-1" />
            Weights are automatically normalized to 100% when analysis is performed.
          </div>
        </div>

        {/* Current Strategy Display */}
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <StyleIcon className={`h-6 w-6 mt-1 ${weightingStyle.color}`} />
              <div className="flex-1">
                <div className="font-semibold text-sm mb-1">{weightingStyle.style}</div>
                <div className="text-sm text-muted-foreground mb-3">
                  {weightingStyle.description}
                </div>
                <div className="flex space-x-4 text-xs">
                  <span className="flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-blue-600" />
                    Fundamental: {normalizedWeights.fundamental}%
                  </span>
                  <span className="flex items-center">
                    <BarChart className="h-3 w-3 mr-1 text-purple-600" />
                    Technical: {normalizedWeights.technical}%
                  </span>
                  <span className="flex items-center">
                    <MessageSquare className="h-3 w-3 mr-1 text-green-600" />
                    Sentiment: {normalizedWeights.sentiment}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Suggestions */}
        {alternatives.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">Suggested Alternatives</span>
            </div>
            <div className="space-y-2">
              {alternatives.map((alt, index) => {
                const AltIcon = alt.icon;
                return (
                  <Card 
                    key={index} 
                    className={`cursor-pointer transition-all hover:shadow-md ${alt.color}`}
                    onClick={() => {
                      setF(alt.weights.fundamental);
                      setT(alt.weights.technical);
                      setS(alt.weights.sentiment);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <AltIcon className="h-5 w-5 mt-0.5 text-current" />
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{alt.name}</div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {alt.description}
                          </div>
                          <div className="flex space-x-3 text-xs font-medium">
                            <span>F: {alt.weights.fundamental}%</span>
                            <span>T: {alt.weights.technical}%</span>
                            <span>S: {alt.weights.sentiment}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
