'use client'

import * as React from 'react'
import Link from 'next/link'
import { Plus, X, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SymbolSearchAdder } from '@/components/compare/symbol-search-adder'
import { WishlistStar } from '@/components/ui/wishlist-star'
import { loadPriceSeriesShared } from '@/lib/alphavantage/shared-price-series-fetch'
import { computeTaFromOhlc } from '@/lib/ta/indicators-from-ohlc'
import { sortRecommendationsChronologically } from '@/lib/analyst-recommendation-display'
import { generateComparisonSummary, type CompareAiResponse } from './actions'
import { formatMetricValue } from '@/lib/metric-display'
import { cn } from '@/lib/utils'

type ComparisonData = {
  symbol: string
  name: string
  price: number | null
  dailyChangePct: number | null
  marketCap: number | null
  peRatio: number | null
  eps: number | null
  rsi14: number | null
  macd: string | null
  analystRating: string | null
}

const fetchSymbolData = async (symbol: string, name: string): Promise<ComparisonData> => {
  const [quoteRes, metricRes, recRes, seriesRes] = await Promise.all([
    fetch(`/api/quote?symbol=${symbol}`).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`/api/stock-metric?symbol=${symbol}`).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`/api/stock-recommendation?symbol=${symbol}`).then(r => r.ok ? r.json() : null).catch(() => null),
    loadPriceSeriesShared(symbol, 'daily')
  ])

  // Process technicals
  let rsi14 = null
  let macd = null
  if (seriesRes?.ok && seriesRes.series) {
    const ta = computeTaFromOhlc(seriesRes.series)
    const latest = ta.length > 0 ? ta[ta.length - 1] : null
    if (latest) {
      rsi14 = latest.rsi14
      macd = latest.macdLine !== null && latest.macdSignal !== null 
        ? `${latest.macdLine.toFixed(2)} / ${latest.macdSignal.toFixed(2)}` 
        : null
    }
  }

  // Process analyst rating
  let analystRating = null
  if (Array.isArray(recRes) && recRes.length > 0) {
    const sorted = sortRecommendationsChronologically(recRes)
    const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null
    if (latest) {
      const maxCount = Math.max(
        latest.strongBuy ?? 0,
        latest.buy ?? 0,
        latest.hold ?? 0,
        latest.sell ?? 0,
        latest.strongSell ?? 0
      )
      if (maxCount === latest.strongBuy) analystRating = 'Strong Buy'
      else if (maxCount === latest.buy) analystRating = 'Buy'
      else if (maxCount === latest.hold) analystRating = 'Hold'
      else if (maxCount === latest.sell) analystRating = 'Sell'
      else if (maxCount === latest.strongSell) analystRating = 'Strong Sell'
    }
  }

  return {
    symbol: symbol.toUpperCase(),
    name: name || symbol.toUpperCase(),
    price: quoteRes?.c ?? null,
    dailyChangePct: quoteRes?.dp ?? null,
    marketCap: metricRes?.metric?.marketCapitalization ?? null,
    peRatio: metricRes?.metric?.peNormalizedAnnual ?? null,
    eps: metricRes?.metric?.epsNormalizedAnnual ?? null,
    rsi14,
    macd,
    analystRating,
  }
}

