export type PriceSeriesInterval = "daily" | "monthly";

export type OhlcPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type ParsedSeries =
  | { ok: true; series: OhlcPoint[] }
  | { ok: false; error: string };

type YahooRawNumber = {
  raw?: unknown;
};

const YAHOO_CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const YAHOO_QUOTE_SUMMARY_BASE =
  "https://query2.finance.yahoo.com/v10/finance/quoteSummary";
const YAHOO_SEARCH_BASE = "https://query2.finance.yahoo.com/v1/finance/search";

const modules = [
  "defaultKeyStatistics",
  "financialData",
  "summaryDetail",
  "earnings",
];

const dateFromUnixSeconds = (seconds: number): string =>
  new Date(seconds * 1000).toISOString().slice(0, 10);

const finiteNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

const rawNumber = (value: unknown): number | null => {
  if (typeof value !== "object" || value === null) {
    return finiteNumber(value);
  }
  return finiteNumber((value as YahooRawNumber).raw);
};

const percentFromDecimal = (value: unknown): number | null => {
  const n = rawNumber(value);
  return n === null ? null : Number((n * 100).toFixed(4));
};

const compactRecord = <T extends Record<string, number | null>>(
  record: T,
): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value !== null && Number.isFinite(value)) {
      out[key] = value;
    }
  }
  return out;
};

export const buildYahooChartUrl = (
  symbol: string,
  interval: PriceSeriesInterval,
): string => {
  const params = new URLSearchParams({
    range: interval === "daily" ? "3mo" : "max",
    interval: interval === "daily" ? "1d" : "1mo",
    events: "history",
    includeAdjustedClose: "true",
  });
  return `${YAHOO_CHART_BASE}/${encodeURIComponent(symbol)}?${params}`;
};

export const buildYahooQuoteSummaryUrl = (symbol: string): string => {
  const params = new URLSearchParams({
    modules: modules.join(","),
  });
  return `${YAHOO_QUOTE_SUMMARY_BASE}/${encodeURIComponent(symbol)}?${params}`;
};

export const buildYahooSearchUrl = (query: string): string => {
  const params = new URLSearchParams({
    q: query,
    quotesCount: "20",
    newsCount: "0",
  });
  return `${YAHOO_SEARCH_BASE}?${params}`;
};

export const parseYahooChartResponse = (data: unknown): ParsedSeries => {
  if (typeof data !== "object" || data === null) {
    return { ok: false, error: "Invalid Yahoo Finance chart response" };
  }

  const root = data as Record<string, unknown>;
  const chart = root.chart as Record<string, unknown> | undefined;
  const error = chart?.error as Record<string, unknown> | null | undefined;
  const description = error?.description;
  if (typeof description === "string" && description.trim()) {
    return { ok: false, error: description.trim() };
  }

  const result = Array.isArray(chart?.result) ? chart.result[0] : null;
  if (typeof result !== "object" || result === null) {
    return { ok: false, error: "No chart result in Yahoo Finance response" };
  }

  const resultObj = result as Record<string, unknown>;
  const timestamps = resultObj.timestamp;
  const indicators = resultObj.indicators as Record<string, unknown> | undefined;
  const quote = Array.isArray(indicators?.quote) ? indicators.quote[0] : null;

  if (
    !Array.isArray(timestamps) ||
    typeof quote !== "object" ||
    quote === null
  ) {
    return { ok: false, error: "No time series data in Yahoo Finance response" };
  }

  const q = quote as Record<string, unknown[] | undefined>;
  const series: OhlcPoint[] = [];

  for (let index = 0; index < timestamps.length; index += 1) {
    const timestamp = finiteNumber(timestamps[index]);
    const open = finiteNumber(q.open?.[index]);
    const high = finiteNumber(q.high?.[index]);
    const low = finiteNumber(q.low?.[index]);
    const close = finiteNumber(q.close?.[index]);
    const volume = finiteNumber(q.volume?.[index]) ?? 0;

    if (
      timestamp === null ||
      open === null ||
      high === null ||
      low === null ||
      close === null
    ) {
      continue;
    }

    series.push({
      date: dateFromUnixSeconds(timestamp),
      open,
      high,
      low,
      close,
      volume,
    });
  }

  if (series.length === 0) {
    return { ok: false, error: "Empty time series from Yahoo Finance" };
  }

  return { ok: true, series };
};

export const normalizeYahooFundamentals = (data: unknown) => {
  const root = data as Record<string, unknown> | null;
  const quoteSummary = root?.quoteSummary as Record<string, unknown> | undefined;
  const result = Array.isArray(quoteSummary?.result)
    ? (quoteSummary.result[0] as Record<string, unknown> | undefined)
    : undefined;

  if (!result) {
    throw new Error("Invalid Yahoo Finance fundamentals response");
  }

  const defaultKeyStatistics =
    result.defaultKeyStatistics as Record<string, unknown> | undefined;
  const financialData =
    result.financialData as Record<string, unknown> | undefined;
  const summaryDetail =
    result.summaryDetail as Record<string, unknown> | undefined;

  const overview = compactRecord({
    PERatio: rawNumber(summaryDetail?.trailingPE),
    PEGRatio: rawNumber(defaultKeyStatistics?.pegRatio),
    PriceToBookRatio: rawNumber(defaultKeyStatistics?.priceToBook),
    ReturnOnEquityTTM: percentFromDecimal(financialData?.returnOnEquity),
    ProfitMargin: percentFromDecimal(financialData?.profitMargins),
    OperatingMarginTTM: percentFromDecimal(financialData?.operatingMargins),
    EPS: rawNumber(defaultKeyStatistics?.trailingEps),
    DividendYield: rawNumber(summaryDetail?.dividendYield),
    DebtToEquity: rawNumber(financialData?.debtToEquity),
    CurrentRatio: rawNumber(financialData?.currentRatio),
  });

  if (Object.keys(overview).length === 0) {
    throw new Error("Yahoo Finance fundamentals response had no usable metrics");
  }

  return {
    source: "Yahoo Finance",
    overview,
  };
};

export const normalizeYahooSearchResults = (data: unknown) => {
  const root = data as Record<string, unknown> | null;
  const quotes = Array.isArray(root?.quotes) ? root.quotes : [];

  return {
    source: "Yahoo Finance",
    results: quotes
      .map((quote) => {
        if (typeof quote !== "object" || quote === null) {
          return null;
        }
        const q = quote as Record<string, unknown>;
        const symbol = typeof q.symbol === "string" ? q.symbol.trim() : "";
        if (!symbol) {
          return null;
        }
        const name =
          typeof q.longname === "string" && q.longname.trim()
            ? q.longname.trim()
            : typeof q.shortname === "string" && q.shortname.trim()
              ? q.shortname.trim()
              : symbol;
        return {
          symbol,
          name,
          type: typeof q.quoteType === "string" ? q.quoteType : "Equity",
          region: typeof q.exchDisp === "string" ? q.exchDisp : "Yahoo",
        };
      })
      .filter(
        (
          item,
        ): item is {
          symbol: string;
          name: string;
          type: string;
          region: string;
        } => item !== null,
      )
      .slice(0, 20),
  };
};
