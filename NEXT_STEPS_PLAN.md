# StockViz Next Steps Plan

This document turns the remaining items in `MIGRATION_PLAN.md` into a short execution plan for the final migration stretch.

## Current Snapshot

- Root app routes are live for dashboard, market, portfolio, admin diagnostics, analysis, stock detail, auth callback, login/register, and password reset.
- Core checks are healthy: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, `npm run parity:check`, `npm run parity:live`, and `npm run build` pass in the current local verification set.
- Local Supabase seeded resets are now reproducible through `supabase db reset`.
- Seeded authenticated dashboard -> analysis coverage, stock-detail API backing coverage, market/search service coverage, and active archive import auditing are now in place.
- Parity fixtures and live root analysis checks are in place for the committed AAPL/NVDA/RIVN fixture set.
- The secondary-route decision is complete:
  - `/learn` is dropped from MVP scope because education content is not needed for cutover
  - `/admin` is retained and rebuilt as a root in-app diagnostics console
- The `legacy/` folders stay in the repository as archive/reference only; active root app checks no longer compare against or call the archived runtime.

## Priority Order

1. Keep parity and service coverage green while final cutover decisions are reviewed.
2. Run the signed-in local Supabase e2e pass before handoff.
3. Keep archived `legacy/` folders as reference only while preserving the active-runtime import audit.

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
- `npm run parity:check` validates fixture contracts and audits active code for archived runtime imports.
- `npm run parity:live` validates current root analysis output against fixture tolerances.
- Archived HTTP comparison has been retired; `npm run parity:live` now checks the active root analysis runtime only.

Recommended fixture set:

- `AAPL` for a high-volume US equity
- one additional large-cap symbol used often in demos
- one symbol that exercises weaker or partial market-data responses

Tasks:

- Keep the fixed symbol set and "good enough parity" tolerances current as providers change.
- Check analysis score ranges, recommendation band, sentiment/headline presence, chart data continuity, and stock detail widget population.
- Capture any intentional divergence so the final cutover does not treat known improvements as regressions.
- Keep the lightweight root parity procedure runnable without starting archived services.

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
- any remaining active imports, scripts, or runtime references to archived folders

Current status:

- `tests/integration/cutover/legacy-runtime-audit.test.ts` verifies active runtime paths do not import or reference `legacy/frontend` or `legacy/backend`.
- Archived HTTP comparison hooks have been removed from `scripts/parity-check.ts`.

Tasks:

- Search for any active runtime, build, or test dependency on `legacy/frontend` or `legacy/backend`.
- Remove or replace any remaining root-app code paths that still rely on legacy sources.
- Keep legacy files only as archive/reference.
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

- `Product` with `Fullstack` implementation

Status:

- Completed on 2026-04-26.

Completed decision:

- `/learn` is not part of the MVP and has been removed from active shell navigation.
- `/admin` remains in scope as an in-app diagnostics console.
- UI showcase is dropped from MVP scope.

Primary files:

- [app/admin/page.tsx](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/app/admin/page.tsx)
- [app/admin/actions.ts](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/app/admin/actions.ts)
- [lib/admin/diagnostics-service.ts](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/lib/admin/diagnostics-service.ts)
- [components/layout/shell-navigation.ts](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/components/layout/shell-navigation.ts)
- [tests/e2e/admin.spec.ts](C:/Users/ben20/Desktop/SIT782%20-%20Team%20Project%20B%20-%20Execution%20and%20Delivery/project_v1/AI_prototyping_stockviz/tests/e2e/admin.spec.ts)

Completed outcome:

- Admin diagnostics show runtime status, service key readiness, Supabase diagnostic table access, analysis cache state, and external API usage.
- Admin cache maintenance supports clearing all analysis cache entries and deleting expired cache entries through server actions.
- `STOCKVIZ_ADMIN_EMAILS` can restrict `/admin` to named operator accounts; when unset, authenticated local/dev users can view diagnostics.
- `/learn` no longer appears as planned navigation and is marked dropped in `MIGRATION_PLAN.md`.

Verification:

- Navigation metadata matches product scope.
- `MIGRATION_PLAN.md` no longer lists stale "pending route" notes that conflict with the final decision.
- `npm run test:e2e` includes an anonymous access-gate check for `/admin`.

## Suggested Sequence

### Phase 1: Unblock reliable verification

- Keep the seeded reset workflow healthy as schema and auth flows evolve

### Phase 2: Close the biggest automated coverage gaps

- keep stock-detail API coverage green
- keep broader market/search service coverage green

### Phase 3: Prove cutover readiness

- rerun root parity fixtures for final review if providers or tolerances change
- keep accepted deltas documented in the fixture file
- keep the active archive runtime audit passing

### Phase 4: Resolve non-blocking surface decisions

- `/learn` dropped from MVP scope
- `/admin` retained and rebuilt as diagnostics
- navigation and tracker language reconciled

## Exit Criteria

The migration can be treated as cutover-ready when all of the following are true:

- `supabase db reset` is reproducible from the repo
- Sprint 6 coverage gaps are closed
- parity checks pass for the chosen fixture set
- the root app no longer depends on `legacy/` for runtime behavior
- `/learn` and `/admin` have explicit scope decisions
- `MIGRATION_PLAN.md` reflects the actual end state without stale pending notes
