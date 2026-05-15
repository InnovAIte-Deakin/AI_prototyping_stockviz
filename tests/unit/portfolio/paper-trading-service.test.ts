import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, fetchFinnhubQuoteMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  fetchFinnhubQuoteMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/finnhub/quote", () => ({
  fetchFinnhubQuote: fetchFinnhubQuoteMock,
  getExecutableLastPriceUsd: (quote: { c?: number }) =>
    typeof quote.c === "number" && Number.isFinite(quote.c) && quote.c > 0
      ? quote.c
      : null,
  validateQuoteSymbol: (raw: string | null | undefined) => {
    const value = raw?.trim() ?? "";
    return value ? value.toUpperCase() : null;
  },
}));

type SupabaseResult = {
  data: unknown;
  error: { message?: string } | null;
};

const createProfileQuery = (result: SupabaseResult) => {
  const query = {
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => result),
    select: vi.fn(() => query),
  };

  return query;
};

const createListQuery = (
  result: SupabaseResult,
  options: { orderIsTerminal?: boolean } = {},
) => {
  const query = {
    eq: vi.fn(() => query),
    limit: vi.fn(async () => result),
    order: vi.fn(() => (options.orderIsTerminal ? result : query)),
    select: vi.fn(() => query),
  };

  return query;
};

describe("paper trading service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads paper cash, marked positions, and recent transactions", async () => {
    const profileQuery = createProfileQuery({
      data: { paper_cash_usd: 5000 },
      error: null,
    });
    const holdingsQuery = createListQuery(
      {
        data: [
          {
            acquired_at: null,
            avg_price: 100,
            created_at: "2026-05-01T00:00:00Z",
            id: "holding-1",
            notes: null,
            shares: 2,
            symbol: "AAPL",
            updated_at: "2026-05-01T00:00:00Z",
            user_id: "user-1",
          },
        ],
        error: null,
      },
      { orderIsTerminal: true },
    );
    const transactionsQuery = createListQuery({
      data: [
        {
          created_at: "2026-05-02T00:00:00Z",
          executed_at: "2026-05-02T00:00:00Z",
          id: "tx-1",
          realized_pl_usd: null,
          shares: 2,
          side: "buy",
          symbol: "AAPL",
          total_cash_delta_usd: -200,
          unit_price_usd: 100,
          user_id: "user-1",
        },
      ],
      error: null,
    });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") return profileQuery;
        if (table === "portfolio_holdings") return holdingsQuery;
        if (table === "portfolio_transactions") return transactionsQuery;
        throw new Error(`Unexpected table ${table}`);
      }),
    };
    createClientMock.mockResolvedValue(supabase);
    fetchFinnhubQuoteMock.mockResolvedValue({ c: 120 });

    const { loadPaperPortfolioSnapshot } = await import(
      "@/lib/portfolio/paper-trading-service"
    );
    const snapshot = await loadPaperPortfolioSnapshot("user-1");

    expect(snapshot.enabled).toBe(true);
    expect(snapshot.cashUsd).toBe(5000);
    expect(snapshot.summary.marketValueUsd).toBe(240);
    expect(snapshot.summary.equityUsd).toBe(5240);
    expect(snapshot.positions[0]).toMatchObject({
      markPriceUsd: 120,
      marketValueUsd: 240,
      symbol: "AAPL",
      unrealizedPlPct: 20,
      unrealizedPlUsd: 40,
    });
    expect(snapshot.transactions).toHaveLength(1);
    expect(fetchFinnhubQuoteMock).toHaveBeenCalledWith("AAPL", {
      cache: "no-store",
    });
  });
});
