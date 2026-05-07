# StockViz Quality Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the useful parts of `quality_review.md` into a verified, low-risk quality hardening sequence for StockViz.

**Architecture:** Treat the quality review as input to verify, not as an authoritative patch list. Fix runtime correctness and security first, then add regression tests, then improve maintainability, UI polish, CI, and documentation. Each task should be independently testable and committed before moving on.

**Tech Stack:** Next.js 16 App Router and Proxy, React 19, TypeScript, Supabase SSR, Vitest, Playwright, ESLint, GitHub Actions.

---

## Review Triage

Keep:

- Server action files must export only server functions from `"use server"` modules.
- Upstream API route error bodies should not be returned to clients.
- Auth server actions should reuse the shared Supabase server client.
- Portfolio and auth server actions need direct unit coverage.
- The sync cache facade is risky because `HybridCacheService.get()` returns `null`; callers should use async cache methods or an explicitly synchronous implementation.
- Migration-oriented UI copy should be removed from user-facing screens before handoff.
- Login, dashboard, analysis, and loading screens should use semantic tokens and accessible state.
- Remaining `.js` service files should be migrated to TypeScript by risk, not alphabetically.
- CI should be made reproducible with explicit environment values and then expanded deliberately.
- Root-level planning docs should be moved or summarized once accepted.

Reject:

- Do not rename `proxy.ts` to `middleware.ts`. The local Next 16 docs in `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` say Middleware is now Proxy, `proxy.ts` is the root convention, and a named `proxy` export is valid.
- Do not delete `legacy/` as a quality task. It is explicitly archival in the migration docs; removal needs a product/repo-size decision.
- Do not introduce external infrastructure, such as Redis rate limiting, until the current in-memory limiter has a clear production deployment target and owner.

## Baseline Already Completed

The login SSR visibility issue is fixed in commit `ceadedf` on `migration` and `origin/migration`.

Verification already run:

```powershell
npm run typecheck
npm run test:unit -- tests/unit/routes/login-page.test.tsx
```

Expected current baseline:

```text
typecheck passes
Vitest unit route suite passes
```

---

## File Map

Create:

- `app/portfolio/action-types.ts`: non-server-action portfolio state and types.
- `tests/unit/routes/server-action-exports.test.ts`: static regression test for `"use server"` export shape.
- `lib/api/upstream-errors.ts`: shared sanitized upstream error response helper.
- `tests/unit/auth/actions.test.ts`: auth server action tests.
- `tests/unit/portfolio/actions.test.ts`: portfolio server action tests.
- `tests/unit/cache/hybrid-cache.test.ts`: cache wrapper behavior tests.
- `components/analysis/analysis-header.tsx`: extracted analysis header after behavior is covered.
- `components/analysis/score-card-grid.tsx`: extracted analysis score cards after behavior is covered.
- `components/analysis/analysis-summary-panel.tsx`: extracted analysis summary panel after behavior is covered.
- `CONTRIBUTING.md`: concise project workflow and quality gate guide.

Modify:

- `app/portfolio/actions.ts`: remove exported non-action values from a `"use server"` file.
- `components/portfolio/holding-form.tsx`: import portfolio action state from the new plain module.
- `components/portfolio/holdings-table.tsx`: import portfolio action state from the new plain module.
- `app/api/quote/route.ts`: sanitize upstream error body.
- `app/api/market-status/route.ts`: sanitize upstream error body.
- `app/api/market-news/route.ts`: sanitize upstream error body.
- `app/api/symbol-search/route.ts`: sanitize upstream error body.
- `app/api/stock-metric/route.ts`: sanitize upstream error body.
- `app/api/stock-peers/route.ts`: sanitize upstream error body.
- `app/api/stock-recommendation/route.ts`: sanitize upstream error body.
- `app/api/stock-price-series/route.ts`: sanitize aggregated provider failure details.
- `app/auth/actions.ts`: import `createClient` from `@/lib/supabase/server`.
- `lib/analysis/fundamental-analysis-service.js`: stop using sync cache reads.
- `app/login/page.tsx`: semantic tokens, password-toggle aria, real footer links or buttonless legal text.
- `app/dashboard/page.tsx`: remove migration copy.
- `app/analysis/[symbol]/page.tsx`: remove migration copy, add accessible active timeframe state, then extract components.
- `app/analysis/[symbol]/loading.jsx`: migrate to `.tsx` and add accessible busy semantics.
- `.github/workflows/ci.yml`: provide deterministic env for CI and add optional e2e/coverage jobs after unit gates are stable.
- `README.md`: update Yahoo wording and clarify env file responsibilities.

