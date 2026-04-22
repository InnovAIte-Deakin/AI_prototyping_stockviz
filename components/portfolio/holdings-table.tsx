"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, PencilLine, Trash2 } from "lucide-react";

import {
  deleteHoldingAction,
  INITIAL_PORTFOLIO_ACTION_STATE,
} from "@/app/portfolio/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/lib/database.types";

type PortfolioHolding = Tables<"portfolio_holdings">;

type HoldingsTableProps = {
  holdings: PortfolioHolding[];
  onEditHolding: (holding: PortfolioHolding) => void;
};

const quantityFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value: number): string => currencyFormatter.format(value);

const formatShares = (value: number): string => quantityFormatter.format(value);

const formatDate = (value: string | null): string => {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
};

export function HoldingsTable({
  holdings,
  onEditHolding,
}: HoldingsTableProps) {
  return (
    <div className="rounded-[26px] border border-[#e6e0db] bg-white shadow-[0_18px_48px_rgba(55,49,45,0.05)]">
      <div className="border-b border-[#ece6e1] px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b7f7f]">
          Persisted holdings
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#4f4e4e]">
          Portfolio table
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6a706f]">
          This MVP focuses on authenticated persistence: one row per symbol,
          stored average cost, optional acquisition date, and notes. Live
          valuation can layer on after the storage workflow is stable.
        </p>
      </div>

      <div className="px-4 pb-4 pt-2 sm:px-6">
        <Table>
          <TableHeader>
            <TableRow className="border-[#ece6e1]">
              <TableHead>Symbol</TableHead>
              <TableHead>Shares</TableHead>
              <TableHead>Avg cost</TableHead>
              <TableHead>Cost basis</TableHead>
              <TableHead>Acquired</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((holding) => {
              const costBasis = holding.shares * holding.avg_price;

              return (
                <TableRow key={holding.id} className="border-[#f0ebe7]">
                  <TableCell className="py-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#4f4e4e]">
                          {holding.symbol}
                        </span>
                        <Badge className="border-[#ddd6d0] bg-[#f8f5f2] text-[#6a706f]">
                          Stored
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/stock/${encodeURIComponent(holding.symbol)}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-[#5f5e5e] hover:text-[#2d3433]"
                        >
                          Stock detail
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={`/analysis/${encodeURIComponent(holding.symbol)}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-[#5f5e5e] hover:text-[#2d3433]"
                        >
                          Analysis
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-[#4f4e4e]">
                    {formatShares(holding.shares)}
                  </TableCell>
                  <TableCell className="font-medium text-[#4f4e4e]">
                    {formatCurrency(holding.avg_price)}
                  </TableCell>
                  <TableCell className="font-medium text-[#4f4e4e]">
                    {formatCurrency(costBasis)}
                  </TableCell>
                  <TableCell className="text-[#6a706f]">
                    {formatDate(holding.acquired_at)}
                  </TableCell>
                  <TableCell className="max-w-[18rem] whitespace-normal text-[#6a706f]">
                    {holding.notes || "-"}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-[#d8d1cb] bg-white text-[#5f5e5e] hover:bg-[#f3efeb]"
                        onClick={() => onEditHolding(holding)}
                      >
                        <PencilLine className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <DeleteHoldingButton
                        holdingId={holding.id}
                        symbol={holding.symbol}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function DeleteHoldingButton({
  holdingId,
  symbol,
}: {
  holdingId: string;
  symbol: string;
}) {
  const [state, formAction, pending] = useActionState(
    deleteHoldingAction,
    INITIAL_PORTFOLIO_ACTION_STATE,
  );

  return (
    <div className="space-y-1 text-right">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (
            !window.confirm(
              `Remove ${symbol} from your portfolio? This deletes the stored holding row.`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="holdingId" value={holdingId} />
        <input type="hidden" name="symbol" value={symbol} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending}
          className="border-[#e6d8d5] bg-white text-[#9a4d43] hover:bg-[#fbf2f1] hover:text-[#8c4038]"
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          {pending ? "Removing..." : "Delete"}
        </Button>
      </form>

      {state.status === "error" && state.message ? (
        <p className="text-xs text-destructive">{state.message}</p>
      ) : null}
    </div>
  );
}
