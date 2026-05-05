import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();
const upsertMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      expect(table).toBe("provider_preferences");
      return {
        select: selectMock,
        upsert: upsertMock,
      };
    },
  }),
}));

describe("provider preference database service", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/lib/market/provider-preferences");
    mod.resetProviderPreferencesCache();
  });

  it("loads provider preferences from Supabase", async () => {
    selectMock.mockResolvedValueOnce({
      data: [
        {
          capability: "stock_ohlcv",
          fallback_enabled: true,
          provider: "twelveData",
          updated_at: "2026-05-05T00:00:00.000Z",
          updated_by: "admin-1",
        },
      ],
      error: null,
    });

    const { getProviderPreferences } = await import(
      "@/lib/market/provider-preferences"
    );

    await expect(
      getProviderPreferences({ forceRefresh: true }),
    ).resolves.toMatchObject({
      stock_ohlcv: {
        fallbackEnabled: true,
        provider: "twelveData",
        updatedBy: "admin-1",
      },
      fundamentals: {
        fallbackEnabled: true,
        provider: "yahooFinance",
      },
    });
  });

  it("saves provider preferences with fallback enabled", async () => {
    upsertMock.mockResolvedValueOnce({ error: null });
    selectMock.mockResolvedValueOnce({
      data: [
        {
          capability: "fundamentals",
          fallback_enabled: true,
          provider: "fmp",
          updated_at: "2026-05-05T00:00:00.000Z",
          updated_by: "admin-1",
        },
      ],
      error: null,
    });

    const { saveProviderPreferences } = await import(
      "@/lib/market/provider-preferences"
    );

    await saveProviderPreferences({
      preferences: [{ capability: "fundamentals", provider: "fmp" }],
      updatedBy: "admin-1",
    });

    expect(upsertMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          capability: "fundamentals",
          fallback_enabled: true,
          provider: "fmp",
          updated_by: "admin-1",
        }),
      ],
      { onConflict: "capability" },
    );
  });

  it("rejects providers that are not supported for a capability", async () => {
    const { saveProviderPreferences } = await import(
      "@/lib/market/provider-preferences"
    );

    await expect(
      saveProviderPreferences({
        preferences: [{ capability: "stock_price_series", provider: "fmp" }],
        updatedBy: "admin-1",
      }),
    ).rejects.toThrow("fmp is not supported for stock_price_series");
  });
});
