# StockViz New Improvement Plans

> Current snapshot: `migration` branch, synced with `origin/migration`.
> Purpose: a practical, phased quality plan inspired by the latest project review.

## Phase 1: Fix Current Red State

### 1. Fix auth redirect E2E expectations

Files:

- `tests/e2e/admin.spec.ts`
- `tests/e2e/portfolio.spec.ts`
- `tests/e2e/search-analysis.spec.ts`

Update assertions from exact `/login` matches to accept `/login?next=...`, or assert the pathname and `next` query parameter separately.

### 2. Decide and fix `/market` auth behavior

Recommended direction: protect `/market`, because `MarketOverview` depends on authenticated wishlist data.

Files:

- `utils/supabase/proxy-auth.ts`
- `tests/e2e/market.spec.ts`

Add `/market` to protected prefixes and update the E2E expectation to `/login?next=%2Fmarket`.

Acceptance:

- `npm run test:e2e` passes.

## Phase 2: Add App Resilience

### 3. Add route error boundaries

Files to create:

- `app/analysis/[symbol]/error.tsx`
- `app/stock/[symbol]/error.tsx`
- `app/market/error.tsx`
- `app/portfolio/error.tsx`
- `app/dashboard/error.tsx`

Use client components with recovery buttons and route-specific messaging. Follow the current Next 16 error boundary API and prefer `unstable_retry()` where appropriate.

### 4. Add missing loading states

Files to create or improve:

- Improve `app/analysis/[symbol]/loading.jsx`
- Add `app/stock/[symbol]/loading.tsx`
- Add `app/market/loading.tsx`
- Add `app/portfolio/loading.tsx`

Acceptance:

- `npm run build` passes.
- The listed routes have meaningful route-level `loading.*` Suspense fallbacks instead of blank screens.
- Do not treat `loading.*` alone as a guarantee of instant client-side navigation. If instant navigation becomes a requirement, first enable `cacheComponents`, then add `unstable_instant` route config and Playwright coverage for the static shell.

## Phase 3: Strengthen API Safety

### 5. Add shared API rate limiting

Files:

- Create `lib/rate-limit.ts`
- Apply to all `app/api/*/route.*`

Start with a simple per-IP sliding window, such as 60 requests per minute. Keep the implementation intentionally small and testable.

### 6. Add API route tests

Files:

- `tests/integration/routes/quote-api.test.ts`
- `tests/integration/routes/search-api.test.ts`
- `tests/integration/routes/market-status-api.test.ts`
- `tests/unit/rate-limit.test.ts`

Acceptance:

- Valid requests still work.
- The request over the configured limit returns `429`.
- Missing API keys and bad symbols are tested.

## Phase 4: Reduce Runtime Risk

### 7. Convert high-value JS files to TypeScript

Start with:

- `app/api/search/route.js`
- `app/analysis/[symbol]/page.jsx`
- `lib/cache/index.js`
- `lib/analysis/runtime.js`

Use Next 16 route typing, especially `params: Promise<{ symbol: string }>` for dynamic pages.

Acceptance:

- `npm run typecheck` covers these paths.
- `npm run build` passes.

## Phase 5: Improve Client Maintainability

### 8. Extract repeated fetch hook logic

Files:

- Create `hooks/use-api-fetch.ts`
- Refactor `hooks/use-finnhub-stock-data.ts`

Keep behavior identical while removing repeated `AbortController`, loading, and error-state logic.

### 9. Add hook tests

Files:

- `tests/unit/hooks/use-finnhub-stock-data.test.ts`
- `tests/unit/hooks/use-symbol-search.test.ts`
- `tests/unit/hooks/use-market-news.test.ts`

Acceptance:

- Empty input skips fetch.
- Success and error states are tested.
- Abort behavior is tested.

## Phase 6: Design and DX Polish

### 10. Replace hardcoded color classes with semantic tokens

Start with:

- `app/analysis/[symbol]/page.jsx`
- `app/dashboard/page.tsx`
- `components/market/*`
- `components/search/symbol-search.tsx`

Use existing tokens from `app/globals.css` so theme consistency and future dark-mode work are easier.

### 11. Add CI

File:

- `.github/workflows/ci.yml`

Run:

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run parity:check`

## Verification

Run after each phase:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run parity:check
```

Run after Phase 1 and Phase 6:

```bash
npm run test:e2e
```
