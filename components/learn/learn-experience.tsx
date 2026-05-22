"use client"

import Link from "next/link"
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Building2,
  DollarSign,
  MousePointerClick,
  ShieldAlert,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type ModuleReference = {
  label: string
  href: string
}

type InterpretationRow = {
  label: string
  meaning: string
  watch: string
}

type LearningModule = {
  id: string
  category: string
  title: string
  icon: LucideIcon
  summary: string
  definition: string
  formula: string
  whyItMatters: string
  stepByStep: { title: string; description: string }[]
  interpretationRows: InterpretationRow[]
  mistakes: string[]
  workflow: string[]
  references: ModuleReference[]
  actionHref: string
  actionLabel: string
  accent: string
}

const formatUsd = (value: number, digits = 0): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)

const formatCompactUsd = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)

const peChartData = [
  { company: "UtilityCo", pe: 11, growth: 4 },
  { company: "RetailCo", pe: 16, growth: 7 },
  { company: "Market Avg", pe: 18, growth: 9 },
  { company: "CloudCo", pe: 29, growth: 18 },
  { company: "AI Labs", pe: 41, growth: 25 },
]

const marketCapChartData = [
  { bucket: "Small", stability: 42, volatility: 76 },
  { bucket: "Mid", stability: 58, volatility: 61 },
  { bucket: "Large", stability: 77, volatility: 43 },
  { bucket: "Mega", stability: 89, volatility: 28 },
]

const rsiChartData = [
  { session: "Mon", price: 101, rsi: 43 },
  { session: "Tue", price: 103, rsi: 49 },
  { session: "Wed", price: 105, rsi: 58 },
  { session: "Thu", price: 107, rsi: 66 },
  { session: "Fri", price: 109, rsi: 72 },
  { session: "Mon2", price: 108, rsi: 68 },
  { session: "Tue2", price: 110, rsi: 74 },
  { session: "Wed2", price: 111, rsi: 77 },
  { session: "Thu2", price: 109, rsi: 62 },
  { session: "Fri2", price: 107, rsi: 48 },
]

const macdChartData = [
  { period: "W1", macd: -1.2, signal: -0.8, histogram: -0.4 },
  { period: "W2", macd: -0.9, signal: -0.8, histogram: -0.1 },
  { period: "W3", macd: -0.4, signal: -0.6, histogram: 0.2 },
  { period: "W4", macd: 0.1, signal: -0.2, histogram: 0.3 },
  { period: "W5", macd: 0.6, signal: 0.2, histogram: 0.4 },
  { period: "W6", macd: 0.8, signal: 0.5, histogram: 0.3 },
  { period: "W7", macd: 0.4, signal: 0.5, histogram: -0.1 },
  { period: "W8", macd: -0.1, signal: 0.2, histogram: -0.3 },
]

const priceVolumeChartData = [
  { candle: "D1", close: 102.4, volume: 2.1 },
  { candle: "D2", close: 103.8, volume: 2.8 },
  { candle: "D3", close: 101.6, volume: 4.4 },
  { candle: "D4", close: 104.9, volume: 5.1 },
  { candle: "D5", close: 106.2, volume: 3.6 },
  { candle: "D6", close: 105.7, volume: 2.4 },
]

const paperTradingChartData = [
  { week: "Week 1", equity: 100000, lesson: "Baseline" },
  { week: "Week 2", equity: 100850, lesson: "Sizing rules" },
  { week: "Week 3", equity: 100100, lesson: "Bad chase" },
  { week: "Week 4", equity: 101900, lesson: "Waited for setup" },
  { week: "Week 5", equity: 102200, lesson: "Journal review" },
  { week: "Week 6", equity: 103400, lesson: "Consistency" },
]

const moduleChartConfig = {
  pe: {
    pe: {
      label: "P/E",
      color: "var(--color-primary)",
    },
    growth: {
      label: "EPS Growth",
      color: "var(--color-finance-success)",
    },
  },
  marketCap: {
    stability: {
      label: "Stability",
      color: "var(--color-primary)",
    },
    volatility: {
      label: "Volatility",
      color: "var(--color-finance-warning)",
    },
  },
  rsi: {
    rsi: {
      label: "RSI",
      color: "var(--color-primary)",
    },
    price: {
      label: "Price",
      color: "var(--color-finance-success)",
    },
  },
  macd: {
    macd: {
      label: "MACD",
      color: "var(--color-primary)",
    },
    signal: {
      label: "Signal",
      color: "var(--color-finance-warning)",
    },
    histogram: {
      label: "Histogram",
      color: "var(--color-finance-success)",
    },
  },
  candles: {
    close: {
      label: "Close",
      color: "var(--color-primary)",
    },
    volume: {
      label: "Volume",
      color: "var(--color-chart-3)",
    },
  },
  paper: {
    equity: {
      label: "Equity Curve",
      color: "var(--color-primary)",
    },
  },
} satisfies Record<string, ChartConfig>

