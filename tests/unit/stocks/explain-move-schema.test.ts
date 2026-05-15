import { describe, expect, it } from "vitest";

import { explainMoveRequestSchema } from "@/lib/stocks/explain-move-schema";

describe("explainMoveRequestSchema", () => {
  it("accepts a valid gainer payload", () => {
    const parsed = explainMoveRequestSchema.safeParse({
      symbol: "AAPL",
      companyName: "Apple Inc.",
      direction: "gainer",
      price: 198.42,
      change: 5.12,
      changesPercentage: 2.65,
      exchange: "NASDAQ",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid symbols", () => {
    const parsed = explainMoveRequestSchema.safeParse({
      symbol: "AAPL<script>",
      companyName: "Apple Inc.",
      direction: "loser",
      price: 198.42,
      change: -5.12,
      changesPercentage: -2.65,
    });

    expect(parsed.success).toBe(false);
  });
});
