import type { SearchResultItem } from "@/lib/types";

const normalizeSymbol = (value: string | undefined): string =>
  String(value || "")
    .trim()
    .toUpperCase();

export function getResolvedSymbolRedirect(
  requestedSymbol: string,
  results: SearchResultItem[],
): string | null {
  const requested = normalizeSymbol(requestedSymbol);
  const first = results[0];
  const resolved = normalizeSymbol(first?.symbol);

  if (!requested || !resolved || requested === resolved) {
    return null;
  }

  const searchableResultText = `${first?.symbol || ""} ${first?.name || ""}`
    .trim()
    .toLowerCase();

  if (!searchableResultText.includes(requested.toLowerCase())) {
    return null;
  }

  return resolved;
}
