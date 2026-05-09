import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((target: string) => {
  throw new Error(`REDIRECT:${target}`);
});
const updateProviderPreferencesForAdmin = vi.fn();
const clearAnalysisCacheForAdmin = vi.fn();
const cleanupExpiredAnalysisCacheForAdmin = vi.fn();

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/admin/diagnostics-service", () => ({
  cleanupExpiredAnalysisCacheForAdmin,
  clearAnalysisCacheForAdmin,
  updateProviderPreferencesForAdmin,
}));

const providerFormData = () => {
  const data = new FormData();
  data.set("provider.stock_ohlcv", "yahooFinance");
  data.set("provider.stock_price_series", "yahooFinance");
  data.set("provider.fundamentals", "alphaVantage");
  data.set("provider.symbol_search", "yahooFinance");
  data.set("provider.sentiment_news", "alphaVantage");
  return data;
};

describe("admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects with readable details when provider settings fail with a Supabase object error", async () => {
    updateProviderPreferencesForAdmin.mockRejectedValueOnce({
      code: "PGRST205",
      message:
        "Could not find the table 'public.provider_preferences' in the schema cache",
    });

    const { updateProviderPreferencesAction } = await import(
      "@/app/admin/actions"
    );

    await expect(
      updateProviderPreferencesAction(providerFormData()),
    ).rejects.toThrow(
      "REDIRECT:/admin?notice=provider-settings-error&detail=Could+not+find+the+table+%27public.provider_preferences%27+in+the+schema+cache",
    );
  });
});
