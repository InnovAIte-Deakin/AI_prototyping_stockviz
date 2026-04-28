"use client";

import * as React from "react";
import { AlertCircle, RadioTower } from "lucide-react";
import { useTheme } from "next-themes";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type TradingViewAdvancedChartProps = {
  symbol: string;
  className?: string;
  height?: number;
  interval?: TradingViewInterval;
  range?: TradingViewRange;
};

type TradingViewInterval =
  | "1"
  | "3"
  | "5"
  | "15"
  | "30"
  | "45"
  | "60"
  | "120"
  | "180"
  | "240"
  | "D"
  | "W"
  | "M";

type TradingViewRange =
  | "1D"
  | "5D"
  | "1M"
  | "3M"
  | "6M"
  | "12M"
  | "24M"
  | "60M";

type WidgetStatus = "loading" | "ready" | "error";

const TRADING_VIEW_WIDGET_SRC =
  "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

const EXCHANGE_SYMBOLS: Record<string, string> = {
  AAPL: "NASDAQ:AAPL",
  ABBV: "NYSE:ABBV",
  AMD: "NASDAQ:AMD",
  AMZN: "NASDAQ:AMZN",
  BAC: "NYSE:BAC",
  BRK_B: "NYSE:BRK.B",
  "BRK.B": "NYSE:BRK.B",
  COST: "NASDAQ:COST",
  CRM: "NYSE:CRM",
  CVX: "NYSE:CVX",
  DIS: "NYSE:DIS",
  GOOGL: "NASDAQ:GOOGL",
  HD: "NYSE:HD",
  INTC: "NASDAQ:INTC",
  JNJ: "NYSE:JNJ",
  JPM: "NYSE:JPM",
  KO: "NYSE:KO",
  MA: "NYSE:MA",
  META: "NASDAQ:META",
  MSFT: "NASDAQ:MSFT",
  NFLX: "NASDAQ:NFLX",
  NVDA: "NASDAQ:NVDA",
  ORCL: "NYSE:ORCL",
  PEP: "NASDAQ:PEP",
  PG: "NYSE:PG",
  TSLA: "NASDAQ:TSLA",
  UNH: "NYSE:UNH",
  V: "NYSE:V",
  WMT: "NYSE:WMT",
  XOM: "NYSE:XOM",
};

const RANGE_LABELS: Record<TradingViewRange, string> = {
  "1D": "1D range",
  "5D": "1W range",
  "1M": "1M range",
  "3M": "3M range",
  "6M": "6M range",
  "12M": "1Y range",
  "24M": "2Y range",
  "60M": "5Y range",
};

const TIME_FRAME_BUTTONS = [
  { text: "1d", resolution: "1", description: "1 Day", title: "1D" },
  { text: "5d", resolution: "5", description: "1 Week", title: "1W" },
  { text: "1m", resolution: "30", description: "1 Month", title: "1M" },
  { text: "3m", resolution: "60", description: "3 Months", title: "3M" },
  { text: "6m", resolution: "120", description: "6 Months", title: "6M" },
  { text: "12m", resolution: "1D", description: "1 Year", title: "1Y" },
  { text: "24m", resolution: "1W", description: "2 Years", title: "2Y" },
  { text: "60m", resolution: "1W", description: "5 Years", title: "5Y" },
];

const getDefaultIntervalForRange = (
  range: TradingViewRange,
): TradingViewInterval => {
  switch (range) {
    case "1D":
      return "1";
    case "5D":
      return "5";
    case "1M":
      return "30";
    case "3M":
      return "60";
    case "6M":
      return "120";
    case "12M":
    case "24M":
    case "60M":
      return "W";
  }
};

const normalizeTradingViewSymbol = (symbol: string): string => {
  const cleaned = symbol.trim().toUpperCase();

  if (!cleaned) {
    return "NASDAQ:AAPL";
  }

  if (cleaned.includes(":")) {
    return cleaned;
  }

  const normalizedKey = cleaned.replace("-", "_");
  return EXCHANGE_SYMBOLS[normalizedKey] ?? `NASDAQ:${cleaned}`;
};

export const TradingViewAdvancedChart = ({
  symbol,
  className,
  height = 520,
  interval,
  range = "1M",
}: TradingViewAdvancedChartProps) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = React.useState<WidgetStatus>("loading");
  const { resolvedTheme } = useTheme();

  const tradingViewSymbol = React.useMemo(
    () => normalizeTradingViewSymbol(symbol),
    [symbol],
  );
  const chartInterval = interval ?? getDefaultIntervalForRange(range);
  const widgetTheme = resolvedTheme === "dark" ? "dark" : "light";

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    setStatus("loading");
    container.replaceChildren();

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";
    container.appendChild(widgetContainer);

    const observer = new MutationObserver(() => {
      if (container.querySelector("iframe")) {
        setStatus("ready");
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    const timeoutId = window.setTimeout(() => {
      if (!container.querySelector("iframe")) {
        setStatus("error");
      }
    }, 10000);

    const widgetOptions: Record<string, unknown> = {
      autosize: true,
      symbol: tradingViewSymbol,
      interval: chartInterval,
      timeframe: range,
      timezone: "exchange",
      theme: widgetTheme,
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      calendar: false,
      time_frames: TIME_FRAME_BUTTONS,
      withdateranges: true,
      disabled_features: ["use_localstorage_for_settings"],
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      support_host: "https://www.tradingview.com",
    };

    if (range !== "24M") {
      widgetOptions.range = range;
    }

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = TRADING_VIEW_WIDGET_SRC;
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timeoutId);
      setStatus("error");
    };
    script.textContent = JSON.stringify(widgetOptions);
    container.appendChild(script);

    return () => {
      window.clearTimeout(timeoutId);
      observer.disconnect();
      container.replaceChildren();
    };
  }, [chartInterval, range, tradingViewSymbol, widgetTheme]);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RadioTower className="size-4 text-muted-foreground" aria-hidden />
          Live chart
        </CardTitle>
        <CardDescription>
          {tradingViewSymbol} · {RANGE_LABELS[range]}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className="relative overflow-hidden rounded-lg border bg-background"
          style={{ height }}
        >
          {status === "loading" ? (
            <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          ) : null}
          {status === "error" ? (
            <div className="flex h-full items-center justify-center p-4">
              <Alert variant="destructive" className="max-w-xl">
                <AlertCircle />
                <AlertTitle>Live chart unavailable</AlertTitle>
                <AlertDescription>
                  TradingView could not load this chart. Historical price
                  history is still available below.
                </AlertDescription>
              </Alert>
            </div>
          ) : null}
          <div
            ref={containerRef}
            className={cn(
              "tradingview-widget-container h-full w-full",
              status === "error" ? "hidden" : "block",
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
