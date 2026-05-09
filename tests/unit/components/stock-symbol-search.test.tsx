// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StockSymbolSearch } from "@/components/layout/stock-symbol-search";

const router = {
  push: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("@/hooks/use-symbol-search", () => ({
  useSymbolSearch: () => ({
    count: 1,
    error: null,
    isLoading: false,
    results: [
      {
        description: "Microsoft Corporation",
        displaySymbol: "MSFT",
        symbol: "MSFT",
        type: "EQUITY",
      },
    ],
  }),
}));

describe("StockSymbolSearch", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("opens selected symbols in the analysis workflow", () => {
    render(<StockSymbolSearch />);

    fireEvent.click(screen.getByRole("button", { name: "Search stocks" }));
    fireEvent.click(screen.getByText("MSFT"));

    expect(router.push).toHaveBeenCalledWith("/analysis/MSFT");
  });
});
