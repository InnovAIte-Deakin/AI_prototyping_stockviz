import type { PaperPortfolioSnapshot } from "@/lib/portfolio/paper-trading-service";
import { cn } from "@/lib/utils";

type PaperPortfolioPanelProps = {
  className?: string;
  snapshot: PaperPortfolioSnapshot;
};

const formatCurrency = (value: number | null | undefined): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--";
  }

  return new Intl.NumberFormat(undefined, {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
};

const formatNumber = (value: number): string =>
  new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 4,
  }).format(value);

const formatPercent = (value: number | null | undefined): string =>
  typeof value === "number" && Number.isFinite(value)
    ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
    : "--";

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export function PaperPortfolioPanel({
  className,
  snapshot,
}: PaperPortfolioPanelProps) {
  const changeClass =
    snapshot.summary.unrealizedPlUsd >= 0
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";

  return (
    <section className={cn("w-full bg-[#f9f9f8] px-6 pb-10 md:px-10", className)}>
      <div className="mx-auto max-w-7xl rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold">
              Paper portfolio
            </h2>
            <p className="text-muted-foreground text-sm">
              Simulated cash, positions, and executed paper trades.
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-right">
            <p className="text-muted-foreground text-xs">Equity</p>
            <p className="font-semibold tabular-nums">
              {formatCurrency(snapshot.summary.equityUsd)}
            </p>
          </div>
        </div>

        {!snapshot.enabled ? (
          <div className="mt-4 rounded-lg border border-dashed bg-muted/20 p-4">
            <p className="text-sm font-medium">Paper trading is not enabled.</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {snapshot.error ??
                "Apply the paper trading migration to add paper cash for this profile."}
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <dt className="text-muted-foreground text-xs">Cash</dt>
                <dd className="font-semibold tabular-nums">
                  {formatCurrency(snapshot.cashUsd)}
                </dd>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <dt className="text-muted-foreground text-xs">Positions</dt>
                <dd className="font-semibold tabular-nums">
                  {snapshot.positions.length}
                </dd>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <dt className="text-muted-foreground text-xs">Market value</dt>
                <dd className="font-semibold tabular-nums">
                  {formatCurrency(snapshot.summary.marketValueUsd)}
                </dd>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <dt className="text-muted-foreground text-xs">Cost basis</dt>
                <dd className="font-semibold tabular-nums">
                  {formatCurrency(snapshot.summary.totalCostBasisUsd)}
                </dd>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <dt className="text-muted-foreground text-xs">Unrealized P/L</dt>
                <dd className={cn("font-semibold tabular-nums", changeClass)}>
                  {formatCurrency(snapshot.summary.unrealizedPlUsd)} (
                  {formatPercent(snapshot.summary.unrealizedPlPct)})
                </dd>
              </div>
            </dl>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
              <div className="space-y-3">
                <h3 className="font-medium">Open paper positions</h3>
                {snapshot.positions.length === 0 ? (
                  <p className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                    No paper positions yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead className="bg-muted/50 text-left">
                        <tr>
                          <th className="px-3 py-2 font-medium">Symbol</th>
                          <th className="px-3 py-2 text-right font-medium">
                            Shares
                          </th>
                          <th className="px-3 py-2 text-right font-medium">
                            Avg
                          </th>
                          <th className="px-3 py-2 text-right font-medium">
                            Mark
                          </th>
                          <th className="px-3 py-2 text-right font-medium">
                            Value
                          </th>
                          <th className="px-3 py-2 text-right font-medium">
                            P/L
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshot.positions.map((position) => (
                          <tr
                            className="border-t"
                            key={position.id}
                          >
                            <td className="px-3 py-2 font-medium">
                              {position.symbol}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {formatNumber(position.shares)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {formatCurrency(position.avg_price)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {formatCurrency(position.markPriceUsd)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {formatCurrency(position.marketValueUsd)}
                            </td>
                            <td
                              className={cn(
                                "px-3 py-2 text-right tabular-nums",
                                (position.unrealizedPlUsd ?? 0) >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400",
                              )}
                            >
                              {formatCurrency(position.unrealizedPlUsd)} (
                              {formatPercent(position.unrealizedPlPct)})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Recent paper trades</h3>
                {snapshot.transactions.length === 0 ? (
                  <p className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                    No paper trades yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {snapshot.transactions.map((transaction) => (
                      <div
                        className="rounded-lg border border-border/60 px-3 py-2"
                        key={transaction.id}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">
                            {transaction.side === "buy" ? "Buy" : "Sell"}{" "}
                            {transaction.symbol}
                          </p>
                          <p
                            className={cn(
                              "text-sm font-medium tabular-nums",
                              transaction.total_cash_delta_usd >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400",
                            )}
                          >
                            {formatCurrency(transaction.total_cash_delta_usd)}
                          </p>
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {formatNumber(transaction.shares)} shares at{" "}
                          {formatCurrency(transaction.unit_price_usd)} on{" "}
                          {formatDate(transaction.executed_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
