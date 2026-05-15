import { describe, expect, it } from "vitest";

import { dashboardIntegrationFeatures } from "@/lib/dashboard/integration-feature-links";

describe("dashboardIntegrationFeatures", () => {
  it("maps every integrated staging feature to a visible dashboard destination", () => {
    expect(dashboardIntegrationFeatures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: "/stock/AAPL",
          title: "Technical analysis",
        }),
        expect.objectContaining({
          href: "/stock/AAPL",
          title: "Price range explanations",
        }),
        expect.objectContaining({
          href: "/portfolio",
          title: "Paper trading",
        }),
        expect.objectContaining({
          href: "/dashboard#market-movers",
          title: "Market movers",
        }),
      ]),
    );

    expect(dashboardIntegrationFeatures).toHaveLength(7);
  });
});
