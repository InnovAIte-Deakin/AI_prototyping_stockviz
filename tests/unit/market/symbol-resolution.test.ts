import { describe, expect, it } from "vitest";

import { getResolvedSymbolRedirect } from "@/lib/market/symbol-resolution";

describe("symbol resolution", () => {
  it("redirects a company-name route to the top matching ticker", () => {
    expect(
      getResolvedSymbolRedirect("MICROSOFT", [
        {
          name: "Microsoft Corporation",
          region: "NASDAQ",
          symbol: "MSFT",
          type: "EQUITY",
        },
      ]),
    ).toBe("MSFT");
  });

  it("does not redirect when the top result is already the requested ticker", () => {
    expect(
      getResolvedSymbolRedirect("MSFT", [
        {
          name: "Microsoft Corporation",
          region: "NASDAQ",
          symbol: "MSFT",
          type: "EQUITY",
        },
      ]),
    ).toBeNull();
  });

  it("does not redirect unrelated search results", () => {
    expect(
      getResolvedSymbolRedirect("UNKNOWN", [
        {
          name: "Microsoft Corporation",
          region: "NASDAQ",
          symbol: "MSFT",
          type: "EQUITY",
        },
      ]),
    ).toBeNull();
  });
});
