import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, upsertStocksMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  upsertStocksMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/stocks/upsert-stock", () => ({
  upsertStocks: upsertStocksMock,
}));

import {
  PortfolioAuthError,
  createHoldingForCurrentUser,
  listHoldingsForCurrentUser,
} from "@/lib/portfolio/holdings-service";

type SupabaseError = {
  code?: string;
  message?: string;
};

type SupabaseResult = {
  data: unknown;
  error: SupabaseError | null;
};

type PortfolioQuery = {
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

const createPortfolioQuery = (result: SupabaseResult): PortfolioQuery => {
  const query = {} as PortfolioQuery;

  query.delete = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.insert = vi.fn(() => query);
  query.maybeSingle = vi.fn(async () => result);
  query.order = vi.fn(async () => result);
  query.select = vi.fn(() => query);
  query.single = vi.fn(async () => result);
  query.update = vi.fn(() => query);

  return query;
};

describe("holdings service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsertStocksMock.mockResolvedValue(undefined);
  });

  it("requires an authenticated Supabase user before listing holdings", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: null },
          error: null,
        })),
      },
    });

    await expect(listHoldingsForCurrentUser()).rejects.toBeInstanceOf(
      PortfolioAuthError,
    );
  });

  it("normalizes holding symbols and writes user-scoped rows", async () => {
    const holding = {
      acquired_at: "2026-04-01",
      avg_price: 100.5,
      id: "holding-1",
      notes: "core",
      shares: 2,
      symbol: "AAPL",
      user_id: "user-1",
    };
    const query = createPortfolioQuery({ data: holding, error: null });
    const supabase = {
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "user-1" } },
          error: null,
        })),
      },
      from: vi.fn(() => query),
    };
    createClientMock.mockResolvedValue(supabase);

    await expect(
      createHoldingForCurrentUser({
        acquiredAt: "2026-04-01",
        avgPrice: 100.5,
        notes: "core",
        shares: 2,
        symbol: " aapl ",
      }),
    ).resolves.toEqual(holding);

    expect(supabase.from).toHaveBeenCalledWith("portfolio_holdings");
    expect(query.insert).toHaveBeenCalledWith({
      acquired_at: "2026-04-01",
      avg_price: 100.5,
      notes: "core",
      shares: 2,
      symbol: "AAPL",
      user_id: "user-1",
    });
    expect(upsertStocksMock).toHaveBeenCalledWith([{ symbol: "AAPL" }]);
  });
});