---

## Task 1: Close The Server Action Export Gap

**Files:**

- Create: `app/portfolio/action-types.ts`
- Create: `tests/unit/routes/server-action-exports.test.ts`
- Modify: `app/portfolio/actions.ts`
- Modify: `components/portfolio/holding-form.tsx`
- Modify: `components/portfolio/holdings-table.tsx`

- [ ] **Step 1: Write the server-action export regression test**

Create `tests/unit/routes/server-action-exports.test.ts`:

```ts
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

const serverActionFiles = [
  "app/admin/actions.ts",
  "app/auth/actions.ts",
  "app/portfolio/actions.ts",
  "app/user/actions.ts",
] as const;

describe("server action export shape", () => {
  it.each(serverActionFiles)(
    "exports only async functions from %s",
    (relativePath) => {
      const source = readFileSync(path.join(repoRoot, relativePath), "utf8");
      expect(source.trimStart().startsWith('"use server";')).toBe(true);
      expect(source).not.toMatch(/^export const\s+/m);
      expect(source).not.toMatch(/^export type\s+/m);

      const exportedFunctions =
        source.match(/^export async function\s+/gm) ?? [];
      expect(exportedFunctions.length).toBeGreaterThan(0);
    },
  );
});
```

- [ ] **Step 2: Run the failing test**

Run:

```powershell
npm run test:unit -- tests/unit/routes/server-action-exports.test.ts
```

Expected:

```text
FAIL app/portfolio/actions.ts exports const/type from a "use server" file
```

- [ ] **Step 3: Move portfolio state into a plain module**

Create `app/portfolio/action-types.ts`:

```ts
export type PortfolioFieldName =
  | "symbol"
  | "shares"
  | "avgPrice"
  | "acquiredAt"
  | "notes"
  | "holdingId";

export type PortfolioActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<PortfolioFieldName, string>>;
};

export const INITIAL_PORTFOLIO_ACTION_STATE: PortfolioActionState = {
  status: "idle",
};
```

- [ ] **Step 4: Update portfolio actions to import types**

In `app/portfolio/actions.ts`, delete the local `PortfolioFieldName`, `PortfolioActionState`, and `INITIAL_PORTFOLIO_ACTION_STATE` exports. Add this import near the other imports:

```ts
import type {
  PortfolioActionState,
  PortfolioFieldName,
} from "@/app/portfolio/action-types";
```

Keep all exported functions as `export async function`.

- [ ] **Step 5: Update portfolio client imports**

In `components/portfolio/holding-form.tsx`, replace imports from `@/app/portfolio/actions` so only server actions come from that file:

```ts
import {
  createHoldingAction,
  updateHoldingAction,
} from "@/app/portfolio/actions";
import {
  INITIAL_PORTFOLIO_ACTION_STATE,
  type PortfolioActionState,
} from "@/app/portfolio/action-types";
```

In `components/portfolio/holdings-table.tsx`, replace imports from `@/app/portfolio/actions` so only server actions come from that file:

```ts
import { deleteHoldingAction } from "@/app/portfolio/actions";
import { INITIAL_PORTFOLIO_ACTION_STATE } from "@/app/portfolio/action-types";
```

- [ ] **Step 6: Verify the fix**

Run:

```powershell
npm run typecheck
npm run test:unit -- tests/unit/routes/server-action-exports.test.ts
```

Expected:

```text
typecheck passes
server-action export test passes
```

- [ ] **Step 7: Commit**

