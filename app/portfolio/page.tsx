import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Wallet, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Portfolio',
  description:
    'Manage your investment portfolio, track performance, and monitor your watchlist.',
}

export default function PortfolioPage() {
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium mb-4">
          <Wallet className="h-4 w-4" />
          Portfolio
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Your Portfolio
        </h1>
        <p className="text-muted-foreground text-lg">
          Portfolio management requires authentication — coming in Sprint 5.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {[
          { icon: Wallet, title: 'Holdings', desc: 'Track your stock holdings and allocation.' },
          { icon: TrendingUp, title: 'Performance', desc: 'Monitor returns and portfolio growth.' },
          { icon: Star, title: 'Watchlist', desc: 'Save stocks you want to follow closely.' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.title} className="border-dashed border-border/50 bg-muted/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-muted-foreground">
                  <Icon className="h-5 w-5" />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
