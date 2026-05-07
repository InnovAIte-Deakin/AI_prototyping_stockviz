"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, Heart, Settings2, SlidersHorizontal } from "lucide-react";

import {
  deleteWishlistAction,
  updatePreferencesAction,
  updateWishlistNotesAction,
} from "@/app/user/actions";
import {
  INITIAL_USER_ACTION_STATE,
  type UserActionState,
} from "@/app/user/action-types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  USER_CURRENCIES,
  USER_RISK_PROFILES,
  USER_TIMEFRAMES,
  type UserPreferences,
} from "@/lib/user/preferences";
import type { WishlistItem } from "@/lib/user/wishlist-service";

type UserPersonalizationPanelProps = {
  preferences: UserPreferences;
  wishlist: WishlistItem[];
};

const fieldError = (
  state: UserActionState,
  field: keyof NonNullable<UserActionState["fieldErrors"]>,
) => state.fieldErrors?.[field];

const messageStyles = {
  error: "destructive" as const,
  success: "default" as const,
};

const riskProfileLabels: Record<UserPreferences["riskProfile"], string> = {
  balanced: "Balanced",
  conservative: "Conservative",
  growth: "Growth",
  income: "Income",
};

export function UserPersonalizationPanel({
  preferences,
  wishlist,
}: UserPersonalizationPanelProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="rounded-[28px] border border-[#e6e0db] bg-white py-0 shadow-[0_18px_48px_rgba(55,49,45,0.05)]">
        <CardContent className="p-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-3 inline-flex rounded-2xl bg-[#f3eeea] p-3 text-[#5f5e5e]">
                <Heart className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b7f7f]">
                Wishlist
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#4f4e4e]">
                Saved symbols for follow-up research
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6a706f]">
                Save symbols from market, stock detail, or analysis, then keep
                lightweight research notes here.
              </p>
            </div>
            <Badge className="border-[#d7dfdb] bg-[#eef4f1] text-[#2f6b43]">
              {wishlist.length} saved
            </Badge>
          </div>

          {wishlist.length > 0 ? (
            <div className="space-y-4">
              {wishlist.map((item) => (
                <WishlistItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[#d9d2cc] bg-[#fbf8f6] p-6 text-center">
              <Heart className="mx-auto h-8 w-8 text-[#7b7f7f]" />
              <h3 className="mt-3 text-lg font-semibold text-[#4f4e4e]">
                No saved symbols yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6a706f]">
                Open a stock detail or analysis page and save a symbol when it
                deserves another look.
              </p>
              <Button
                asChild
                className="mt-4 h-10 rounded-xl bg-[#5f5e5e] px-4 text-white hover:bg-[#4f4e4e]"
              >
                <Link href="/market">
                  Browse market
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PreferencesForm preferences={preferences} />
    </section>
  );
}

function WishlistItemCard({ item }: { item: WishlistItem }) {
  const [notesState, notesAction, notesPending] = useActionState(
    updateWishlistNotesAction,
    INITIAL_USER_ACTION_STATE,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteWishlistAction,
    INITIAL_USER_ACTION_STATE,
  );
  const latestState =
    (notesState.submittedAt ?? 0) > (deleteState.submittedAt ?? 0)
      ? notesState
      : deleteState;

  if (latestState.status === "success" && latestState.saved === false) {
    return null;
  }

  return (
    <article className="rounded-[24px] border border-[#ece6e1] bg-[#fbf8f6] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold text-[#4f4e4e]">
              {item.stock.symbol}
            </h3>
            {item.stock.name ? (
              <span className="text-sm text-[#6a706f]">{item.stock.name}</span>
            ) : null}
          </div>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#7b7f7f]">
            Saved {new Date(item.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant="outline"
            className="h-9 rounded-xl border-[#d6d0cb] bg-white px-3 text-[#5f5e5e] hover:bg-[#f2efec]"
          >
            <Link href={`/stock/${encodeURIComponent(item.stock.symbol)}`}>
              Detail
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-9 rounded-xl border-[#d6d0cb] bg-white px-3 text-[#5f5e5e] hover:bg-[#f2efec]"
          >
            <Link href={`/analysis/${encodeURIComponent(item.stock.symbol)}`}>
              Analysis
            </Link>
          </Button>
        </div>
      </div>

      {latestState.status !== "idle" && latestState.message ? (
        <Alert variant={messageStyles[latestState.status]} className="mt-4">
          <AlertTitle>
            {latestState.status === "error"
              ? "Wishlist action failed"
              : "Saved"}
          </AlertTitle>
          <AlertDescription>{latestState.message}</AlertDescription>
        </Alert>
      ) : null}

      <form action={notesAction} className="mt-4 space-y-3">
        <input type="hidden" name="wishlistId" value={item.id} />
        <input type="hidden" name="symbol" value={item.stock.symbol} />
        <Label htmlFor={`wishlist-notes-${item.id}`}>Research notes</Label>
        <Textarea
          id={`wishlist-notes-${item.id}`}
          name="notes"
          defaultValue={item.notes ?? ""}
          placeholder="What should the team remember about this symbol?"
          maxLength={1000}
          rows={3}
          aria-invalid={fieldError(notesState, "notes") ? true : undefined}
        />
        {fieldError(notesState, "notes") ? (
          <p className="text-sm text-destructive">
            {fieldError(notesState, "notes")}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            disabled={notesPending}
            className="h-9 rounded-xl bg-[#5f5e5e] px-4 text-white hover:bg-[#4f4e4e]"
          >
            {notesPending ? "Saving..." : "Save notes"}
          </Button>
          <Button
            formAction={deleteAction}
            variant="outline"
            disabled={deletePending}
            className="h-9 rounded-xl border-[#d6d0cb] bg-white px-4 text-[#8a2f2d] hover:bg-[#f8eeee]"
          >
            {deletePending ? "Removing..." : "Remove"}
          </Button>
        </div>
      </form>
    </article>
  );
}

function PreferencesForm({ preferences }: { preferences: UserPreferences }) {
  const [state, formAction, pending] = useActionState(
    updatePreferencesAction,
    INITIAL_USER_ACTION_STATE,
  );
  const activePreferences =
    state.status === "success" && state.preferences
      ? state.preferences
      : preferences;

  return (
    <Card className="rounded-[28px] border border-[#e6e0db] bg-white py-0 shadow-[0_18px_48px_rgba(55,49,45,0.05)]">
      <CardContent className="p-6">
        <div className="mb-6">
          <div className="mb-3 inline-flex rounded-2xl bg-[#f3eeea] p-3 text-[#5f5e5e]">
            <Settings2 className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b7f7f]">
            Preferences
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#4f4e4e]">
            Persist default analysis settings
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#6a706f]">
            Store a durable preference profile in `profiles.preferences` so the
            product has a real user-customization surface.
          </p>
        </div>

        {state.status !== "idle" && state.message ? (
          <Alert variant={messageStyles[state.status]} className="mb-4">
            <AlertTitle>
              {state.status === "error" ? "Preferences not saved" : "Saved"}
            </AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        <form action={formAction} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="default-timeframe">Default timeframe</Label>
              <NativeSelect
                id="default-timeframe"
                name="defaultTimeframe"
                defaultValue={activePreferences.defaultTimeframe}
                className="w-full"
                aria-invalid={
                  fieldError(state, "defaultTimeframe") ? true : undefined
                }
              >
                {USER_TIMEFRAMES.map((timeframe) => (
                  <NativeSelectOption key={timeframe} value={timeframe}>
                    {timeframe}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {fieldError(state, "defaultTimeframe") ? (
                <p className="text-sm text-destructive">
                  {fieldError(state, "defaultTimeframe")}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="currency">Display currency</Label>
              <NativeSelect
                id="currency"
                name="currency"
                defaultValue={activePreferences.currency}
                className="w-full"
                aria-invalid={fieldError(state, "currency") ? true : undefined}
              >
                {USER_CURRENCIES.map((currency) => (
                  <NativeSelectOption key={currency} value={currency}>
                    {currency}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {fieldError(state, "currency") ? (
                <p className="text-sm text-destructive">
                  {fieldError(state, "currency")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="risk-profile">Risk profile</Label>
            <NativeSelect
              id="risk-profile"
              name="riskProfile"
              defaultValue={activePreferences.riskProfile}
              className="w-full"
              aria-invalid={fieldError(state, "riskProfile") ? true : undefined}
            >
              {USER_RISK_PROFILES.map((profile) => (
                <NativeSelectOption key={profile} value={profile}>
                  {riskProfileLabels[profile]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {fieldError(state, "riskProfile") ? (
              <p className="text-sm text-destructive">
                {fieldError(state, "riskProfile")}
              </p>
            ) : null}
          </div>

          <div className="rounded-[24px] border border-[#ece6e1] bg-[#fbf8f6] p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-white p-3 text-[#5f5e5e]">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-[#4f4e4e]">
                  Default weighting profile
                </p>
                <p className="text-sm text-[#6a706f]">
                  The three weights must add up to 100.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <PreferenceWeightInput
                error={fieldError(state, "fundamentalWeight")}
                label="Fundamental"
                name="fundamentalWeight"
                value={activePreferences.defaultWeights.fundamental}
              />
              <PreferenceWeightInput
                error={fieldError(state, "technicalWeight")}
                label="Technical"
                name="technicalWeight"
                value={activePreferences.defaultWeights.technical}
              />
              <PreferenceWeightInput
                error={fieldError(state, "sentimentWeight")}
                label="Sentiment"
                name="sentimentWeight"
                value={activePreferences.defaultWeights.sentiment}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={pending}
            className="h-10 rounded-xl bg-[#5f5e5e] px-5 text-white hover:bg-[#4f4e4e]"
          >
            {pending ? "Saving preferences..." : "Save preferences"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PreferenceWeightInput({
  error,
  label,
  name,
  value,
}: {
  error?: string;
  label: string;
  name: string;
  value: number;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="number"
        min="0"
        max="100"
        step="1"
        defaultValue={value}
        aria-invalid={error ? true : undefined}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
