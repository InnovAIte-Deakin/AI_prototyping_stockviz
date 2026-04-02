import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Technical Indicators',
  description:
    'Configure technical indicators used in stock analysis — RSI, MACD, Bollinger Bands, and more.',
}

export default function IndicatorsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-medium mb-4">
          <Activity className="h-4 w-4" />
          Indicators
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Technical Indicators
        </h1>
        <p className="text-muted-foreground text-lg">
          Indicator configuration will be available once the analysis UI is migrated in Sprint 4.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto border-dashed border-border/50 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">
            Available Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['RSI', 'MACD', 'Bollinger Bands', 'SMA', 'EMA', 'Stochastic', 'ADX', 'OBV', 'ATR', 'CCI'].map(
              (indicator) => (
                <span
                  key={indicator}
                  className="px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground"
                >
                  {indicator}
                </span>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
