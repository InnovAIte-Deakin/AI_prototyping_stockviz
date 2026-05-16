'use client'

import * as React from "react"
import Link from "next/link"
import { 
  DollarSign, 
  Activity, 
  Zap, 
  BarChart2, 
  MousePointer2, 
  TrendingUp, 
  Info
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const TOPICS = [
  {
    id: "pe-ratio",
    title: "What is P/E Ratio?",
    icon: DollarSign,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    description: "The Price-to-Earnings ratio helps you understand if a stock is overvalued or undervalued.",
    content: "The P/E ratio is a primary valuation tool. It tells you how much investors are willing to pay today for every **$1 of annual earnings**.",
    details: [
      "High P/E: Investors expect high future growth, or the stock is overvalued.",
      "Low P/E: The stock might be undervalued, or the company is facing challenges.",
      "Comparison: Always compare a company's P/E to its industry peers."
    ]
  },
  {
    id: "rsi",
    title: "What is RSI?",
    icon: Activity,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    description: "The Relative Strength Index measures the speed and change of price movements.",
    content: "RSI is a momentum indicator that ranges from 0 to 100. It helps identify if a stock has been bought or sold too aggressively.",
    details: [
      "Overbought (70+): The price may be due for a correction or pullback.",
      "Oversold (30-): The price may be due for a bounce or recovery.",
      "Trend: RSI can stay high or low for a long time during strong trends."
    ]
  },
  {
    id: "macd",
    title: "What is MACD?",
    icon: Zap,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    description: "MACD tracks the relationship between two moving averages of a stock's price.",
    content: "MACD is a trend-following momentum indicator. It shows the relationship between two different moving averages of a stock’s price.",
    details: [
      "Bullish Signal: When the MACD line crosses above the signal line (Buy).",
      "Bearish Signal: When the MACD line crosses below the signal line (Sell).",
      "Histogram: Shows the strength of the current momentum."
    ]
  },
  {
    id: "market-cap",
    title: "What is Market Cap?",
    icon: BarChart2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    description: "Market Capitalization represents the total dollar value of a company's outstanding shares.",
    content: "Market Cap tells you the total 'sticker price' of a company. It is calculated by: **Price × Total Shares Outstanding**.",
    details: [
      "Large-cap ($10B+): Established, stable companies (e.g., Apple, Microsoft).",
      "Mid-cap ($2B - $10B): Growing companies with moderate risk.",
      "Small-cap (<$2B): Young companies with high growth potential but higher risk."
    ]
  },
  {
    id: "paper-trading",
    title: "What is Paper Trading?",
    icon: MousePointer2,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    description: "Practice trading with virtual money to sharpen your skills without risk.",
    content: "Paper trading is a simulation that allows you to trade with **virtual currency**. It is the safest way to learn the ropes.",
    details: [
      "Risk-Free: You can't lose real money while learning.",
      "Strategy Testing: Perfect for trying out new technical indicators.",
      "StockViz: We start every new account with $100,000 in virtual cash."
    ]
  },
  {
    id: "stock-charts",
    title: "How to read a stock chart?",
    icon: TrendingUp,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    description: "Understand price action, candlesticks, and timeframes.",
    content: "Most charts use 'Candlesticks' to show price action over time. Each candle represents a specific period (e.g., 1 day).",
    details: [
      "Green Candle: Price closed higher than it opened (Bullish).",
      "Red Candle: Price closed lower than it opened (Bearish).",
      "Wicks: The thin lines show the highest and lowest prices hit during that period."
    ]
  }
]

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary">
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-16 sm:px-6 lg:px-8">
        {/* Simple Hero Section */}
        <div className="space-y-2 border-b border-border/20 pb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Learning Center
          </h1>
          <p className="max-w-2xl text-base font-medium text-muted-foreground">
            StockViz guides to help you understand the core concepts behind the data.
          </p>
        </div>

        <div className="mx-auto max-w-3xl space-y-6">
          {/* Main Content */}
          <div className="space-y-4">
            <Card className="border-border/20 bg-card overflow-hidden">
              <CardHeader className="border-b border-border/10 p-5">
                <CardTitle className="text-xl font-bold">Stock Market Fundamentals</CardTitle>
                <CardDescription className="text-sm font-medium">Core concepts to help you understand market data.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  {TOPICS.map((topic) => (
                    <AccordionItem key={topic.id} value={topic.id} className="border-b border-border/10 last:border-0 px-8">
                      <AccordionTrigger className="py-4 hover:no-underline group transition-all duration-200 hover:bg-muted/10">
                        <div className="flex items-center gap-4 text-left w-full">
                          <topic.icon className={cn("size-5 shrink-0", topic.color)} />
                          <div className="flex-1">
                            <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{topic.title}</p>
                            <p className="text-xs font-medium text-muted-foreground line-clamp-1">{topic.description}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-0 pl-9 pb-0">
                        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground pb-6">
                          <p dangerouslySetInnerHTML={{ __html: topic.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          {topic.details && (
                            <ul className="space-y-2 list-disc pl-4">
                              {topic.details.map((detail, i) => (
                                <li key={i} dangerouslySetInnerHTML={{ __html: detail.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                              ))}
                            </ul>
                          )}
                          <div className="flex items-center gap-2 text-xs font-bold text-primary pt-1">
                            <Info className="size-3" />
                            Tip: View this on the analysis page.
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            <Card className="border-border/20 bg-card overflow-hidden">
              <CardHeader className="border-b border-border/10 px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold">Ready to Practice?</CardTitle>
                    <CardDescription className="text-xs font-medium">
                      Test your knowledge without any financial risk.
                    </CardDescription>
                  </div>
                  <Link href="/portfolio" className="shrink-0">
                    <Button className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-9 px-6 text-sm">
                      Start Paper Trading
                    </Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>

      </div>
    </div>
  )
}