const MODULES: LearningModule[] = [
  {
    id: "pe-ratio",
    category: "Fundamental",
    title: "Price-to-Earnings Ratio",
    icon: DollarSign,
    summary:
      "Use P/E to ask a simple question: how many dollars is the market paying for each dollar of earnings?",
    definition:
      "The P/E ratio compares a stock's current share price with its earnings per share, making it one of the quickest ways to frame valuation.",
    formula: "P/E = Share Price / Earnings Per Share (EPS)",
    whyItMatters:
      "P/E is most useful when you compare similar companies, or the same company across time, instead of treating the number in isolation.",
    stepByStep: [
      {
        title: "Start with earnings quality",
        description:
          "Check that EPS is positive, recent, and driven by the core business rather than one-off accounting gains or losses.",
      },
      {
        title: "Compare like with like",
        description:
          "Benchmark the company against peers in the same industry. A bank, utility, and software company should not share the same valuation expectations.",
      },
      {
        title: "Connect valuation to growth",
        description:
          "A higher multiple can be reasonable when the market expects faster and more durable earnings growth.",
      },
      {
        title: "Look for change, not just level",
        description:
          "A stock can become attractive when its P/E compresses even while the business quality stays intact.",
      },
    ],
    interpretationRows: [
      {
        label: "Low multiple",
        meaning: "Usually means weak growth expectations, cyclical pressure, or a misunderstood business.",
        watch: "Do not assume cheap means undervalued.",
      },
      {
        label: "Middle of peer range",
        meaning: "Often signals a market view that the business is fairly understood.",
        watch: "Check whether margins and growth are stable.",
      },
      {
        label: "High multiple",
        meaning: "The market is paying ahead for future earnings expansion.",
        watch: "Execution misses can compress the multiple quickly.",
      },
    ],
    mistakes: [
      "Comparing P/E across unrelated industries with different capital needs and growth rates.",
      "Using P/E for companies with negative earnings where the ratio becomes meaningless.",
      "Buying a low-P/E stock without checking whether earnings are about to fall.",
    ],
    workflow: [
      "Scan the stock page fundamentals, then compare the symbol against direct competitors rather than the whole market.",
      "Use P/E after you understand revenue, margins, and earnings quality. Valuation is the last filter, not the first one.",
      "Revisit the ratio after earnings releases because the denominator can change faster than the narrative.",
    ],
    references: [
      {
        label: "Investopedia: P/E Ratio",
        href: "https://www.investopedia.com/terms/p/price-earningsratio.asp",
      },
    ],
    actionHref: "/stock/AAPL",
    actionLabel: "Open a stock page",
    accent: "bg-primary/10 text-primary",
  },
  {
    id: "market-cap",
    category: "Fundamental",
    title: "Market Capitalization",
    icon: Building2,
    summary:
      "Market cap is the market's size label for a company, and it shapes expectations around risk, liquidity, and growth runway.",
    definition:
      "Market capitalization measures the total market value of a company's outstanding shares.",
    formula: "Market Cap = Share Price × Shares Outstanding",
    whyItMatters:
      "Company size affects volatility, access to capital, analyst coverage, and how fast the business can realistically compound.",
    stepByStep: [
      {
        title: "Compute the size bucket",
        description:
          "Estimate whether the business is small-cap, mid-cap, large-cap, or mega-cap before making any judgment about upside or safety.",
      },
      {
        title: "Match size to your objective",
        description:
          "Smaller companies may offer more growth, while larger companies often bring deeper liquidity and steadier expectations.",
      },
      {
        title: "Check trading behavior",
        description:
          "Size influences spread, volume, and how violently a stock reacts to earnings, guidance, or macro news.",
      },
      {
        title: "Layer it with fundamentals",
        description:
          "Market cap tells you how big the company is, not whether it is healthy, profitable, or cheap.",
      },
    ],
    interpretationRows: [
      {
        label: "Small-cap",
        meaning: "Higher upside is possible because the company can grow from a smaller base.",
        watch: "Expect wider price swings and thinner liquidity.",
      },
      {
        label: "Mid-cap",
        meaning: "Often a blend of established operations and visible expansion potential.",
        watch: "Look for whether scaling is translating into margins.",
      },
      {
        label: "Large or mega-cap",
        meaning: "Usually reflects stronger resilience, brand recognition, and analyst coverage.",
        watch: "Growth rates can naturally slow as the base gets larger.",
      },
    ],
    mistakes: [
      "Treating a low share price as evidence that a company is small or cheap.",
      "Ignoring dilution from stock issuance or compensation plans.",
      "Using market cap as a quality score instead of a size descriptor.",
    ],
    workflow: [
      "Use market cap early in your workflow to decide what type of behavior to expect from the name.",
      "Pair it with average volume, margins, and debt so you understand both size and durability.",
      "Use paper trading to learn how small-cap and large-cap names feel different during fast sessions.",
    ],
    references: [
      {
        label: "Investopedia: Market Capitalization",
        href: "https://www.investopedia.com/terms/m/marketcapitalization.asp",
      },
    ],
    actionHref: "/dashboard",
    actionLabel: "Compare market movers",
    accent: "bg-finance-success/10 text-finance-success",
  },
  {
    id: "rsi",
    category: "Technical",
    title: "Relative Strength Index (RSI)",
    icon: Activity,
    summary:
      "RSI is a momentum oscillator that helps you judge whether recent price moves are stretched or cooling down.",
    definition:
      "RSI measures the speed and magnitude of recent price changes on a scale from 0 to 100.",
    formula: "RSI uses average gains and average losses over a look-back period, commonly 14 sessions.",
    whyItMatters:
      "RSI is useful for reading momentum context, but it becomes far more reliable when you combine it with trend direction and price structure.",
    stepByStep: [
      {
        title: "Identify the dominant trend first",
        description:
          "Momentum signals mean different things in uptrends, downtrends, and sideways markets.",
      },
      {
        title: "Watch the zone, not one print",
        description:
          "An RSI above 70 or below 30 tells you conditions are stretched, not that a reversal is guaranteed on the next candle.",
      },
      {
        title: "Wait for behavior change",
        description:
          "Many traders look for RSI to leave the extreme zone, or for price to confirm with a bounce, breakdown, or divergence.",
      },
      {
        title: "Confirm with another clue",
        description:
          "Use trendlines, moving averages, support and resistance, or volume so RSI is not making the decision alone.",
      },
    ],
    interpretationRows: [
      {
        label: "Above 70",
        meaning: "Momentum is strong and the move may be overextended.",
        watch: "Strong uptrends can stay overbought longer than expected.",
      },
      {
        label: "50 to 70",
        meaning: "Momentum still favors buyers.",
        watch: "A slide through 50 can warn that the move is losing force.",
      },
      {
        label: "30 to 50",
        meaning: "Momentum leans weaker or neutral-bearish.",
        watch: "Look for repeated failures near 50 in downtrends.",
      },
      {
        label: "Below 30",
        meaning: "Selling pressure is stretched.",
        watch: "Oversold conditions can persist during strong declines.",
      },
    ],
    mistakes: [
      "Selling every time RSI moves above 70 without asking whether the asset is in a strong uptrend.",
      "Buying every dip below 30 during a clear breakdown.",
      "Ignoring the fact that RSI works better in ranges than in forceful trend environments.",
    ],
    workflow: [
      "Use RSI after the chart already tells you whether the stock is trending, compressing, or breaking out.",
      "Focus on the 30, 50, and 70 zones rather than micromanaging every point reading.",
      "Journal which RSI setups feel intuitive in paper trading and which ones repeatedly fail in trending conditions.",
    ],
    references: [
      {
        label: "Investopedia: RSI",
        href: "https://www.investopedia.com/terms/r/rsi.asp",
      },
    ],
    actionHref: "/stock/MSFT",
    actionLabel: "Study a live chart",
    accent: "bg-finance-warning/10 text-finance-warning",
  },
  {
    id: "macd",
    category: "Technical",
    title: "MACD",
    icon: Zap,
    summary:
      "MACD tracks the distance between fast and slow exponential moving averages to highlight trend acceleration and slowdown.",
    definition:
      "MACD stands for Moving Average Convergence Divergence. It shows momentum by comparing a shorter EMA with a longer EMA.",
    formula: "MACD Line = 12-period EMA - 26-period EMA; Signal Line = 9-period EMA of the MACD line",
    whyItMatters:
      "MACD helps you see when momentum is improving, weakening, or flipping. It is especially useful when price is already forming a directional move.",
    stepByStep: [
      {
        title: "Start with the zero line",
        description:
          "Above zero usually means the short-term average is stronger than the long-term average. Below zero suggests the opposite.",
      },
      {
        title: "Watch the signal crossover",
        description:
          "When the MACD line crosses the signal line, momentum may be changing direction.",
      },
      {
        title: "Read the histogram",
        description:
          "A growing histogram suggests strengthening momentum. A shrinking histogram often signals that the trend is tiring.",
      },
      {
        title: "Check for trend agreement",
        description:
          "Crossovers matter more when price structure, support and resistance, or volume confirm the same story.",
      },
    ],
    interpretationRows: [
      {
        label: "MACD above signal and above zero",
        meaning: "Bullish momentum is aligned with an already positive regime.",
        watch: "The move can still be late if price is extended.",
      },
      {
        label: "MACD above signal but below zero",
        meaning: "Momentum is improving, but the bigger trend may still be weak.",
        watch: "Treat this as early improvement, not immediate strength.",
      },
      {
        label: "MACD below signal and below zero",
        meaning: "Momentum and trend are both weak.",
        watch: "Avoid assuming a quick reversal without price confirmation.",
      },
    ],
    mistakes: [
      "Trading every single crossover during sideways chop where MACD whipsaws.",
      "Ignoring whether the crossover happened far above or far below the zero line.",
      "Using MACD without any price context or risk level.",
    ],
    workflow: [
      "Use MACD after you have already marked the stock's trend and key support or resistance levels.",
      "Let the histogram help you judge acceleration, not just direction.",
      "If price and MACD disagree, slow down and ask whether the move is losing internal strength.",
    ],
    references: [
      {
        label: "Investopedia: MACD",
        href: "https://www.investopedia.com/terms/m/macd.asp",
      },
    ],
    actionHref: "/stock/NVDA",
    actionLabel: "Open another symbol",
    accent: "bg-finance-danger/10 text-finance-danger",
  },
  {
    id: "stock-charts",
    category: "Technical",
    title: "Reading Stock Charts",
    icon: TrendingUp,
    summary:
      "A stock chart is less about prediction and more about context: trend, participation, pressure, and where buyers or sellers are taking control.",
    definition:
      "Candlestick charts encode four prices per period: open, high, low, and close. Volume adds evidence about how much participation sat behind the move.",
    formula: "Candlestick anatomy = open, high, low, close; volume helps confirm or weaken the move.",
    whyItMatters:
      "You cannot read indicators properly if you cannot first read the underlying chart. Price structure is the base layer for everything else.",
    stepByStep: [
      {
        title: "Choose the timeframe on purpose",
        description:
          "Daily charts show cleaner structure for beginners. Very short timeframes produce more noise and more false urgency.",
      },
      {
        title: "Find the bigger trend",
        description:
          "Mark whether price is making higher highs and higher lows, lower highs and lower lows, or moving sideways.",
      },
      {
        title: "Read the candle body and wicks",
        description:
          "Long bodies signal conviction. Long upper or lower wicks show rejection and failed attempts to hold those extremes.",
      },
      {
        title: "Use volume as a lie detector",
        description:
          "Breakouts backed by heavier volume often matter more than moves that drift higher on weak participation.",
      },
    ],
    interpretationRows: [
      {
        label: "Long green body",
        meaning: "Buyers controlled the session and closed well above the open.",
        watch: "Check whether volume confirmed the move.",
      },
      {
        label: "Long upper wick",
        meaning: "Price traded higher but sellers forced a retreat before the close.",
        watch: "Repeated upper-wick rejection can mark resistance.",
      },
      {
        label: "Long lower wick",
        meaning: "Sellers pushed price down but buyers absorbed the move.",
        watch: "Useful near support, but not a guaranteed reversal.",
      },
      {
        label: "Small body or doji",
        meaning: "The session ended with indecision.",
        watch: "Indecision matters more after a strong move than in random chop.",
      },
    ],
    mistakes: [
      "Reading a single candle without checking the trend before it.",
      "Confusing a high-volume selloff with a healthy breakout.",
      "Zooming so far in that every minor wiggle feels important.",
    ],
    workflow: [
      "Start every analysis by scanning trend, major levels, and the volume profile of recent moves.",
      "Then layer RSI or MACD on top of that base chart read.",
      "If price action is messy, accept that the setup is messy. Indicators rarely rescue a poor chart.",
    ],
    references: [
      {
        label: "Investopedia: Candlestick Charts",
        href: "https://www.investopedia.com/terms/c/candlestick.asp",
      },
    ],
    actionHref: "/stock/TSLA",
    actionLabel: "Practice on a volatile chart",
    accent: "bg-chart-3/30 text-foreground",
  },
  {
    id: "paper-trading",
    category: "Practice",
    title: "Paper Trading",
    icon: MousePointerClick,
    summary:
      "Paper trading is where you turn concepts into process without paying tuition to the market.",
    definition:
      "Paper trading simulates buying and selling with virtual money so you can test execution, position sizing, and discipline before risking capital.",
    formula: "Use virtual capital, real prices, predefined rules, and a post-trade journal.",
    whyItMatters:
      "It lets you practice timing, risk control, and trade review. What it cannot fully simulate is emotional pressure once real money is involved.",
    stepByStep: [
      {
        title: "Write a setup before entering",
        description:
          "Define the thesis, entry trigger, stop level, and what would invalidate the idea before placing the trade.",
      },
      {
        title: "Size the position realistically",
        description:
          "Trade as if the money were real. Oversizing in simulation creates habits that break the moment risk matters.",
      },
      {
        title: "Journal every result",
        description:
          "Record what you saw, why you acted, what worked, and what you ignored. Good review compounds faster than random practice.",
      },
      {
        title: "Review the process weekly",
        description:
          "Measure rule-following, not just profit. A green week with sloppy entries is worse training than a flat week with disciplined execution.",
      },
    ],
    interpretationRows: [
      {
        label: "Useful for",
        meaning: "Testing setups, learning order flow, and practicing risk rules.",
        watch: "Keep sizing and constraints realistic.",
      },
      {
        label: "Less reliable for",
        meaning: "Simulating emotional stress, slippage pressure, or revenge trading behavior.",
        watch: "Real money changes decision quality.",
      },
      {
        label: "Best success metric",
        meaning: "Consistency of process and repeatability of decisions.",
        watch: "Do not grade yourself only on P&L.",
      },
    ],
    mistakes: [
      "Taking random trades because losses do not feel real.",
      "Changing strategy every few days before any real sample size exists.",
      "Tracking only wins and ignoring whether the entries followed the plan.",
    ],
    workflow: [
      "Use the app's virtual portfolio as a lab: thesis, entry, stop, journal, review.",
      "Replay the same setup across multiple stocks so you learn pattern behavior rather than one lucky trade.",
      "Graduate to live trading only after process consistency, not after one hot streak.",
    ],
    references: [
      {
        label: "Investopedia: Paper Trade",
        href: "https://www.investopedia.com/terms/p/papertrade.asp",
      },
    ],
    actionHref: "/portfolio",
    actionLabel: "Launch paper portfolio",
    accent: "bg-secondary text-secondary-foreground",
  },
]

