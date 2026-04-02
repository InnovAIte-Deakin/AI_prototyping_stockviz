import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Learn',
  description:
    'Learn about stock analysis concepts, technical indicators, and investment strategies.',
}

export default function LearnPage() {
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-sm font-medium mb-4">
          <BookOpen className="h-4 w-4" />
          Learn
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Learning Center
        </h1>
        <p className="text-muted-foreground text-lg">
          Educational content is being reviewed for migration — scope to be confirmed in Sprint 5.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {[
          { title: 'Technical Analysis Basics', desc: 'Understand charts, trends, and price action.' },
          { title: 'Fundamental Analysis Guide', desc: 'Learn to read financials and value companies.' },
          { title: 'Sentiment & AI Analysis', desc: 'How AI processes news and social sentiment.' },
          { title: 'Building a Portfolio', desc: 'Diversification, risk, and allocation strategies.' },
        ].map((topic) => (
          <Card key={topic.title} className="border-dashed border-border/50 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">{topic.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{topic.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