Run:

```powershell
git add app/portfolio/action-types.ts app/portfolio/actions.ts components/portfolio/holding-form.tsx components/portfolio/holdings-table.tsx tests/unit/routes/server-action-exports.test.ts
git commit -m "fix: isolate portfolio action state exports"
```

---

## Task 2: Sanitize API Route Upstream Failures

**Files:**

- Create: `lib/api/upstream-errors.ts`
- Modify: `app/api/quote/route.ts`
- Modify: `app/api/market-status/route.ts`
- Modify: `app/api/market-news/route.ts`
- Modify: `app/api/symbol-search/route.ts`
- Modify: `app/api/stock-metric/route.ts`
- Modify: `app/api/stock-peers/route.ts`
- Modify: `app/api/stock-recommendation/route.ts`
- Modify: `app/api/stock-price-series/route.ts`
- Test: `tests/integration/routes/quote-api.test.ts`
- Test: `tests/integration/routes/market-status-api.test.ts`
- Test: `tests/integration/routes/stock-detail-api.test.ts`

- [ ] **Step 1: Add failing no-leak assertions**

In each route test that covers an upstream failure, assert the client response does not include `details`:

```ts
const body = await response.json();
expect(body).toMatchObject({ error: expect.any(String) });
expect(body).not.toHaveProperty("details");
```

For stock detail route failures, cover quote, metric, peers, recommendation, and price-series fallback failure with the same assertion.

- [ ] **Step 2: Run failing route tests**

Run:

```powershell
npm run test:integration -- tests/integration/routes/quote-api.test.ts tests/integration/routes/market-status-api.test.ts tests/integration/routes/stock-detail-api.test.ts
```

Expected:

```text
FAIL responses still include details from upstream body
```

- [ ] **Step 3: Create the sanitized helper**

Create `lib/api/upstream-errors.ts`:

```ts
import { NextResponse } from "next/server";

type UpstreamErrorInput = {
  body: string;
  publicMessage: string;
  service: string;
  status: number;
};

export function upstreamErrorResponse({
  body,
  publicMessage,
  service,
  status,
}: UpstreamErrorInput) {
  console.warn(`${service} upstream request failed`, {
    bodyPreview: body.slice(0, 300),
    status,
  });

  return NextResponse.json({ error: publicMessage }, { status });
}
```

- [ ] **Step 4: Replace direct upstream body leaks**

For each route, import:

```ts
import { upstreamErrorResponse } from "@/lib/api/upstream-errors";
```

Replace each `details: body` failure response with the matching helper call:

```ts
return upstreamErrorResponse({
  body,
  publicMessage: "Finnhub quote request failed",
  service: "Finnhub quote",
  status: upstream.status,
});
```

Use these `publicMessage` and `service` values:

```text
app/api/quote/route.ts: "Finnhub quote request failed" / "Finnhub quote"
app/api/market-status/route.ts: "Finnhub market status request failed" / "Finnhub market status"
app/api/market-news/route.ts: "Finnhub market news request failed" / "Finnhub market news"
app/api/symbol-search/route.ts: "Finnhub symbol search request failed" / "Finnhub symbol search"
app/api/stock-metric/route.ts: "Finnhub stock metric request failed" / "Finnhub stock metric"
app/api/stock-peers/route.ts: "Finnhub stock peers request failed" / "Finnhub stock peers"
app/api/stock-recommendation/route.ts: "Finnhub stock recommendation request failed" / "Finnhub stock recommendation"
```

In `app/api/stock-price-series/route.ts`, keep provider errors in server logs only:

```ts
console.warn("Stock price series providers failed", { errors });
return NextResponse.json(
  { error: "All stock price series providers failed" },
  { status: 502 },
);
```

- [ ] **Step 5: Verify**

Run:

```powershell
npm run typecheck
npm run test:integration -- tests/integration/routes/quote-api.test.ts tests/integration/routes/market-status-api.test.ts tests/integration/routes/stock-detail-api.test.ts
```

Expected:

```text
typecheck passes
route integration tests pass
```

