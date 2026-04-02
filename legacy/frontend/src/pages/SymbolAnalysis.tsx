import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { encodeState } from '../lib/urlState'
import WeightsPanel from '../components/WeightsPanel'
import IndicatorsPanel from '../components/IndicatorsPanel'
import SimpleTradingViewChart from '../components/SimpleTradingViewChart'
import { decodeState } from '../lib/urlState'

// Define constants for modes and timeframes
const timeframes = ['1D', '1W', '1M', '3M', '6M', '1Y', '2Y'] as const
const modes = ['normal', 'advanced'] as const

export default function SymbolAnalysis() {
  const { symbol = '' } = useParams()
  const navigate = useNavigate()
  const [sp, setSP] = useSearchParams()

  // --- State for Configuration ---
  const [timeframe, setTimeframe] = useState(() => sp.get('tf') ?? '1M')
  const [mode, setMode] = useState<'normal' | 'advanced'>(() => (sp.get('mode') as any) ?? 'normal')
  const [weights, setWeights] = useState({ fundamental: 40, technical: 35, sentiment: 25 })
  const [indConfig, setIndConfig] = useState<Record<string, any>>(decodeState(sp.get('ind')) ?? {})


  // --- Navigation Logic ---
  const handleRunAnalysis = () => {
    const params = new URLSearchParams()
    params.set('tf', timeframe)
    params.set('mode', mode)
    
    if (mode === 'advanced') {
      params.set('w', encodeState(weights))
      const ind = encodeState(indConfig)
      if (ind) {
        params.set('ind', ind)
      }
    }

    // Persist current settings to URL for when user navigates back
    const currentParams = new URLSearchParams(sp)
    currentParams.set('tf', timeframe)
    currentParams.set('mode', mode)
    const ind = encodeState(indConfig)
    if (ind) currentParams.set('ind', ind)
    setSP(currentParams, { replace: true })

    navigate(`/analysis/${symbol}?${params.toString()}`)
  }

  // --- UI for Configuration ---
  return (
    <div className="container mx-auto p-4 space-y-6">
       <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">{symbol.toUpperCase()} Analysis Setup</h1>
      </div>

      <SimpleTradingViewChart symbol={symbol || 'AAPL'} height={400} />

      <Card>
        <CardHeader>
          <CardTitle>Configure Analysis</CardTitle>
          <p className="text-sm text-gray-500">
            Set your parameters and then run the analysis.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Timeframe & Mode Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Timeframe</h3>
                <div className="flex flex-wrap gap-2">
                  {timeframes.map((tf) => (
                    <Button
                      key={tf}
                      variant={timeframe === tf ? 'default' : 'outline'}
                      onClick={() => setTimeframe(tf)}
                    >
                      {tf}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Analysis Mode</h3>
                <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
                  <TabsList>
                    <TabsTrigger value="normal">🧠 Smart</TabsTrigger>
                    <TabsTrigger value="advanced">🚀 Pro</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            
            {/* Advanced Options */}
            {mode === 'advanced' && (
              <div className="grid md:grid-cols-2 gap-4 pt-4">
                <Card>
                  <CardHeader><CardTitle>Weights</CardTitle></CardHeader>
                  <CardContent>
                    <WeightsPanel initial={weights} onChange={setWeights} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Indicators</CardTitle></CardHeader>
                  <CardContent>
                    <IndicatorsPanel 
                      onChange={setIndConfig} 
                      initialConfig={indConfig}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Run Analysis Button */}
            <div className="pt-4">
              <Button onClick={handleRunAnalysis} size="lg" className="w-full">
                Run Analysis
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
