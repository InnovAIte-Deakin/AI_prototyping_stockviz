import Link from 'next/link'
import {
  BarChart3,
  TrendingUp,
  Brain,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: BarChart3,
    title: 'Technical Analysis',
    description:
      'Advanced technical indicators and chart patterns for informed trading decisions.',
    gradient: 'from-blue-500 to-cyan-500',
    bgGlow: 'bg-blue-500/10',
  },
  {
    icon: TrendingUp,
    title: 'Fundamental Analysis',
    description:
      'Deep dive into company financials, ratios, and valuation metrics.',
    gradient: 'from-emerald-500 to-teal-500',
    bgGlow: 'bg-emerald-500/10',
  },
  {
    icon: Brain,
    title: 'AI Insights',
    description:
      'Machine learning-powered sentiment analysis and market predictions.',
    gradient: 'from-purple-500 to-pink-500',
    bgGlow: 'bg-purple-500/10',
  },
]

const popularTickers = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'NVDA']

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5 dark:from-blue-600/10 dark:via-purple-600/10 dark:to-pink-600/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent dark:from-blue-900/20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium mb-8 animate-slide-in">
            <Sparkles className="h-4 w-4" />
            AI-Powered Stock Analysis
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 animate-slide-in-delay-1">
            Make Smarter Investment
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Decisions
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-in-delay-2">
            Comprehensive stock analysis combining fundamental metrics, technical
            indicators, and AI-powered sentiment analysis — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-in-delay-3">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 h-12 text-base shadow-lg shadow-blue-500/25"
              asChild
            >
              <Link href="/market">
                Explore Market
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 h-12 text-base"
              asChild
            >
              <Link href="/learn">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Everything You Need to Analyze
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Three pillars of analysis combined with AI to give you a complete picture.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border-border/50 hover:border-border hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-8">
                  <div
                    className={`${feature.bgGlow} w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon
                      className={`h-7 w-7 text-transparent bg-clip-text bg-gradient-to-br ${feature.gradient}`}
                      style={{ color: 'unset' }}
                    />
                    <Icon className={`h-7 w-7 absolute bg-gradient-to-br ${feature.gradient} [&>*]:stroke-current`} style={{ opacity: 0 }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 text-white p-10 sm:p-14 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-purple-600/20" />

          <div className="relative">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to start analyzing?
            </h3>
            <p className="text-gray-300 mb-8 max-w-lg mx-auto">
              Enter any stock symbol to get comprehensive analysis powered by AI.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {popularTickers.map((ticker) => (
                <Link
                  key={ticker}
                  href={`/analysis/${ticker}`}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors duration-200 backdrop-blur-sm"
                >
                  {ticker}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
