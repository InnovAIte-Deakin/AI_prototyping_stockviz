# StockViz Next Steps Plan

This document turns the remaining items in `MIGRATION_PLAN.md` into a short execution plan for the final migration stretch.

## Current Snapshot

- Root app routes are live for dashboard, market, portfolio, analysis, stock detail, auth callback, login/register, and password reset.
- Core checks are healthy: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` pass.
- Local Supabase seeded resets are now reproducible through `supabase db reset`.
- Seeded authenticated dashboard -> analysis coverage is now in place.
- The main unfinished work is concentrated in:
  - remaining Sprint 6 coverage and parity verification
  - legacy runtime retirement
  - product decisions for `/learn` and `/admin`

## Priority Order

1. Close the highest-value remaining test gaps.
2. Run parity checks against legacy behavior.
3. Remove any remaining legacy runtime dependency.
4. Decide whether `/learn` and `/admin` are migrated or formally dropped.
5. Reconcile the tracker once the above is complete.

## Workstream 1: Seed And Reset Reliability

Story mapping:

- `E2-S3`

Owner:

- `Data`

Status:

- Completed on 2026-04-24.

Primary files:

- [supabase/config.toml](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/supabase/config.toml)
- [supabase/seed.sql](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/supabase/seed.sql)
- [supabase/migrations/20260329000000_initial_schema.sql](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/supabase/migrations/20260329000000_initial_schema.sql)
- [supabase/migrations/20260403000000_add_cache_indexes.sql](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/supabase/migrations/20260403000000_add_cache_indexes.sql)
- [supabase/migrations/20260413100000_stocks_add_last_price.sql](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/supabase/migrations/20260413100000_stocks_add_last_price.sql)

Completed outcome:

- `supabase/seed.sql` now restores deterministic local users plus supporting portfolio, wishlist, cache, and API-log data.
- `supabase db reset` was validated against the running local stack.
- Local auth validation now has committed seeded credentials and reset instructions in `README.md`.

Definition of done:

- `supabase/config.toml` points to a real seed file that exists in the repo.
- A clean local reset produces a usable baseline without manual inserts.
- Seeded records are sufficient to support automated tests and parity fixtures.

Verification:

- `supabase db reset`
- `npm run typecheck`
- `npm run test`

## Workstream 2: Finish Sprint 6 Coverage

Story mapping:

- `E11-S1`
- `E11-S2`
- `E11-S3`

Owners:

- `Backend`
- `Fullstack`
- `Frontend`

Dependencies:

- Workstream 1 is completed, so remaining Sprint 6 coverage can assume a reproducible seeded baseline.

Primary files to extend:

- [tests/e2e/search-analysis.spec.ts](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/tests/e2e/search-analysis.spec.ts)
- [tests/e2e/portfolio.spec.ts](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/tests/e2e/portfolio.spec.ts)
- [tests/e2e/market.spec.ts](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/tests/e2e/market.spec.ts)
- [tests/integration/services/holdings-service.test.ts](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/tests/integration/services/holdings-service.test.ts)
- [tests/integration/services/preferences-service.test.ts](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/tests/integration/services/preferences-service.test.ts)
- [tests/unit/analysis/url-state.test.ts](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/tests/unit/analysis/url-state.test.ts)
- [tests/unit/analysis/weight-service.test.ts](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/tests/unit/analysis/weight-service.test.ts)
- [tests/unit/analysis/summary-service.test.ts](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/tests/unit/analysis/summary-service.test.ts)

Additional files likely needed:

- `tests/e2e/stock-detail.spec.ts`
- `tests/integration/services/market-data-service.test.ts`
- `tests/integration/services/search-service.test.ts`

Tasks:

- Expand e2e coverage from anonymous auth-gate smoke tests into authenticated user journeys.
- Keep the new authenticated search -> analysis path healthy as a baseline seeded flow.
- Add stock-detail coverage for `/stock/[symbol]`, including quote/metrics/recommendations/peers chart surfaces or their backing service layer.
- Add service-level tests around the current root market and search boundaries instead of relying only on UI smoke tests.
- Keep new tests aligned with the current tooling mix: Playwright for flows, Vitest for services and logic.

Definition of done:

- Search -> analysis remains covered for a signed-in user, not just redirect behavior.
- Stock detail has explicit automated coverage.
- Root service coverage includes market/search behavior beyond holdings and preferences.
- Sprint 6 stories `E11-S1`, `E11-S2`, and `E11-S3` can move from `in_progress` to at least `review`.

Verification:

- `npm run test:unit`
- `npm run test:integration`
- `npm run test:e2e`
- `npm run test`

## Workstream 3: Parity Fixtures And Cutover Checks

Story mapping:

- `E11-S4`

Owner:

- `Fullstack`

Dependencies:

- Workstream 1 for stable data
- Workstream 2 for test harness maturity

Primary files to use or extend:

- [app/analysis/[symbol]/page.jsx](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/app/analysis/%5Bsymbol%5D/page.jsx)
- [app/stock/[symbol]/page.tsx](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/app/stock/%5Bsymbol%5D/page.tsx)
- [components/stock/stock-symbol-view.tsx](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/components/stock/stock-symbol-view.tsx)
- [lib/analysis/runtime.js](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/lib/analysis/runtime.js)
- [lib/market/data-service.js](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/lib/market/data-service.js)
- `tests/fixtures/parity/`
- `scripts/parity-check.ts`

Recommended fixture set:

- `AAPL` for a high-volume US equity
- one additional large-cap symbol used often in demos
- one symbol that exercises weaker or partial market-data responses

Tasks:

- Define a small fixed symbol set and record what "good enough parity" means for each.
- Compare root app outputs to legacy outputs by range and shape, not exact text matching.
- Check analysis score ranges, recommendation band, sentiment/headline presence, chart data continuity, and stock detail widget population.
- Capture any intentional divergence so the final cutover does not treat known improvements as regressions.
- Add a lightweight scripted or documented parity procedure that can be rerun before deleting legacy dependencies.

Definition of done:

- The team has a repeatable parity fixture set.
- Each selected symbol has pass/fail checks with explicit tolerance notes.
- Any accepted deltas are documented.

Verification:

- Run the parity fixture script or checklist.
- `npm run test`
- `npm run build`

## Workstream 4: Legacy Runtime Retirement

Story mapping:

- `E11-S5`

Owner:

- `Fullstack`

Dependencies:

- Workstream 3 should complete first.

Primary files to inspect:

- [MIGRATION_PLAN.md](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/MIGRATION_PLAN.md)
- [components/layout/shell-navigation.ts](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/components/layout/shell-navigation.ts)
- any remaining imports, docs, scripts, or runtime references under `legacy/`

Tasks:

- Search for any active runtime, build, or test dependency on `legacy/frontend` or `legacy/backend`.
- Remove or replace any remaining root-app code paths that still rely on legacy sources.
- Keep legacy files only as archive/reference until the team is comfortable deleting them.
- Update docs to make it clear that legacy code is no longer needed for app operation.

Definition of done:

- The root app runs, builds, and tests without depending on `legacy/`.
- Remaining legacy content is clearly archival only.

Verification:

- `rg -n "legacy/" app components lib tests scripts`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Workstream 5: `/learn` And `/admin` Decision Gate

Story mapping:

- `E10-S1`
- `E10-S2`
- `E10-S3`
- open note under `E1-S3`

Owner:

- `Product` with `Fullstack` input

Why late:

- These are lower-priority surface decisions and should not block cutover of the core app.

Current state:

- [components/layout/shell-navigation.ts](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/components/layout/shell-navigation.ts) still shows `Learn` as `planned`.
- There is no root `app/learn/page.tsx`.
- There is no root `app/admin/page.tsx`.
- Legacy admin is a diagnostics/cache console in [legacy/frontend/src/pages/Admin.tsx](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/legacy/frontend/src/pages/Admin.tsx), not a core user-facing workflow.

Decision options:

- Migrate `/learn` if educational content is part of the MVP release.
- Drop `/learn` from navigation and archive the legacy page if it is not part of cutover scope.
- Rebuild `/admin` only if the team still needs an in-app diagnostics surface.
- Otherwise remove `/admin` from the migration scope and keep diagnostics in scripts, logs, or Supabase/hosting dashboards.

Definition of done:

- Each pending secondary route is either:
  - implemented in `app/`
  - explicitly deferred post-cutover
  - removed from active navigation and marked dropped in the tracker

Verification:

- Navigation metadata matches product scope.
- `MIGRATION_PLAN.md` no longer lists stale "pending route" notes that conflict with the final decision.

## Suggested Sequence

### Phase 1: Unblock reliable verification

- Keep the seeded reset workflow healthy as schema and auth flows evolve

### Phase 2: Close the biggest automated coverage gaps

- add stock-detail coverage
- add market/search service coverage

### Phase 3: Prove cutover readiness

- run parity fixtures
- document accepted deltas
- confirm root app no longer depends on legacy runtime

### Phase 4: Resolve non-blocking surface decisions

- decide `/learn`
- decide `/admin`
- update navigation and tracker language

## Exit Criteria

The migration can be treated as cutover-ready when all of the following are true:

- `supabase db reset` is reproducible from the repo
- Sprint 6 coverage gaps are closed
- parity checks pass for the chosen fixture set
- the root app no longer depends on `legacy/` for runtime behavior
- `/learn` and `/admin` have explicit scope decisions
- `MIGRATION_PLAN.md` reflects the actual end state without stale pending notes