export const CompareClientView = () => {
  const [symbols, setSymbols] = React.useState<string[]>([])
  const [dataMap, setDataMap] = React.useState<Record<string, ComparisonData>>({})
  const [loadingMap, setLoadingMap] = React.useState<Record<string, boolean>>({})
  const [aiSummary, setAiSummary] = React.useState<CompareAiResponse | null>(null)
  const [isAiLoading, setIsAiLoading] = React.useState(false)

  const handleAddSymbol = React.useCallback((sym: string, name?: string) => {
    const s = sym.toUpperCase()
    if (symbols.includes(s) || symbols.length >= 3) return

    setSymbols(prev => [...prev, s])
    setLoadingMap(prev => ({ ...prev, [s]: true }))

    fetchSymbolData(s, name || s).then(data => {
      setDataMap(prev => ({ ...prev, [s]: data }))
      setLoadingMap(prev => ({ ...prev, [s]: false }))
      // Reset AI summary when new symbol is added
      setAiSummary(null)
    })
  }, [symbols])

  const handleRemoveSymbol = (sym: string) => {
    setSymbols(prev => prev.filter(s => s !== sym))
    setDataMap(prev => {
      const next = { ...prev }
      delete next[sym]
      return next
    })
    setAiSummary(null)
  }

  const handleGenerateAiSummary = React.useCallback(() => {
    if (symbols.length < 2) return

    const allLoaded = symbols.every(s => dataMap[s] && !loadingMap[s])
    if (!allLoaded) return

    const payload = symbols.map(s => {
      const d = dataMap[s]
      return {
        symbol: d.symbol,
        price: d.price ?? 'Unknown',
        dailyChange: d.dailyChangePct ?? 'Unknown',
        marketCap: d.marketCap ?? 'Unknown',
        peRatio: d.peRatio ?? 'Unknown',
        eps: d.eps ?? 'Unknown',
        rsi: d.rsi14 ? d.rsi14.toFixed(2) : 'Unknown',
        macd: d.macd ?? 'Unknown',
        analystSentiment: d.analystRating ?? 'Unknown'
      }
    })

    setIsAiLoading(true)
    generateComparisonSummary(payload).then(res => {
      setAiSummary(res)
      setIsAiLoading(false)
    })
  }, [symbols, dataMap, loadingMap])

  const metricGroups = [
    {
      groupName: 'Valuation',
      metrics: [
        { label: 'Market Cap', render: (d: ComparisonData) => d.marketCap ? formatMetricValue(d.marketCap) : '—' },
        { label: 'P/E Ratio', render: (d: ComparisonData) => d.peRatio ? d.peRatio.toFixed(2) : '—' },
        { label: 'EPS', render: (d: ComparisonData) => d.eps ? d.eps.toFixed(2) : '—' },
      ]
    },
    {
      groupName: 'Technical',
      metrics: [
        { label: 'RSI (14)', render: (d: ComparisonData) => d.rsi14 ? d.rsi14.toFixed(2) : '—' },
        { label: 'MACD', render: (d: ComparisonData) => d.macd ?? '—' },
      ]
    },
    {
      groupName: 'Analyst',
      metrics: [
        { label: 'Analyst Rating', render: (d: ComparisonData) => d.analystRating ?? '—' },
      ],
      insights: (syms: string[], map: Record<string, ComparisonData>, loading: Record<string, boolean>) => {
        if (syms.some(s => loading[s])) return null;
        const strongBuys = syms.filter(s => map[s]?.analystRating === 'Strong Buy' || map[s]?.analystRating === 'Buy');
        if (strongBuys.length === 0) return null;
        return (
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <div className="bg-finance-success/10 text-finance-success px-3 py-1.5 rounded-md font-medium border border-finance-success/20 shadow-sm">
              Top Rated: <span className="font-bold">{strongBuys.join(', ')}</span>
            </div>
          </div>
        )
      }
    }
  ]

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Compare Stocks
        </h1>
        <p className="text-muted-foreground font-medium text-sm max-w-2xl">
          Select up to 3 stocks to compare key financials, technical indicators, and analyst ratings side by side. 
          StockViz will generate a short AI summary from the available data.
        </p>
      </div>

      <div className="flex flex-col gap-2 max-w-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-muted-foreground">
            {symbols.length} of 3 stocks selected
          </span>
        </div>
        <SymbolSearchAdder 
          onAdd={handleAddSymbol} 
          disabled={symbols.length >= 3} 
          placeholder={symbols.length >= 3 ? "Remove a stock to add another" : "Search to add a stock..."}
          className="w-full"
        />
      </div>

      {symbols.length > 0 ? (
        <div className="space-y-12">
          {/* Top Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {symbols.map(sym => {
              const data = dataMap[sym]
              const isLoading = loadingMap[sym]
              const name = data?.name || sym
              
              return (
                <Card key={sym} className="border-border/20 bg-card shadow-sm flex flex-col relative group">
                  <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-start justify-between space-y-0 border-b border-border/10">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-heading font-bold text-primary">{sym}</h3>
                        <WishlistStar symbol={sym} name={name} className="h-6 w-6 p-0 hover:bg-transparent" iconClassName="h-4 w-4" />
                      </div>
                      <div className="text-xs font-medium text-muted-foreground truncate w-full pr-2">
                        {isLoading ? <Skeleton className="h-3 w-20" /> : name}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 shrink-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 -mr-1 -mt-1"
                      onClick={() => handleRemoveSymbol(sym)}
                      title="Remove stock"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  
                  <CardContent className="p-4 space-y-4 flex-1">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-foreground">
                        {isLoading || !data ? <Skeleton className="h-7 w-24" /> : (
                           data.price ? `$${data.price.toFixed(2)}` : '—'
                        )}
                      </div>
                      <div className="text-sm font-bold">
                        {isLoading || !data ? <Skeleton className="h-4 w-12 mt-1" /> : (
                          data.dailyChangePct !== null ? (
                            <span className={data.dailyChangePct >= 0 ? 'text-finance-success' : 'text-finance-danger'}>
                              {data.dailyChangePct > 0 ? '+' : ''}{data.dailyChangePct.toFixed(2)}%
                            </span>
                          ) : '—'
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-3 border-t border-border/10 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-medium">Market Cap:</span>
                        <span className="font-semibold text-foreground">
                          {isLoading || !data ? <Skeleton className="h-3 w-16" /> : (data.marketCap ? formatMetricValue(data.marketCap) : '—')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-medium">P/E:</span>
                        <span className="font-semibold text-foreground">
                          {isLoading || !data ? <Skeleton className="h-3 w-10" /> : (data.peRatio ? data.peRatio.toFixed(2) : '—')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-medium">EPS:</span>
                        <span className="font-semibold text-foreground">
                          {isLoading || !data ? <Skeleton className="h-3 w-10" /> : (data.eps ? data.eps.toFixed(2) : '—')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <div className="p-4 pt-0 mt-auto flex flex-row items-center gap-3 w-full">
                    <Button variant="outline" size="sm" className="flex-1 text-xs font-bold" asChild>
                      <Link href={`/stock/${sym}`}>
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs font-bold" asChild>
                      <Link href={`/portfolio?symbol=${sym}`}>
                        Trade
                      </Link>
                    </Button>
                  </div>
                </Card>
              )
            })}
            
            {/* Empty slots placeholders if < 3 */}
            {Array.from({ length: 3 - symbols.length }).map((_, i) => (
              <Card key={`empty-${i}`} className="border-dashed border-border/40 bg-muted/10 shadow-none flex flex-col items-center justify-center min-h-[260px]">
                <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground mb-3">
                  <Plus className="h-5 w-5 opacity-50" />
                </div>
                <p className="text-sm font-bold text-muted-foreground/70">Add a stock</p>
              </Card>
            ))}
          </div>

          {/* Quick Takeaways Section */}
          {(() => {
            const allLoaded = symbols.length > 0 && symbols.every(s => !loadingMap[s]);
            if (!allLoaded) return null;

            const withEps = symbols.filter(s => dataMap[s]?.eps != null).sort((a,b) => dataMap[b].eps! - dataMap[a].eps!);
            const highestEps = withEps.length > 0 ? withEps[0] : null;

            const withPe = symbols.filter(s => dataMap[s]?.peRatio != null).sort((a,b) => dataMap[a].peRatio! - dataMap[b].peRatio!);
            const lowestPe = withPe.length > 0 ? withPe[0] : null;

            const withCap = symbols.filter(s => dataMap[s]?.marketCap != null).sort((a,b) => dataMap[b].marketCap! - dataMap[a].marketCap!);
            const largestCap = withCap.length > 0 ? withCap[0] : null;

            const withMove = symbols.filter(s => dataMap[s]?.dailyChangePct != null).sort((a,b) => dataMap[b].dailyChangePct! - dataMap[a].dailyChangePct!);
            const bestMove = withMove.length > 0 ? withMove[0] : null;

            if (!highestEps && !lowestPe && !largestCap && !bestMove) return null;

            return (
              <div className="space-y-3">
                <h3 className="text-xl font-heading font-bold text-foreground pl-1">Quick Takeaways</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {highestEps && (
                    <Card className="border-border/10 bg-card shadow-sm">
                      <CardContent className="p-4 flex flex-col justify-center">
                        <span className="text-sm font-medium text-muted-foreground mb-2">Highest EPS</span>
                        <div className="flex justify-between items-end">
                          <span className="text-lg font-bold text-foreground">{highestEps}</span>
                          <span className="text-sm font-semibold text-primary">{dataMap[highestEps].eps!.toFixed(2)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {lowestPe && (
                    <Card className="border-border/10 bg-card shadow-sm">
                      <CardContent className="p-4 flex flex-col justify-center">
                        <span className="text-sm font-medium text-muted-foreground mb-2">Lowest P/E</span>
                        <div className="flex justify-between items-end">
                          <span className="text-lg font-bold text-foreground">{lowestPe}</span>
                          <span className="text-sm font-semibold text-primary">{dataMap[lowestPe].peRatio!.toFixed(2)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {largestCap && (
                    <Card className="border-border/10 bg-card shadow-sm">
                      <CardContent className="p-4 flex flex-col justify-center">
                        <span className="text-sm font-medium text-muted-foreground mb-2">Largest Market Cap</span>
                        <div className="flex justify-between items-end">
                          <span className="text-lg font-bold text-foreground">{largestCap}</span>
                          <span className="text-sm font-semibold text-primary">{formatMetricValue(dataMap[largestCap].marketCap!)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {bestMove && (
                    <Card className="border-border/10 bg-card shadow-sm">
                      <CardContent className="p-4 flex flex-col justify-center">
                        <span className="text-sm font-medium text-muted-foreground mb-2">Best Daily Move</span>
                        <div className="flex justify-between items-end">
                          <span className="text-lg font-bold text-foreground">{bestMove}</span>
                          <span className={cn("text-sm font-semibold", dataMap[bestMove].dailyChangePct! >= 0 ? "text-finance-success" : "text-finance-danger")}>
                            {dataMap[bestMove].dailyChangePct! > 0 ? '+' : ''}{dataMap[bestMove].dailyChangePct!.toFixed(2)}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Metric Sections */}
          <div className="space-y-8">
            {metricGroups.map((group) => {
              if (group.groupName === 'Technical') {
                const isTechnicalEmpty = symbols.every(sym => {
                  const d = dataMap[sym];
                  return !d || (d.rsi14 == null && d.macd == null);
                });
                
                if (isTechnicalEmpty && symbols.some(sym => !loadingMap[sym])) {
                  return (
                    <div key={group.groupName} className="space-y-3">
                      <h3 className="text-xl font-heading font-bold text-foreground pl-1">{group.groupName}</h3>
                      <div className="bg-muted/10 rounded-xl border border-border/20 py-8 px-5 shadow-sm flex flex-col items-center justify-center text-center">
                        <p className="font-bold text-foreground mb-1">Technical Data Unavailable</p>
                        <p className="text-sm text-muted-foreground max-w-md">
                          RSI and MACD data are not available for the selected stocks right now.
                          You can still compare price, valuation, and analyst sentiment.
                        </p>
                      </div>
                    </div>
                  );
                }
              }

              return (
                <div key={group.groupName} className="space-y-3">
                  <h3 className="text-xl font-heading font-bold text-foreground pl-1">{group.groupName}</h3>
                  <div className="bg-muted/10 rounded-xl border border-border/20 p-5 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {group.metrics.map((metric) => (
                        <Card key={metric.label} className="border-border/10 shadow-none bg-card">
                          <CardHeader className="pb-2 pt-4 px-4 bg-muted/20 border-b border-border/5">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
                          </CardHeader>
                          <CardContent className="px-4 py-3">
                            <div className="space-y-3">
                              {symbols.map(sym => {
                                const data = dataMap[sym]
                                const isLoading = loadingMap[sym]
                                return (
                                  <div key={sym} className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-muted-foreground/70">{sym}</span>
                                    <span className="font-bold text-foreground">
                                      {isLoading || !data ? (
                                        <Skeleton className="h-4 w-12" />
                                      ) : (
                                        metric.render(data)
                                      )}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {group.groupName === 'Analyst' && (
                        <Card className="border-border/10 shadow-none bg-card sm:col-span-1 md:col-span-2">
                          <CardHeader className="pb-2 pt-4 px-4 bg-muted/20 border-b border-border/5">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Data Coverage</CardTitle>
                          </CardHeader>
                          <CardContent className="px-4 py-3">
                            <div className="space-y-3">
                               <div className="flex justify-between items-center text-sm">
                                  <span className="font-bold text-muted-foreground/70">Price data</span>
                                  <span className="font-bold text-finance-success">Available</span>
                               </div>
                               <div className="flex justify-between items-center text-sm">
                                  <span className="font-bold text-muted-foreground/70">Valuation data</span>
                                  <span className="font-bold text-finance-success">Available</span>
                               </div>
                               <div className="flex justify-between items-center text-sm">
                                  <span className="font-bold text-muted-foreground/70">Technical data</span>
                                  <span className="font-bold text-muted-foreground">Limited</span>
                               </div>
                               <div className="flex justify-between items-center text-sm">
                                  <span className="font-bold text-muted-foreground/70">Analyst data</span>
                                  <span className="font-bold text-finance-success">Available</span>
                               </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    {group.insights && group.insights(symbols, dataMap, loadingMap)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="border-dashed border-border/40 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-2">
              <Plus className="h-6 w-6" />
            </div>
            <p className="text-foreground font-bold">No stocks selected</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Search for a stock symbol above to start comparing.
            </p>
          </CardContent>
        </Card>
      )}

      {symbols.length >= 2 && (
        <Card className="border-border/20 bg-card shadow-sm overflow-hidden relative mt-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold text-primary">
              AI Comparison Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!aiSummary && !isAiLoading && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/10 rounded-lg border border-border/10">
                <p className="text-sm text-muted-foreground font-medium">
                  Click the button to generate an AI insight based on the current comparison data.
                </p>
                <Button 
                  onClick={handleGenerateAiSummary} 
                  disabled={isAiLoading || symbols.some(s => loadingMap[s])}
                  size="sm"
                  className="w-full sm:w-auto shrink-0"
                >
                  Generate Summary
                </Button>
              </div>
            )}
            
            {isAiLoading && !aiSummary && (
              <div className="flex items-center gap-3 text-muted-foreground py-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Analyzing comparison data...</span>
              </div>
            )}
            
            {aiSummary?.error ? (
              <p className="text-sm text-destructive font-medium">{aiSummary.error}</p>
            ) : aiSummary ? (
              <div className="text-sm leading-relaxed text-foreground font-medium whitespace-pre-wrap">
                {aiSummary.summary}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