- [ ] **Step 6: Commit**

Run:

```powershell
git add lib/api/upstream-errors.ts app/api tests/integration/routes
git commit -m "fix: sanitize upstream api errors"
```

---

## Task 3: Refactor Auth Actions Onto The Shared Supabase Client

**Files:**

- Modify: `app/auth/actions.ts`
- Create: `tests/unit/auth/actions.test.ts`

- [ ] **Step 1: Write auth action tests with mocked Supabase**

Create `tests/unit/auth/actions.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((target: string) => {
  throw new Error(`REDIRECT:${target}`);
});
const createClient = vi.fn();

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));

const formData = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
};

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a login error without redirecting when Supabase rejects credentials", async () => {
    createClient.mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn(async () => ({
          error: { message: "Invalid login credentials" },
        })),
      },
    });

    const { login } = await import("@/app/auth/actions");
    await expect(
      login(formData({ email: "demo@stockviz.local", password: "bad" })),
    ).resolves.toEqual({ error: "Invalid login credentials" });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to dashboard after successful login", async () => {
    createClient.mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn(async () => ({ error: null })),
      },
    });

    const { login } = await import("@/app/auth/actions");
    await expect(
      login(formData({ email: "demo@stockviz.local", password: "ok" })),
    ).rejects.toThrow("REDIRECT:/dashboard");
  });

  it("validates reset email before calling Supabase", async () => {
    const { resetPassword } = await import("@/app/auth/actions");
    await expect(
      resetPassword(formData({ email: "bad-email" })),
    ).resolves.toEqual({
      error: "Please enter a valid email address.",
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it("validates password confirmation before update", async () => {
    const { updatePassword } = await import("@/app/auth/actions");
    await expect(
      updatePassword(
        formData({ password: "Password123!", confirmPassword: "different" }),
      ),
    ).resolves.toEqual({ error: "Passwords do not match." });
    expect(createClient).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests**

Run:

```powershell
npm run test:unit -- tests/unit/auth/actions.test.ts
```

Expected:

```text
tests import the current auth actions successfully
```

- [ ] **Step 3: Remove duplicated Supabase client creation**

In `app/auth/actions.ts`, remove these imports:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabasePublicEnv } from "@/lib/supabase/env";
```

Remove the exported `createClient()` function from `app/auth/actions.ts`.

Add:

```ts
import { createClient } from "@/lib/supabase/server";
```

Keep all existing action function names and return contracts unchanged.

- [ ] **Step 4: Verify**

Run:

```powershell
npm run typecheck
npm run test:unit -- tests/unit/auth/actions.test.ts tests/unit/routes/server-action-exports.test.ts
```

Expected:

```text
typecheck passes
auth action tests pass
server-action export test passes
```

- [ ] **Step 5: Commit**

Run:

```powershell
git add app/auth/actions.ts tests/unit/auth/actions.test.ts
git commit -m "refactor: share supabase auth client"
```

---

## Task 4: Add Portfolio Action Coverage

**Files:**

- Create: `tests/unit/portfolio/actions.test.ts`
- Test: `app/portfolio/actions.ts`

- [ ] **Step 1: Write form validation tests**

Create `tests/unit/portfolio/actions.test.ts` with this baseline:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/portfolio/holdings-service", () => ({
  PortfolioAuthError: class PortfolioAuthError extends Error {},
  createHoldingForCurrentUser: vi.fn(async () => ({ id: "holding-1" })),
  deleteHoldingForCurrentUser: vi.fn(async () => undefined),
  updateHoldingForCurrentUser: vi.fn(async () => ({ id: "holding-1" })),
}));

const formData = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
};

