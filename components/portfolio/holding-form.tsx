"use client";

import * as React from "react";
import { useActionState } from "react";

import {
  createHoldingAction,
  updateHoldingAction,
} from "@/app/portfolio/actions";
import {
  INITIAL_PORTFOLIO_ACTION_STATE,
  type PortfolioActionState,
} from "@/app/portfolio/action-types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/lib/database.types";

type PortfolioHolding = Tables<"portfolio_holdings">;

type HoldingFormProps = {
  holding?: PortfolioHolding | null;
  mode: "create" | "update";
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type HoldingFormDialogInnerProps = HoldingFormProps & {
  keySeed: string;
};

const fieldError = (
  state: PortfolioActionState,
  field: keyof NonNullable<PortfolioActionState["fieldErrors"]>,
) => state.fieldErrors?.[field];

const messageStyles = {
  error: "destructive" as const,
  success: "default" as const,
};

export function HoldingForm(props: HoldingFormProps) {
  const keySeed = `${props.mode}-${props.holding?.id ?? "new"}-${String(props.open)}`;

  if (props.mode === "update" && !props.holding) {
    return null;
  }

  return <HoldingFormDialogInner key={keySeed} keySeed={keySeed} {...props} />;
}

function HoldingFormDialogInner({
  holding,
  mode,
  open,
  onOpenChange,
}: HoldingFormDialogInnerProps) {
  const action = mode === "create" ? createHoldingAction : updateHoldingAction;
  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_PORTFOLIO_ACTION_STATE,
  );

  React.useEffect(() => {
    if (state.status === "success") {
      onOpenChange(false);
    }
  }, [onOpenChange, state.status]);

  const title =
    mode === "create" ? "Add portfolio holding" : "Edit portfolio holding";
  const description =
    mode === "create"
      ? "Create the first persisted lot for a symbol in your authenticated portfolio."
      : "Update the stored symbol, share count, average cost, date, or notes for this holding.";
  const submitLabel = pending
    ? mode === "create"
      ? "Adding..."
      : "Saving..."
    : mode === "create"
      ? "Add holding"
      : "Save changes";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {state.status !== "idle" && state.message ? (
          <Alert variant={messageStyles[state.status]}>
            <AlertTitle>
              {state.status === "error" ? "Action failed" : "Saved"}
            </AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        <form action={formAction} className="space-y-4">
          {mode === "update" && holding ? (
            <input type="hidden" name="holdingId" value={holding.id} />
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor={`${mode}-symbol`}>Symbol</Label>
            <Input
              id={`${mode}-symbol`}
              name="symbol"
              placeholder="AAPL"
              defaultValue={holding?.symbol ?? ""}
              aria-invalid={fieldError(state, "symbol") ? true : undefined}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              maxLength={15}
            />
            {fieldError(state, "symbol") ? (
              <p className="text-sm text-destructive">
                {fieldError(state, "symbol")}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                One aggregated lot per symbol. If a symbol already exists, edit
                that row instead of adding a duplicate.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`${mode}-shares`}>Shares</Label>
              <Input
                id={`${mode}-shares`}
                name="shares"
                type="number"
                min="0.0001"
                step="0.0001"
                placeholder="10"
                defaultValue={holding?.shares ?? ""}
                aria-invalid={fieldError(state, "shares") ? true : undefined}
              />
              {fieldError(state, "shares") ? (
                <p className="text-sm text-destructive">
                  {fieldError(state, "shares")}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${mode}-avg-price`}>Average cost (USD)</Label>
              <Input
                id={`${mode}-avg-price`}
                name="avgPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="185.92"
                defaultValue={holding?.avg_price ?? ""}
                aria-invalid={fieldError(state, "avgPrice") ? true : undefined}
              />
              {fieldError(state, "avgPrice") ? (
                <p className="text-sm text-destructive">
                  {fieldError(state, "avgPrice")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${mode}-acquired-at`}>Acquired date</Label>
            <Input
              id={`${mode}-acquired-at`}
              name="acquiredAt"
              type="date"
              defaultValue={holding?.acquired_at ?? ""}
              aria-invalid={fieldError(state, "acquiredAt") ? true : undefined}
            />
            {fieldError(state, "acquiredAt") ? (
              <p className="text-sm text-destructive">
                {fieldError(state, "acquiredAt")}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Optional, but useful for keeping the position timeline readable.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${mode}-notes`}>Notes</Label>
            <Textarea
              id={`${mode}-notes`}
              name="notes"
              placeholder="Why are you holding this position?"
              defaultValue={holding?.notes ?? ""}
              aria-invalid={fieldError(state, "notes") ? true : undefined}
              maxLength={1000}
              rows={4}
            />
            {fieldError(state, "notes") ? (
              <p className="text-sm text-destructive">
                {fieldError(state, "notes")}
              </p>
            ) : null}
          </div>

          <DialogFooter className="px-0 pb-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