const overallStudySteps = [
  {
    title: "Start with business context",
    body: "Use market cap to understand company size, then use P/E to frame how expensive the market believes those earnings are.",
  },
  {
    title: "Read the chart before the indicator",
    body: "Map trend, support, resistance, and volume first. Only then bring in RSI and MACD to judge momentum.",
  },
  {
    title: "Convert ideas into repeatable practice",
    body: "Paper trade the same ruleset until you can explain both your wins and your mistakes without hand-waving.",
  },
]

const allReferences = MODULES.flatMap((module) =>
  module.references.map((reference) => ({
    ...reference,
    module: module.title,
  }))
)

function SourcePill({ reference }: { reference: ModuleReference }) {
  return (
    <Button asChild variant="outline" size="xs" className="h-7 rounded-full">
      <a href={reference.href} target="_blank" rel="noreferrer">
        {reference.label}
        <ArrowUpRight className="size-3" />
      </a>
    </Button>
  )
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border/20 bg-muted/25 p-4">
      <div className="mb-4 space-y-1">
        <h3 className="font-heading text-sm font-bold text-foreground">{title}</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

function ModuleSection({ module, index }: { module: LearningModule; index: number }) {
  const Icon = module.icon

  return (
    <section id={module.id} className="scroll-mt-24">
      <Card className="overflow-hidden border-border/20 bg-card shadow-md shadow-foreground/5">
        <CardHeader className="space-y-5 border-b border-border/10 pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Module {index + 1}</Badge>
                <Badge variant="secondary">{module.category}</Badge>
              </div>
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border/20",
                    module.accent
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="font-heading text-2xl font-bold tracking-tight text-foreground">
                    {module.title}
                  </CardTitle>
                  <CardDescription className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {module.summary}
                  </CardDescription>
                </div>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full lg:w-auto">
              <Link href={module.actionHref}>{module.actionLabel}</Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
            <ModuleChart moduleId={module.id} />

            <div className="space-y-4">
              <div className="rounded-2xl border border-border/20 bg-background/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Definition
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{module.definition}</p>
              </div>
              <div className="rounded-2xl border border-border/20 bg-background/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Formula Or Core Reading Rule
                </p>
                <p className="mt-2 font-mono text-sm font-bold text-foreground">{module.formula}</p>
              </div>
              <div className="rounded-2xl border border-border/20 bg-background/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Why It Matters
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {module.whyItMatters}
                </p>
              </div>
            </div>
          </div>

          <Separator className="bg-border/20" />

          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold text-foreground">
                Step-by-step workflow
              </h3>
              <p className="text-sm text-muted-foreground">
                Follow these in order instead of jumping straight to a conclusion.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {module.stepByStep.map((step, stepIndex) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-border/20 bg-background/70 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Step {stepIndex + 1}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {stepIndex + 1}/{module.stepByStep.length}
                    </span>
                  </div>
                  <Progress
                    value={((stepIndex + 1) / module.stepByStep.length) * 100}
                    className="mb-4 h-1.5"
                  />
                  <h4 className="text-sm font-bold text-foreground">{step.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="rounded-2xl border border-border/20 bg-background/70 p-4">
              <div className="mb-4 space-y-1">
                <h3 className="font-heading text-lg font-bold text-foreground">
                  Interpretation guide
                </h3>
                <p className="text-sm text-muted-foreground">
                  Treat the label as context. The explanation column matters more than the label.
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reading</TableHead>
                    <TableHead>Meaning</TableHead>
                    <TableHead>What to watch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {module.interpretationRows.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="font-bold text-foreground">{row.label}</TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        {row.meaning}
                      </TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        {row.watch}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-border/20 bg-background/70 p-4">
                <h3 className="font-heading text-lg font-bold text-foreground">
                  Common beginner mistakes
                </h3>
                <div className="mt-4 space-y-3">
                  {module.mistakes.map((mistake) => (
                    <div
                      key={mistake}
                      className="flex items-start gap-3 rounded-xl border border-border/15 bg-card px-3 py-3"
                    >
                      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-finance-danger" />
                      <p className="text-sm leading-relaxed text-muted-foreground">{mistake}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/20 bg-background/70 p-4">
                <h3 className="font-heading text-lg font-bold text-foreground">
                  How to use this inside StockViz
                </h3>
                <div className="mt-4 space-y-3">
                  {module.workflow.map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-border/15 bg-card px-3 py-3 text-sm leading-relaxed text-muted-foreground"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border/10 pt-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              References
            </span>
            {module.references.map((reference) => (
              <SourcePill key={reference.href} reference={reference} />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function ModuleChart({ moduleId }: { moduleId: string }) {
  if (moduleId === "pe-ratio") {
    return (
      <ChartCard
        title="P/E only becomes useful in comparison"
        description="The bar shows how valuation multiples can rise with growth expectations. The reference line represents an industry-style median."
      >
        <ChartContainer
          config={moduleChartConfig.pe}
          className="h-[280px] w-full [&_.recharts-surface]:outline-none"
        >
          <ComposedChart data={peChartData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.2} />
            <XAxis dataKey="company" axisLine={false} tickLine={false} tickMargin={10} />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              width={38}
              tickMargin={8}
              domain={[0, 50]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(value) => `${value}%`}
            />
            <ReferenceLine
              yAxisId="left"
              y={18}
              stroke="var(--color-chart-3)"
              strokeDasharray="4 4"
              label={{ value: "Peer median", position: "insideTopRight", fill: "var(--color-muted-foreground)", fontSize: 11 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) =>
                    typeof value === "number"
                      ? name === "growth"
                        ? `${value}%`
                        : `${value.toFixed(1)}x`
                      : value
                  }
                />
              }
            />
            <Bar yAxisId="left" dataKey="pe" fill="var(--color-pe)" radius={[8, 8, 0, 0]} />
            <Line
              yAxisId="right"
              dataKey="growth"
              type="monotone"
              stroke="var(--color-growth)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--color-growth)" }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ChartContainer>
      </ChartCard>
    )
  }

  if (moduleId === "market-cap") {
    return (
      <ChartCard
        title="Company size changes the stock's personality"
        description="This simplified teaching view shows a common tradeoff: as size grows, stability often improves while raw volatility tends to fall."
      >
        <ChartContainer
          config={moduleChartConfig.marketCap}
          className="h-[280px] w-full [&_.recharts-surface]:outline-none"
        >
          <BarChart data={marketCapChartData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.2} />
            <XAxis dataKey="bucket" axisLine={false} tickLine={false} tickMargin={10} />
            <YAxis axisLine={false} tickLine={false} width={38} tickMargin={8} domain={[0, 100]} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (typeof value === "number" ? `${value}/100` : value)}
                />
              }
            />
            <Bar dataKey="stability" fill="var(--color-stability)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="volatility" fill="var(--color-volatility)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </ChartCard>
    )
  }

  if (moduleId === "rsi") {
    return (
      <ChartCard
        title="RSI is a momentum gauge, not a reversal guarantee"
        description="The shaded areas mark oversold and overbought territory. Notice how RSI can stay elevated while price remains strong."
      >
        <ChartContainer
          config={moduleChartConfig.rsi}
          className="h-[280px] w-full [&_.recharts-surface]:outline-none"
        >
          <LineChart data={rsiChartData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.2} />
            <ReferenceArea y1={70} y2={100} fill="var(--color-finance-danger)" fillOpacity={0.08} />
            <ReferenceArea y1={0} y2={30} fill="var(--color-finance-success)" fillOpacity={0.08} />
            <ReferenceLine y={70} stroke="var(--color-finance-danger)" strokeDasharray="4 4" />
            <ReferenceLine y={50} stroke="var(--color-chart-3)" strokeDasharray="4 4" />
            <ReferenceLine y={30} stroke="var(--color-finance-success)" strokeDasharray="4 4" />
            <XAxis dataKey="session" axisLine={false} tickLine={false} tickMargin={10} />
            <YAxis axisLine={false} tickLine={false} width={38} tickMargin={8} domain={[0, 100]} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) =>
                    typeof value === "number"
                      ? name === "price"
                        ? formatUsd(value, 0)
                        : value.toFixed(0)
                      : value
                  }
                />
              }
            />
            <Line
              dataKey="rsi"
              type="monotone"
              stroke="var(--color-rsi)"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="price"
              type="monotone"
              stroke="var(--color-price)"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </ChartCard>
    )
  }

  if (moduleId === "macd") {
    return (
      <ChartCard
        title="MACD shows acceleration, slowdown, and crossover"
        description="The bars represent the histogram. When the histogram shrinks, momentum is fading even before the trend fully flips."
      >
        <ChartContainer
          config={moduleChartConfig.macd}
          className="h-[280px] w-full [&_.recharts-surface]:outline-none"
        >
          <ComposedChart data={macdChartData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.2} />
            <ReferenceLine y={0} stroke="var(--color-chart-3)" strokeDasharray="4 4" />
            <XAxis dataKey="period" axisLine={false} tickLine={false} tickMargin={10} />
            <YAxis axisLine={false} tickLine={false} width={42} tickMargin={8} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    typeof value === "number" ? value.toFixed(2) : value
                  }
                />
              }
            />
            <Bar dataKey="histogram" radius={[6, 6, 0, 0]}>
              {macdChartData.map((item) => (
                <Cell
                  key={item.period}
                  fill={
                    item.histogram >= 0
                      ? "var(--color-finance-success)"
                      : "var(--color-finance-danger)"
                  }
                />
              ))}
            </Bar>
            <Line
              dataKey="macd"
              type="monotone"
              stroke="var(--color-macd)"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="signal"
              type="monotone"
              stroke="var(--color-signal)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ChartContainer>
      </ChartCard>
    )
  }

  if (moduleId === "stock-charts") {
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]">
        <ChartCard
          title="Price needs context from volume"
          description="Breakouts and reversals become more believable when volume expands alongside the move."
        >
          <ChartContainer
            config={moduleChartConfig.candles}
            className="h-[280px] w-full [&_.recharts-surface]:outline-none"
          >
            <ComposedChart data={priceVolumeChartData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.2} />
              <XAxis dataKey="candle" axisLine={false} tickLine={false} tickMargin={10} />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                width={40}
                tickMargin={8}
                tickFormatter={(value) => formatUsd(value, 0)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                width={42}
                tickFormatter={(value) => `${value.toFixed(1)}M`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) =>
                      typeof value === "number"
                        ? name === "volume"
                          ? `${value.toFixed(1)}M`
                          : formatUsd(value, 2)
                        : value
                    }
                  />
                }
              />
              <Bar yAxisId="right" dataKey="volume" fill="var(--color-volume)" radius={[8, 8, 0, 0]} />
              <Line
                yAxisId="left"
                dataKey="close"
                type="monotone"
                stroke="var(--color-close)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "var(--color-close)" }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ChartContainer>
        </ChartCard>

        <div className="rounded-2xl border border-border/20 bg-muted/25 p-4">
          <div className="space-y-1">
            <h3 className="font-heading text-sm font-bold text-foreground">Candlestick anatomy</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Read the body first, then the wicks, then the volume behind the candle.
            </p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/15 bg-card px-3 py-4 text-center">
              <div className="mx-auto flex h-24 w-10 items-center justify-center">
                <div className="relative h-20 w-10">
                  <div className="absolute left-1/2 top-0 h-20 w-px -translate-x-1/2 bg-foreground/70" />
                  <div className="absolute left-1/2 top-6 h-9 w-6 -translate-x-1/2 rounded-sm bg-finance-success/80" />
                </div>
              </div>
              <p className="text-xs font-bold text-foreground">Bullish candle</p>
              <p className="mt-1 text-xs text-muted-foreground">Close finished above open.</p>
            </div>
            <div className="rounded-xl border border-border/15 bg-card px-3 py-4 text-center">
              <div className="mx-auto flex h-24 w-10 items-center justify-center">
                <div className="relative h-20 w-10">
                  <div className="absolute left-1/2 top-0 h-20 w-px -translate-x-1/2 bg-foreground/70" />
                  <div className="absolute left-1/2 top-4 h-11 w-6 -translate-x-1/2 rounded-sm bg-finance-danger/80" />
                </div>
              </div>
              <p className="text-xs font-bold text-foreground">Bearish candle</p>
              <p className="mt-1 text-xs text-muted-foreground">Close finished below open.</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            <p><span className="font-bold text-foreground">Body:</span> distance between open and close.</p>
            <p><span className="font-bold text-foreground">Upper wick:</span> rejection above the close or open.</p>
            <p><span className="font-bold text-foreground">Lower wick:</span> rejection below the close or open.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ChartCard
      title="Paper trading should train process, not ego"
      description="This example equity curve improves only after the trader stops chasing and starts reviewing decisions."
    >
      <ChartContainer
        config={moduleChartConfig.paper}
        className="h-[280px] w-full [&_.recharts-surface]:outline-none"
      >
        <AreaChart data={paperTradingChartData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="paper-equity-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-equity)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--color-equity)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.2} />
          <XAxis dataKey="week" axisLine={false} tickLine={false} tickMargin={10} />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={64}
            tickMargin={8}
            tickFormatter={(value) => formatCompactUsd(value)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => (typeof value === "number" ? formatUsd(value, 0) : value)}
                labelFormatter={(_, payload) => {
                  const lesson = payload?.[0]?.payload?.lesson
                  return typeof lesson === "string" ? lesson : "Paper trade"
                }}
              />
            }
          />
          <Area
            dataKey="equity"
            type="monotone"
            stroke="var(--color-equity)"
            strokeWidth={2.5}
            fill="url(#paper-equity-fill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  )
}

export function LearnExperience() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      <main className="mx-auto w-full max-w-6xl space-y-10 px-6 py-10">
        <section className="relative overflow-hidden rounded-3xl border border-border/20 bg-card/80 shadow-md shadow-foreground/5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(173,179,178,0.16),transparent_42%)]" />
          <div className="relative grid gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1.2fr)_340px] lg:px-8 lg:py-10">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Learning Center</Badge>
                <Badge variant="secondary">Detailed guide</Badge>
                <Badge variant="outline">Built from core market concepts</Badge>
              </div>

              <div className="space-y-3">
                <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Learn the market in the same language the product uses
                </h1>
                <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
                  This page turns StockViz into a study surface, not just a dashboard. Each
                  module explains what the concept measures, how to read it step by step, what
                  the common traps look like, and how to practice it inside the app.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/20 bg-background/70 p-4">
                  <p className="text-2xl font-bold text-foreground">{MODULES.length}</p>
                  <p className="mt-1 text-sm text-muted-foreground">detailed modules</p>
                </div>
                <div className="rounded-2xl border border-border/20 bg-background/70 p-4">
                  <p className="text-2xl font-bold text-foreground">
                    {MODULES.reduce((total, module) => total + module.stepByStep.length, 0)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">workflow steps</p>
                </div>
                <div className="rounded-2xl border border-border/20 bg-background/70 p-4">
                  <p className="text-2xl font-bold text-foreground">{allReferences.length}</p>
                  <p className="mt-1 text-sm text-muted-foreground">reference links</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {MODULES.map((module) => (
                  <Button key={module.id} asChild variant="outline" size="sm" className="rounded-full">
                    <a href={`#${module.id}`}>{module.title}</a>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-border/20 bg-background/75 p-5">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Study order
                </p>
                <h2 className="font-heading text-lg font-bold text-foreground">
                  A practical learning path
                </h2>
              </div>

              <div className="space-y-4">
                {overallStudySteps.map((step, index) => (
                  <div key={step.title} className="rounded-xl border border-border/15 bg-card px-4 py-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                      <p className="text-sm font-bold text-foreground">{step.title}</p>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild className="flex-1">
                  <Link href="/portfolio">Start paper trading</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/stock/AAPL">Analyze a stock</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Alert className="border-border/20 bg-card/70">
          <BookOpen className="size-4" />
          <AlertTitle>How this content was framed</AlertTitle>
          <AlertDescription>
            The explanations below were written to match the app&apos;s current workflows and were
            cross-checked against Investopedia reference pages for valuation, momentum,
            candlesticks, and paper trading. Use the references at the end of each module for
            deeper reading.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 lg:grid-cols-3">
          {MODULES.map((module) => (
            <Card key={module.id} className="border-border/20 bg-card/70 shadow-sm shadow-foreground/5">
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-2xl border border-border/20",
                      module.accent
                    )}
                  >
                    <module.icon className="size-4" />
                  </div>
                  <Badge variant="outline">{module.category}</Badge>
                </div>
                <div className="space-y-2">
                  <h2 className="font-heading text-lg font-bold text-foreground">{module.title}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{module.summary}</p>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {module.stepByStep.length} guided steps
                  </p>
                  <Button asChild variant="ghost" size="sm">
                    <a href={`#${module.id}`}>Jump in</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-8">
          {MODULES.map((module, index) => (
            <ModuleSection key={module.id} module={module} index={index} />
          ))}
        </div>

        <Card className="border-border/20 bg-card shadow-md shadow-foreground/5">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="font-heading text-xl font-bold text-foreground">
                  Reference shelf
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Source material reviewed while expanding this page.
                </CardDescription>
              </div>
              <Badge variant="outline">{allReferences.length} links</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {allReferences.map((reference) => (
              <a
                key={`${reference.module}-${reference.href}`}
                href={reference.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-border/20 bg-background/70 p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-foreground">{reference.label}</p>
                    <p className="text-xs text-muted-foreground">{reference.module}</p>
                  </div>
                  <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                </div>
              </a>
            ))}
          </CardContent>
        </Card>

        <div className="rounded-3xl border border-border/20 bg-card/70 px-6 py-6 shadow-sm shadow-foreground/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Next move
              </p>
              <h2 className="font-heading text-2xl font-bold text-foreground">
                Practice one module immediately
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                The fastest way to retain this material is to pick one live symbol, read its
                chart, check its valuation context, and then paper trade a setup with written
                rules.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild>
                <Link href="/portfolio">Open simulator</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">Return to dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
