import { describe, expect, it } from "vitest";

import {
  buildYahooChartUrl,
  buildYahooQuoteSummaryUrl,
  buildYahooSearchUrl,
  normalizeYahooFundamentals,
  normalizeYahooSearchResults,
  parseYahooChartResponse,
} from "@/lib/market/yahoo-finance";

describe("Yahoo Finance helpers", () => {
  it("builds chart URLs for daily and monthly stock-detail series", () => {
    expect(buildYahooChartUrl("AAPL", "daily")).toBe(
      "https://query1.finance.yahoo.com/v8/finance/chart/AAPL?range=3mo&interval=1d&events=history&includeAdjustedClose=true",
    );
    expect(buildYahooChartUrl("BRK.B", "monthly")).toBe(
      "https://query1.finance.yahoo.com/v8/finance/chart/BRK.B?range=max&interval=1mo&events=history&includeAdjustedClose=true",
    );
  });

  it("builds quote summary URL with only the modules we use", () => {
    expect(buildYahooQuoteSummaryUrl("AAPL")).toBe(
      "https://query2.finance.yahoo.com/v10/finance/quoteSummary/AAPL?modules=defaultKeyStatistics%2CfinancialData%2CsummaryDetail%2Cearnings",
    );
  });

  it("builds search URL", () => {
    expect(buildYahooSearchUrl("apple inc")).toBe(
      "https://query2.finance.yahoo.com/v1/finance/search?q=apple+inc&quotesCount=20&newsCount=0",
    );
  });

  it("parses Yahoo chart OHLCV and filters null bars", () => {
    const parsed = parseYahooChartResponse({
      chart: {
        result: [
          {
            timestamp: [1776988800, 1777075200],
            indicators: {
              quote: [
                {
                  open: [100, null],
                  high: [105, 106],
                  low: [99.5, 101],
                  close: [104.25, 102],
                  volume: [123456, 555],
                },
              ],
            },
          },
        ],
      },
    });

    expect(parsed).toEqual({
      ok: true,
      series: [
        {
          close: 104.25,
          date: "2026-04-24",
          high: 105,
          low: 99.5,
          open: 100,
          volume: 123456,
        },
      ],
    });
  });

  it("returns a useful chart error from Yahoo responses", () => {
    expect(
      parseYahooChartResponse({
        chart: {
          error: { description: "No data found, symbol may be delisted" },
          result: null,
        },
      }),
    ).toEqual({
      ok: false,
      error: "No data found, symbol may be delisted",
    });
  });

  it("normalizes Yahoo quoteSummary fundamentals into the existing overview contract", () => {
    const normalized = normalizeYahooFundamentals({
      quoteSummary: {
        result: [
          {
            defaultKeyStatistics: {
              pegRatio: { raw: 1.8 },
              priceToBook: { raw: 12.1 },
              trailingEps: { raw: 6.43 },
            },
            financialData: {
              currentRatio: { raw: 0.95 },
              debtToEquity: { raw: 151.4 },
              operatingMargins: { raw: 0.3103 },
              profitMargins: { raw: 0.2631 },
              returnOnEquity: { raw: 1.4725 },
            },
            summaryDetail: {
              dividendYield: { raw: 0.0047 },
              trailingPE: { raw: 31.5 },
            },
          },
        ],
      },
    });

    expect(normalized).toEqual({
      source: "Yahoo Finance",
      overview: {
        CurrentRatio: 0.95,
        DebtToEquity: 151.4,
        DividendYield: 0.0047,
        EPS: 6.43,
        OperatingMarginTTM: 31.03,
        PEGRatio: 1.8,
        PERatio: 31.5,
        PriceToBookRatio: 12.1,
        ProfitMargin: 26.31,
        ReturnOnEquityTTM: 147.25,
      },
    });
  });

  it("normalizes Yahoo search results into the existing search result contract", () => {
    expect(
      normalizeYahooSearchResults({
        quotes: [
          {
            exchDisp: "NASDAQ",
            longname: "Apple Inc.",
            quoteType: "EQUITY",
            shortname: "Apple Inc.",
            symbol: "AAPL",
          },
          { shortname: "Missing symbol" },
        ],
      }),
    ).toEqual({
      source: "Yahoo Finance",
      results: [
        {
          name: "Apple Inc.",
          region: "NASDAQ",
          symbol: "AAPL",
          type: "EQUITY",
        },
      ],
    });
  });
});
