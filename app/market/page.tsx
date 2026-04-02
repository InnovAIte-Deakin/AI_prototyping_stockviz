import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Globe, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Market Overview',
  description:
    'Browse trending stocks, market movers, and discover new investment opportunities.',
}

export default function MarketPage() {
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-4">
          <Globe className="h-4 w-4" />
          Market
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Market Overview
        </h1>
        <p className="text-muted-foreground text-lg">
          Trending stocks and market discovery — coming in Sprint 4.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {[
          { icon: TrendingUp, title: 'Top Gainers', color: 'text-emerald-500' },
          { icon: TrendingDown, title: 'Top Losers', color: 'text-red-500' },
          { icon: Activity, title: 'Most Active', color: 'text-blue-500' },
        ].map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.title} className="border-dashed border-border/50 bg-muted/30">
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 text-base ${section.color}`}>
                  <Icon className="h-5 w-5" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Market data will populate here once data services are connected.
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
