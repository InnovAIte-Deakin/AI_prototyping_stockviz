import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, BarChart3, TrendingUp, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>
}): Promise<Metadata> {
  const { symbol } = await params
  return {
    title: `${symbol.toUpperCase()} Analysis`,
    description: `Comprehensive stock analysis for ${symbol.toUpperCase()} — technical indicators, fundamental metrics, and AI-powered insights.`,
  }
}

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = await params

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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">
          <BarChart3 className="h-4 w-4" />
          Stock Analysis
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          {symbol.toUpperCase()}
        </h1>
        <p className="text-muted-foreground text-lg">
          Analysis data will be available once the backend services are connected
          in Sprint 3.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {[
          {
            icon: TrendingUp,
            title: 'Fundamental',
            description: 'Financial metrics, ratios, and valuation analysis.',
          },
          {
            icon: BarChart3,
            title: 'Technical',
            description: 'Chart patterns, indicators, and trend analysis.',
          },
          {
            icon: Brain,
            title: 'AI Insights',
            description: 'Sentiment analysis and market predictions.',
          },
        ].map((panel) => {
          const Icon = panel.icon
          return (
            <Card
              key={panel.title}
              className="border-dashed border-border/50 bg-muted/30"
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-muted-foreground">
                  <Icon className="h-5 w-5" />
                  {panel.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {panel.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
