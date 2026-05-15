// @vitest-environment happy-dom

import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import Navbar from "@/components/layout/navbar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/analysis/TSLA",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme: vi.fn(),
    theme: "light",
  }),
}));

vi.mock("@/hooks/use-symbol-search", () => ({
  useSymbolSearch: () => ({
    error: null,
    isLoading: false,
    results: [],
  }),
}));

describe("Navbar theme toggle", () => {
  it("renders a stable theme icon before the client has mounted", () => {
    const html = renderToString(<Navbar />);
    const toggleStart = html.indexOf('id="theme-toggle"');
    const toggleEnd = html.indexOf("Toggle theme", toggleStart);
    const toggleHtml = html.slice(toggleStart, toggleEnd);

    expect(toggleHtml).toContain("lucide-monitor");
    expect(toggleHtml).not.toContain("lucide-sun");
  });
});
