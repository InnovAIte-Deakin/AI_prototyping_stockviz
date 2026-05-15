import { describe, expect, it } from "vitest";

import {
  filterAndRankFmpNewsForRange,
  parseFmpPublishedTime,
} from "@/lib/fmp/filter-news-by-range";

describe("filterAndRankFmpNewsForRange", () => {
  it("keeps articles inside the selected UTC date range", () => {
    const rows = filterAndRankFmpNewsForRange(
      [
        {
          title: "AAPL earnings",
          text: "Apple",
          publishedDate: "2026-05-01 12:00:00",
        },
        {
          title: "outside",
          text: "Apple",
          publishedDate: "2026-05-03 00:00:00",
        },
      ],
      {
        from: "2026-05-01",
        to: "2026-05-02",
        symbol: "AAPL",
        companyName: "Apple",
        maxItems: 8,
      },
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("AAPL earnings");
  });

  it("parses FMP space-separated timestamps as UTC", () => {
    expect(parseFmpPublishedTime("2026-05-01 12:00:00")).toBe(
      Date.parse("2026-05-01T12:00:00Z"),
    );
  });
});