describe("portfolio actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid create input before mutation", async () => {
    const { createHoldingAction } = await import("@/app/portfolio/actions");
    const result = await createHoldingAction(
      { status: "idle" },
      formData({ symbol: "", shares: "0", avgPrice: "-1" }),
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.symbol).toBe("Enter a symbol.");
    expect(result.fieldErrors?.shares).toBe(
      "Shares must be a number greater than 0.",
    );
    expect(result.fieldErrors?.avgPrice).toBe(
      "Average cost must be 0 or greater.",
    );
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("revalidates portfolio after create", async () => {
    const { createHoldingAction } = await import("@/app/portfolio/actions");
    const result = await createHoldingAction(
      { status: "idle" },
      formData({
        acquiredAt: "2026-05-07",
        avgPrice: "185.50",
        notes: "Long-term position",
        shares: "10",
        symbol: "aapl",
      }),
    );

    expect(result).toMatchObject({
      message: "Added AAPL to your portfolio.",
      status: "success",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/portfolio");
  });
});
```

- [ ] **Step 2: Extend tests for update and delete**

Add two tests in the same file:

```ts
it("requires holding id before update", async () => {
  const { updateHoldingAction } = await import("@/app/portfolio/actions");
  const result = await updateHoldingAction(
    { status: "idle" },
    formData({ symbol: "AAPL", shares: "1", avgPrice: "1" }),
  );

  expect(result.status).toBe("error");
  expect(result.fieldErrors?.holdingId).toBe("Missing holding identifier.");
});

it("revalidates portfolio after delete", async () => {
  const { deleteHoldingAction } = await import("@/app/portfolio/actions");
  const result = await deleteHoldingAction(
    { status: "idle" },
    formData({ holdingId: "holding-1", symbol: "AAPL" }),
  );

  expect(result).toEqual({
    message: "Removed AAPL.",
    status: "success",
  });
  expect(revalidatePath).toHaveBeenCalledWith("/portfolio");
});
```

- [ ] **Step 3: Verify**

Run:

```powershell
npm run test:unit -- tests/unit/portfolio/actions.test.ts
npm run typecheck
```

Expected:

```text
portfolio action tests pass
typecheck passes
```

- [ ] **Step 4: Commit**

Run:

```powershell
git add tests/unit/portfolio/actions.test.ts
git commit -m "test: cover portfolio actions"
```

---

## Task 5: Fix Cache Facade Usage At The Source

**Files:**

- Create: `tests/unit/cache/hybrid-cache.test.ts`
- Modify: `lib/analysis/fundamental-analysis-service.js`
- Modify: `lib/cache/index.ts` only if the tests show the facade contract itself needs tightening.

- [ ] **Step 1: Prove fundamental analysis should use async cache**

Create `tests/unit/cache/hybrid-cache.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

describe("fundamental analysis cache integration", () => {
  it("uses async cache reads when the injected cache supports them", async () => {
    const cache = {
      get: vi.fn(() => null),
      getAsync: vi.fn(async () => ({
        breakdown: {},
        metrics: {},
        recommendation: "HOLD",
        score: 64,
        source: "cache",
      })),
      set: vi.fn(),
      setAsync: vi.fn(),
    };
    const dataSourceManager = {
      fetchFundamentalData: vi.fn(),
    };
    const { createFundamentalAnalysisService } =
      await import("@/lib/analysis/fundamental-analysis-service.js");

    const service = createFundamentalAnalysisService({
      cache,
      dataSourceManager,
      logger: { warn: vi.fn(), error: vi.fn() },
    });

    const result = await service.analyze("AAPL");

    expect(result.score).toBe(64);
    expect(cache.getAsync).toHaveBeenCalledWith("fa_analysis_AAPL");
    expect(dataSourceManager.fetchFundamentalData).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the failing cache test**

Run:

```powershell
npm run test:unit -- tests/unit/cache/hybrid-cache.test.ts
```

Expected:

```text
FAIL getAsync was not called
```

- [ ] **Step 3: Update fundamental analysis cache reads**

In `lib/analysis/fundamental-analysis-service.js`, replace:

```js
const cached = this.cache.get(cacheKey);
```

with:

```js
const cached = this.cache.getAsync
  ? await this.cache.getAsync(cacheKey)
  : this.cache.get(cacheKey);
```

Replace:

```js
this.cache.set(cacheKey, result);
```

with:

```js
if (this.cache.setAsync) {
  await this.cache.setAsync(cacheKey, result);
} else {
  this.cache.set(cacheKey, result);
}
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm run test:unit -- tests/unit/cache/hybrid-cache.test.ts
npm run test:unit -- tests/unit/analysis/summary-service.test.ts tests/unit/analysis/weight-service.test.ts
npm run typecheck
```

Expected:

```text
cache test passes
analysis unit tests pass
typecheck passes
```

- [ ] **Step 5: Commit**

Run:

```powershell
git add lib/analysis/fundamental-analysis-service.js tests/unit/cache/hybrid-cache.test.ts
git commit -m "fix: use async fundamental cache reads"
```

---

## Task 6: Remove User-Facing Migration Language And Repair Login Accessibility

**Files:**

- Modify: `app/login/page.tsx`
- Modify: `app/dashboard/page.tsx`
- Modify: `app/analysis/[symbol]/page.tsx`
- Modify: `components/layout/navbar.tsx`
- Modify: `components/layout/footer.tsx`
- Test: `tests/unit/routes/login-page.test.tsx`
- Test: `tests/integration/cutover/design-ci-polish.test.ts`

- [ ] **Step 1: Add focused content/a11y assertions**

In `tests/unit/routes/login-page.test.tsx`, add:

```ts
expect(html).toContain('aria-label="Show password"');
expect(html).not.toContain('href="#"');
```

In `tests/integration/cutover/design-ci-polish.test.ts`, add the user-facing files to a migration-copy audit:

```ts
const userFacingFiles = [
  "app/dashboard/page.tsx",
  "app/analysis/[symbol]/page.tsx",
  "components/layout/navbar.tsx",
  "components/layout/footer.tsx",
] as const;

it.each(userFacingFiles)(
  "does not show migration copy in %s",
  (relativePath) => {
    const source = readFileSync(path.join(repoRoot, relativePath), "utf8");
    expect(source).not.toMatch(/Migration|Migrated|migration shell|root app/i);
  },
);
```

- [ ] **Step 2: Run failing tests**

Run:

```powershell
npm run test:unit -- tests/unit/routes/login-page.test.tsx
npm run test:integration -- tests/integration/cutover/design-ci-polish.test.ts
```

Expected:

```text
FAIL missing aria-label or migration-copy audit fails
```

- [ ] **Step 3: Fix login password toggle and footer**

In `app/login/page.tsx`, compute a label:

```tsx
const passwordToggleLabel = showPassword ? "Hide password" : "Show password";
```

Apply it:

```tsx
<button
  type="button"
  aria-label={passwordToggleLabel}
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#adb3b2] hover:text-[#5f5e5e] transition-colors"
>
```

Replace footer `href="#"` anchors with non-link text until real legal routes exist:

```tsx
<span>Privacy Policy</span>
<span>Terms of Service</span>
<span>Legal Disclosures</span>
```

- [ ] **Step 4: Replace migration copy with product copy**

Use these replacements:

```text
"Migration Launch Surface" -> "Research Workspace"
"Search a symbol and open the first migrated analysis slice." -> "Search a symbol and open a full analysis workspace."
"The dashboard now acts as the authenticated handoff into the new market-data pipeline." -> "Search for a stock, open its analysis page, and review the latest market-data-backed signal."
"Migrated Analysis Route" -> "Analysis Workspace"
"This screen is powered by the new root market data layer and extracted analysis services. It is the first end-to-end slice back on the App Router." -> "This screen combines market data, fundamentals, technical indicators, sentiment, and AI-assisted summary notes."
"Migration shell" -> "Workspace"
"Root app workspace" -> "Research terminal"
"Migration signals" -> "Product signals"
```

- [ ] **Step 5: Verify**

Run:

```powershell
npm run test:unit -- tests/unit/routes/login-page.test.tsx
npm run test:integration -- tests/integration/cutover/design-ci-polish.test.ts
npm run typecheck
```

Expected:

```text
login test passes
design/copy test passes
typecheck passes
```

- [ ] **Step 6: Commit**

Run:

```powershell
git add app/login/page.tsx app/dashboard/page.tsx app/analysis/[symbol]/page.tsx components/layout/navbar.tsx components/layout/footer.tsx tests/unit/routes/login-page.test.tsx tests/integration/cutover/design-ci-polish.test.ts
git commit -m "fix: polish user-facing copy and login accessibility"
```

---

## Task 7: Convert Highest-Risk JS Modules To TypeScript

**Files:**

- Modify: `lib/market/data-source-manager.js` -> `lib/market/data-source-manager.ts`
- Modify: `lib/analysis/analysis-service.js` -> `lib/analysis/analysis-service.ts`
- Modify: `lib/analysis/enhanced-scoring-service.js` -> `lib/analysis/enhanced-scoring-service.ts`
- Modify: imports in `lib/analysis/runtime.ts`
- Test: `tests/integration/services/market-data-service.test.ts`
- Test: `tests/unit/analysis/weight-service.test.ts`

- [ ] **Step 1: Convert one file at a time**

Start with `lib/market/data-source-manager.js`. Rename it to `.ts`, add explicit input/output types for provider IDs, OHLCV rows, search results, and fetch responses, then run:

```powershell
npm run typecheck
npm run test:integration -- tests/integration/services/market-data-service.test.ts tests/integration/services/search-service.test.ts
```

Expected:

```text
typecheck passes
market/search service integration tests pass
```

- [ ] **Step 2: Commit data source conversion**

Run:

```powershell
git add lib/market/data-source-manager.ts lib/analysis/runtime.ts tests/integration/services
git rm lib/market/data-source-manager.js
git commit -m "refactor: type market data source manager"
```

- [ ] **Step 3: Convert analysis orchestration**

Rename `lib/analysis/analysis-service.js` to `.ts`, type the constructor dependencies and analysis result shape using `AnalysisResult` from `@/lib/types`, then run:

```powershell
npm run typecheck
npm run test:unit -- tests/unit/analysis/weight-service.test.ts tests/unit/analysis/summary-service.test.ts
npm run test:integration -- tests/integration/services/market-data-service.test.ts
```

Expected:

```text
typecheck passes
analysis and market tests pass
```

- [ ] **Step 4: Commit analysis orchestration conversion**

Run:

```powershell
git add lib/analysis/analysis-service.ts lib/analysis/runtime.ts tests/unit/analysis tests/integration/services
git rm lib/analysis/analysis-service.js
git commit -m "refactor: type analysis orchestration"
```

- [ ] **Step 5: Convert enhanced scoring**

Rename `lib/analysis/enhanced-scoring-service.js` to `.ts`, add numeric helper types and return object types, then run:

```powershell
npm run typecheck
npm run test:unit -- tests/unit/analysis/weight-service.test.ts
npm run test
```

Expected:

```text
typecheck passes
Vitest passes
```

- [ ] **Step 6: Commit enhanced scoring conversion**

Run:

```powershell
git add lib/analysis/enhanced-scoring-service.ts lib/analysis/runtime.ts tests
git rm lib/analysis/enhanced-scoring-service.js
git commit -m "refactor: type enhanced scoring service"
```

---

## Task 8: Stabilize CI For Reproducible Quality Gates

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`

- [ ] **Step 1: Add deterministic CI env values**

In `.github/workflows/ci.yml`, add this `env` block under `jobs.quality`:

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: http://127.0.0.1:65321
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ci-publishable-key
  SUPABASE_SERVICE_ROLE_KEY: ci-service-role-key
  DATABASE_URL: postgresql://postgres:postgres@127.0.0.1:65322/postgres
  GEMINI_API_KEY: ""
  AI_SUMMARY_PROVIDER: fallback
  ALPHA_VANTAGE_API_KEY: ""
  FINNHUB_API_KEY: ""
  TWELVE_DATA_API_KEY: ""
```

- [ ] **Step 2: Add a coverage command without making it blocking**

Add this step after `Test`:

```yaml
- name: Coverage smoke
  run: npm run test -- --coverage.enabled=false
```

This records the intent without requiring a new coverage dependency in the same task.

- [ ] **Step 3: Document CI expectations**

In `README.md`, add this under Useful Commands:

```md
CI runs lint, typecheck, Vitest, build, and parity checks against deterministic dummy environment values. Browser E2E tests remain local until the project has a CI-owned Supabase/Auth fixture.
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm run lint
npm run typecheck
npm run test
npm run parity:check
```

Expected:

```text
lint passes
typecheck passes
Vitest passes
parity check passes
```

- [ ] **Step 5: Commit**

Run:

```powershell
git add .github/workflows/ci.yml README.md
git commit -m "ci: stabilize quality gate environment"
```

---

## Task 9: Documentation Cleanup And Team Handoff

**Files:**

- Create: `CONTRIBUTING.md`
- Modify: `README.md`
- Move or leave untracked by decision: `quality_review.md`
- Move or leave untracked by decision: `walkthrough.md`

- [ ] **Step 1: Create concise contribution rules**

Create `CONTRIBUTING.md`:

````md
# Contributing To StockViz

## Branching

Use short-lived branches from `migration` for quality work. Keep one behavioral concern per commit.

## Before Commit

Run:

```bash
npm run typecheck
npm run test
```
````

For UI or route changes, run the most specific route, component, or Playwright test as well.

## Server Actions

Files with `"use server"` must export only async server functions. Put shared state, constants, and types in a nearby plain module such as `action-types.ts`.

## Next.js Version

This project uses Next.js 16. Read local docs under `node_modules/next/dist/docs/` before changing route, proxy, server action, or caching conventions.

## Legacy Code

`legacy/` is archive/reference code. Do not add product work there.

````

- [ ] **Step 2: Update README branch language**

Change the `Yahoo Fundamental Branch` heading to:

```md
## Yahoo-First Market Data Direction
````

Replace the first paragraph with:

```md
The active app now uses Yahoo Finance as the primary source for chart data, fundamentals, and symbol search, with configured providers retained as fallbacks. The admin diagnostics page can control preferred providers where supported.
```

- [ ] **Step 3: Clarify env files**

In `README.md`, add:

```md
Root `.env.local.example` documents the Next.js app environment contract. `supabase/.env.local.example` documents local Supabase CLI defaults for the Supabase project directory.
```

- [ ] **Step 4: Decide what to do with loose review artifacts**

If `quality_review.md` and `walkthrough.md` are meant for team history, move them to `docs/reviews/`:

```powershell
New-Item -ItemType Directory -Force docs/reviews
git mv quality_review.md docs/reviews/2026-05-07-quality-review.md
git mv walkthrough.md docs/reviews/2026-05-07-walkthrough.md
```

If they are local-only notes, leave them untracked and do not commit them.

- [ ] **Step 5: Verify**

Run:

```powershell
npm run format:check
```

Expected:

```text
Prettier check passes
```

- [ ] **Step 6: Commit**

Run only if documentation files are intentionally project artifacts:

```powershell
git add CONTRIBUTING.md README.md docs/reviews
git commit -m "docs: clarify quality workflow"
```

---

## Final Verification Gate

After all selected tasks are complete, run:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run parity:check
```

If Supabase is running locally and seeded, also run:

```powershell
npm run test:e2e
```

Expected:

```text
lint passes
typecheck passes
Vitest passes
build passes
parity check passes
Playwright passes or skips only documented Supabase-dependent flows
```

## Completion Criteria

- Login SSR visibility remains covered.
- No `"use server"` file exports state constants or types.
- API route upstream failure responses do not leak upstream bodies to clients.
- Auth actions use the shared Supabase server client.
- Portfolio and auth server actions have direct unit coverage.
- Fundamental analysis cache reads use the async cache path when available.
- User-facing copy no longer references migration internals.
- High-risk JS migration has started with typed market and analysis boundaries.
- CI has deterministic environment values for build and parity.
- Documentation explains team workflow, env files, Next 16 local-doc requirement, and legacy archive rules.
