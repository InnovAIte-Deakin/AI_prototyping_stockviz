import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Sliders } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Analysis Weights',
  description:
    'Adjust the weighting of fundamental, technical, and sentiment analysis to match your investment style.',
}

export default function WeightsPage() {
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-4">
          <Sliders className="h-4 w-4" />
          Weights
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Analysis Weights
        </h1>
        <p className="text-muted-foreground text-lg">
          Weight configuration will be available once the analysis UI is migrated in Sprint 4.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto border-dashed border-border/50 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">
            Weight Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Fundamental Analysis', default: '40%' },
            { label: 'Technical Analysis', default: '35%' },
            { label: 'Sentiment Analysis', default: '25%' },
          ].map((weight) => (
            <div
              key={weight.label}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <span className="text-sm font-medium">{weight.label}</span>
              <span className="text-sm text-muted-foreground">
                Default: {weight.default}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
