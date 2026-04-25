# StockViz Next Steps Plan

This document turns the remaining items in `MIGRATION_PLAN.md` into a short execution plan for the final migration stretch.

## Current Snapshot

- Root app routes are live for dashboard, market, portfolio, analysis, stock detail, auth callback, login/register, and password reset.
- Core checks are healthy: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, `npm run parity:check`, `npm run parity:live`, and `npm run build` pass in the current local verification set.
- Local Supabase seeded resets are now reproducible through `supabase db reset`.
- Seeded authenticated dashboard -> analysis coverage, stock-detail API backing coverage, market/search service coverage, and active legacy runtime import auditing are now in place.
- Parity fixtures, live root analysis checks, and live legacy HTTP comparison have passed for the committed AAPL/NVDA/RIVN fixture set.
- The main unfinished work is concentrated in:
  - product decisions for `/learn` and `/admin`
  - final tracker reconciliation once those product decisions are made

## Priority Order

1. Decide whether `/learn` and `/admin` are migrated or formally dropped.
2. Reconcile the tracker once the above is complete.
3. Keep parity and service coverage green while final cutover decisions are reviewed.

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

Current status:

- Stock-detail backing route coverage exists in `tests/integration/routes/stock-detail-api.test.ts`.
- Market data normalization/fallback coverage exists in `tests/integration/services/market-data-service.test.ts`.
- Search validation/provider/fallback coverage exists in `tests/integration/services/search-service.test.ts`.
- Seeded dashboard -> analysis e2e passes when local Supabase Auth is reachable and skips cleanly otherwise.

Additional files likely needed:

- optional stock-detail UI smoke coverage if the team wants visual widget coverage beyond the backing API route tests

Tasks:

- Keep the new authenticated search -> analysis path healthy as a baseline seeded flow.
- Decide whether the stock-detail API coverage is enough for cutover or add a focused UI smoke for chart/widget rendering.
- Keep new tests aligned with the current tooling mix: Playwright for flows, Vitest for services and logic.

Definition of done:

- Search -> analysis remains covered for a signed-in user, not just redirect behavior.
- Stock detail retains explicit automated coverage for backing API behavior and, if needed, a UI smoke path.
- Root service coverage includes market/search behavior beyond holdings and preferences.
- Sprint 6 stories `E11-S1`, `E11-S2`, and `E11-S3` can stay in `review` once the team accepts the current coverage.

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
- [tests/fixtures/parity/symbols.json](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/tests/fixtures/parity/symbols.json)
- [scripts/parity-check.ts](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/scripts/parity-check.ts)

Current status:

- Initial AAPL/NVDA/RIVN fixture set and parity commands are in place.
- `npm run parity:check` validates fixture contracts and audits active code for legacy runtime imports.
- `npm run parity:live` validates current root analysis output against fixture tolerances.
- Full legacy HTTP comparison passed after starting the legacy backend and running `LEGACY_API_BASE_URL=http://127.0.0.1:3001 npm run parity:live`.

Recommended fixture set:

- `AAPL` for a high-volume US equity
- one additional large-cap symbol used often in demos
- one symbol that exercises weaker or partial market-data responses

Tasks:

- Keep the fixed symbol set and "good enough parity" tolerances current as providers change.
- Keep the legacy HTTP comparison procedure available for final review reruns.
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
- [tests/integration/cutover/legacy-runtime-audit.test.ts](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/tests/integration/cutover/legacy-runtime-audit.test.ts)
- any remaining imports, docs, scripts, or runtime references under `legacy/`

Current status:

- `tests/integration/cutover/legacy-runtime-audit.test.ts` verifies active runtime paths do not import or reference `legacy/frontend` or `legacy/backend`.

Tasks:

- Search for any active runtime, build, or test dependency on `legacy/frontend` or `legacy/backend`.
- Remove or replace any remaining root-app code paths that still rely on legacy sources.
- Keep legacy files only as archive/reference until the team is comfortable deleting them.
- Update docs to make it clear that legacy code is no longer needed for app operation.

Definition of done:

- The root app runs, builds, and tests without depending on `legacy/`.
- Remaining legacy content is clearly archival only.

Verification:

- `npm run parity:check`
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

- keep stock-detail API coverage green
- keep broader market/search service coverage green

### Phase 3: Prove cutover readiness

- rerun legacy HTTP parity fixtures for final review if providers or tolerances change
- keep accepted deltas documented in the fixture file
- keep the active legacy runtime audit passing

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
