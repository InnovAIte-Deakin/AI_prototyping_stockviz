"use client";

import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SearchResultItem } from "@/lib/types";

type SearchResponse = {
  results?: SearchResultItem[];
};

type SymbolSearchProps = {
  placeholder?: string;
  submitLabel?: string;
  initialQuery?: string;
  compact?: boolean;
};

export function SymbolSearch({
  placeholder = "Search by ticker or company name",
  submitLabel = "Open analysis",
  initialQuery = "",
  compact = false,
}: SymbolSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query.trim());
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (deferredQuery.length < 1) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/search?query=${encodeURIComponent(deferredQuery)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as SearchResponse;
        setResults(payload.results || []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [deferredQuery]);

  const openAnalysis = (symbol: string) => {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) return;

    startTransition(() => {
      router.push(`/analysis/${encodeURIComponent(normalized)}`);
    });
  };

  const canSubmit = query.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className={`flex ${compact ? "flex-col gap-2 sm:flex-row" : "flex-col gap-3 sm:flex-row"}`}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b908f]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            className="h-12 rounded-xl border-[#d8d4d0] bg-white pl-11 text-base shadow-sm focus-visible:border-[#5f5e5e] focus-visible:ring-0"
          />
        </div>
        <Button
          type="button"
          disabled={!canSubmit || isPending}
          onClick={() => openAnalysis(query)}
          className="h-12 rounded-xl bg-[#5f5e5e] px-5 text-white hover:bg-[#4f4e4e]"
        >
          {isPending ? "Opening..." : submitLabel}
        </Button>
      </div>

      {deferredQuery.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#e4e0dc] bg-white shadow-sm">
          {isLoading ? (
            <div className="px-4 py-4 text-sm text-[#6a706f]">Searching...</div>
          ) : results.length > 0 ? (
            <ul className="divide-y divide-[#efeae6]">
              {results.map((result) => (
                <li key={`${result.symbol}-${result.name || ""}`}>
                  <button
                    type="button"
                    onClick={() => openAnalysis(result.symbol)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f6f3f0]"
                  >
                    <div>
                      <p className="font-semibold text-[#2d3433]">{result.symbol}</p>
                      <p className="text-sm text-[#6a706f]">{result.name || "Unnamed listing"}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#6a706f]">
                      <span>{result.region || result.type || "Market"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-4 text-sm text-[#6a706f]">
              No matches found. You can still open analysis for{" "}
              <span className="font-medium">&quot;{deferredQuery.toUpperCase()}&quot;</span> directly.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
