// @vitest-environment happy-dom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SymbolSearch } from "@/components/search/symbol-search";

const router = {
  prefetch: vi.fn(),
  push: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

type MockedFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

const mockFetchJson = (payload: unknown, init?: ResponseInit) => {
  const fetchMock = vi.fn<MockedFetch>(async () =>
    Response.json(payload, init),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("SymbolSearch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("opens the top resolved ticker when submitting a company-name search", async () => {
    mockFetchJson({
      results: [
        {
          name: "Microsoft Corporation",
          region: "NASDAQ",
          symbol: "MSFT",
          type: "EQUITY",
        },
      ],
      source: "Yahoo Finance",
      status: "success",
    });

    render(<SymbolSearch submitLabel="Go" />);

    fireEvent.change(screen.getByPlaceholderText("Search by ticker or company name"), {
      target: { value: "microsoft" },
    });

    await waitFor(() => expect(screen.getByText("MSFT")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Go" }));

    expect(router.push).toHaveBeenCalledWith("/analysis/MSFT");
  });
});
