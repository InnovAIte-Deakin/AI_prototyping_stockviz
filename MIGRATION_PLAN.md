# Legacy React/Express to Next.js/Supabase Migration Plan

This document is the execution-ready version of the migration plan. It is meant to be used as a live delivery tracker, not just a reference note.

## Status Legend

| Status        | Meaning                                              |
| ------------- | ---------------------------------------------------- |
| `not_started` | Work has not begun                                   |
| `in_progress` | Work is actively underway                            |
| `blocked`     | Work cannot continue until a dependency is resolved  |
| `review`      | Work is complete and awaiting review or verification |
| `done`        | Work is verified and complete                        |
| `deferred`    | Work is intentionally postponed                      |

## Owner Legend

Use whatever names or roles fit the team. For now this plan uses placeholders:

- `Frontend`
- `Backend`
- `Fullstack`
- `Data`
- `DevOps`
- `Unassigned`

## Delivery Rules

- The root Next.js app is the only forward path.
- `legacy/frontend/` and `legacy/backend/` are migration sources, not target homes.
- No new product features should be added to legacy folders except critical bug fixes.
- Each migrated slice must end in a working Next.js path, not just copied files.
- Do not delete legacy files until parity and verification are complete.

## Sprint Plan

### Sprint 1: Foundation And Environment

Sprint goal:

- establish the root app as the active development surface
- remove starter scaffolding
- define architecture, routes, env, and Supabase access

Exit criteria:

- Next app starts cleanly
- route structure exists
- Supabase client/server setup exists
- metadata and homepage are no longer starter content
- migration work can proceed without architecture ambiguity

### Sprint 2: Backend Core Extraction

Sprint goal:

- separate core analysis logic from Express and move it into reusable root modules

Exit criteria:

- analysis, scoring, weights, and market data services exist under root `lib/`
- logic is callable without Express
- at least one route handler or server-side integration uses extracted services

### Sprint 3: Search And Analysis Slice

Sprint goal:

- deliver the first end-to-end migrated feature: search -> symbol route -> analysis output

Exit criteria:

- search UI works in Next
- `/analysis/[symbol]` exists
- analysis data loads through new root services
- score, recommendation, summary, and chart baseline render

### Sprint 4: Controls And Market Pages

Sprint goal:

- migrate indicators, weights, and market discovery screens

Exit criteria:

- weights and indicators are configurable in the new app
- URL state is stable
- market/trending page works in root app

### Sprint 5: Auth, Persistence, And User Features

Sprint goal:

- move from anonymous prototype behavior to authenticated product behavior

Exit criteria:

- Supabase auth is active
- user-owned data schema is live with RLS
- portfolio/watchlist/preferences persistence works

### Sprint 6: Testing, Parity, And Cutover

Sprint goal:

- verify behavior, remove dependency on legacy runtime, and prepare legacy retirement

Exit criteria:

- unit, integration, and end-to-end coverage exist for core flows
- parity checks pass for selected symbols and scenarios
- legacy folders are no longer required for app operation

## Epic Tracker

| Epic ID | Epic                          | Priority | Owner        | Status        | Sprint     | Checkpoint                                                                                                                                   |
| ------- | ----------------------------- | -------- | ------------ | ------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| E1      | Platform Foundation           | `P0`     | `Fullstack`  | `done`        | Sprint 1   | Root app is active and auth entry flow is live                                                                                               |
| E2      | Supabase Core                 | `P0`     | `Data`       | `done`        | Sprint 1–2 | Schema, migrations, RLS, and seeded local resets are in place                                                                                |
| E3      | Legacy Backend Extraction     | `P0`     | `Backend`    | `done`        | Sprint 2   | Analysis logic runs without Express; cache/tracking DB-backed                                                                                |
| E4      | App Shell Migration           | `P1`     | `Frontend`   | `done`        | Sprint 1   | Shared shell now mounts the migrated navbar/footer experience with global symbol search and route-aware planned/live states                  |
| E5      | Search And Symbol Routing     | `P1`     | `Fullstack`  | `done`        | Sprint 3   | Search to analysis route works                                                                                                               |
| E6      | Core Analysis Experience      | `P1`     | `Fullstack`  | `done`        | Sprint 3   | Analysis route now covers chart, scoring, summary, and sentiment/news                                                                        |
| E7      | Indicators And Weighting      | `P1`     | `Frontend`   | `done`        | Sprint 4   | Configurable analysis controls work                                                                                                          |
| E8      | Market Pages                  | `P2`     | `Frontend`   | `done`        | Sprint 4   | Dedicated `/market` discovery is live with market status, news, and curated symbol tabs                                                      |
| E9      | Auth And User Features        | `P2`     | `Fullstack`  | `done`        | Sprint 5   | Auth, password recovery, portfolio persistence, wishlist, and preferences are live                                                           |
| E10     | Learn/Admin/Secondary Screens | `P3`     | `Unassigned` | `not_started` | Sprint 5   | Secondary screens migrated or dropped                                                                                                        |
| E11     | Testing And Cutover           | `P0`     | `Fullstack`  | `in_progress` | Sprint 6   | Stock-detail, market/search, seeded e2e, parity, and active legacy runtime audit coverage are in place; final product-scope decisions remain |

## Story Board

### E1: Platform Foundation

| Story ID | Story                                             | Priority | Owner       | Status        | Sprint   | Checkpoint                                                                                                                   |
| -------- | ------------------------------------------------- | -------- | ----------- | ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| E1-S1    | Replace scaffolded homepage and metadata          | `P0`     | `Frontend`  | `done`        | Sprint 1 | Starter content is removed and the root entry flow is StockViz-auth aware                                                    |
| E1-S2    | Install dependencies and confirm Next 16 patterns | `P0`     | `Fullstack` | `done`        | Sprint 1 | Local dev works and team is using current conventions                                                                        |
| E1-S3    | Establish route structure under `app/`            | `P0`     | `Fullstack` | `in_progress` | Sprint 1 | Auth, password reset, analysis, stock detail, market, and portfolio routes are live; dedicated settings pages remain pending |
| E1-S4    | Standardize root environment variables            | `P0`     | `DevOps`    | `done`        | Sprint 1 | Root env template matches active services and legacy aliases are tolerated                                                   |
| E1-S5    | Add validation and service boundaries             | `P1`     | `Backend`   | `done`        | Sprint 1 | Domain logic is isolated from page components                                                                                |

### E2: Supabase Core

| Story ID | Story                                     | Priority | Owner       | Status | Sprint   | Checkpoint                                                                        |
| -------- | ----------------------------------------- | -------- | ----------- | ------ | -------- | --------------------------------------------------------------------------------- |
| E2-S1    | Create Supabase client and server helpers | `P0`     | `Fullstack` | `done` | Sprint 1 | Root app can access Supabase on server and client                                 |
| E2-S2    | Design first-pass schema                  | `P0`     | `Data`      | `done` | Sprint 2 | Core tables are defined                                                           |
| E2-S3    | Add migrations and seed workflow          | `P0`     | `Data`      | `done` | Sprint 2 | Seed config is wired and `supabase/seed.sql` now supports reproducible `db reset` |
| E2-S4    | Add row-level security policies           | `P0`     | `Data`      | `done` | Sprint 2 | User-owned data is protected                                                      |

### E3: Legacy Backend Extraction

| Story ID | Story                              | Priority | Owner     | Status | Sprint   | Checkpoint                                                                              |
| -------- | ---------------------------------- | -------- | --------- | ------ | -------- | --------------------------------------------------------------------------------------- |
| E3-S1    | Extract market data provider layer | `P0`     | `Backend` | `done` | Sprint 2 | Stock data functions run from root `lib/market/`                                        |
| E3-S2    | Extract analysis engine            | `P0`     | `Backend` | `done` | Sprint 2 | Fundamental, technical, sentiment, and scoring run without Express                      |
| E3-S3    | Extract AI summary service         | `P1`     | `Backend` | `done` | Sprint 2 | Root `lib/ai/` now isolates Gemini and fallback summary generation behind one interface |
| E3-S4    | Replace cache strategy             | `P1`     | `Backend` | `done` | Sprint 2 | Database-backed cache in `lib/cache/` using `analysis_cache` table                      |
| E3-S5    | Replace API tracking or remove it  | `P2`     | `Backend` | `done` | Sprint 2 | Database-backed tracker in `lib/observability/` using `api_call_log` table              |

### E4: App Shell Migration

| Story ID | Story                                 | Priority | Owner      | Status | Sprint   | Checkpoint                                                                                                        |
| -------- | ------------------------------------- | -------- | ---------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------------- |
| E4-S1    | Rebuild navbar and footer in root app | `P1`     | `Frontend` | `done` | Sprint 1 | Shared shell mounts the migrated navbar/footer experience while keeping unfinished routes visible as planned work |
| E4-S2    | Add theme and toast providers         | `P1`     | `Frontend` | `done` | Sprint 1 | UX primitives are available for migrated screens                                                                  |
| E4-S3    | Decide onboarding scope               | `P3`     | `Product`  | `done` | Sprint 1 | Decision: deferred to Sprint 5 (P3, depends on user state)                                                        |

### E5: Search And Symbol Routing

| Story ID | Story                                    | Priority | Owner       | Status | Sprint   | Checkpoint                               |
| -------- | ---------------------------------------- | -------- | ----------- | ------ | -------- | ---------------------------------------- |
| E5-S1    | Build symbol search service and endpoint | `P1`     | `Fullstack` | `done` | Sprint 3 | Search data is available from root app   |
| E5-S2    | Migrate search UI                        | `P1`     | `Frontend`  | `done` | Sprint 3 | User can search and navigate to a symbol |
| E5-S3    | Add `/analysis/[symbol]` route           | `P1`     | `Fullstack` | `done` | Sprint 3 | Symbol analysis page exists              |

### E6: Core Analysis Experience

| Story ID | Story                                   | Priority | Owner      | Status | Sprint   | Checkpoint                                                        |
| -------- | --------------------------------------- | -------- | ---------- | ------ | -------- | ----------------------------------------------------------------- |
| E6-S1    | Migrate analysis page layout            | `P1`     | `Frontend` | `done` | Sprint 3 | Core analysis screen renders in root app                          |
| E6-S2    | Migrate chart and summary panels        | `P1`     | `Frontend` | `done` | Sprint 3 | Analysis page shows actionable insight                            |
| E6-S3    | Migrate recommendation and scoring UI   | `P1`     | `Frontend` | `done` | Sprint 3 | Score and recommendation are visible                              |
| E6-S4    | Migrate headlines and sentiment section | `P2`     | `Frontend` | `done` | Sprint 3 | News and sentiment render from new services in the analysis route |

### E7: Indicators And Weighting

| Story ID | Story                                                  | Priority | Owner       | Status | Sprint   | Checkpoint                              |
| -------- | ------------------------------------------------------ | -------- | ----------- | ------ | -------- | --------------------------------------- |
| E7-S1    | Migrate indicators panel                               | `P1`     | `Frontend`  | `done` | Sprint 4 | Indicators are configurable in root app |
| E7-S2    | Migrate weights panel                                  | `P1`     | `Frontend`  | `done` | Sprint 4 | Weight controls work in root app        |
| E7-S3    | Move configuration state to Next-friendly URL handling | `P1`     | `Fullstack` | `done` | Sprint 4 | Links are shareable and restore state   |

### E8: Market Pages

| Story ID | Story                          | Priority | Owner      | Status | Sprint   | Checkpoint                                                                                      |
| -------- | ------------------------------ | -------- | ---------- | ------ | -------- | ----------------------------------------------------------------------------------------------- |
| E8-S1    | Migrate trending stocks screen | `P2`     | `Frontend` | `done` | Sprint 4 | Curated discovery tabs work in the root app and link into stock detail plus analysis            |
| E8-S2    | Migrate market overview page   | `P2`     | `Frontend` | `done` | Sprint 4 | Browse-first `/market` route composes live market status, news, and discovery into stock detail |

### E9: Auth And User Features

| Story ID | Story                                        | Priority | Owner       | Status | Sprint   | Checkpoint                                                |
| -------- | -------------------------------------------- | -------- | ----------- | ------ | -------- | --------------------------------------------------------- |
| E9-S1    | Replace auth context with Supabase auth      | `P2`     | `Fullstack` | `done` | Sprint 5 | Session, sign-in, sign-up, and password reset flows work  |
| E9-S2    | Migrate portfolio persistence                | `P2`     | `Fullstack` | `done` | Sprint 5 | Authenticated users can save, update, and remove holdings |
| E9-S3    | Migrate watchlists, preferences, and presets | `P2`     | `Fullstack` | `done` | Sprint 5 | Wishlist and preference customization are persistent      |

### E10: Learn/Admin/Secondary Screens

| Story ID | Story                                       | Priority | Owner        | Status        | Sprint   | Checkpoint                                    |
| -------- | ------------------------------------------- | -------- | ------------ | ------------- | -------- | --------------------------------------------- |
| E10-S1   | Migrate learn content                       | `P3`     | `Unassigned` | `not_started` | Sprint 5 | Learn route exists or content is archived     |
| E10-S2   | Migrate admin/debug screens if still needed | `P3`     | `Unassigned` | `not_started` | Sprint 5 | Admin functions are either rebuilt or removed |
| E10-S3   | Migrate or drop UI showcase                 | `P3`     | `Unassigned` | `not_started` | Sprint 5 | Showcase decision is made and documented      |

### E11: Testing And Cutover

| Story ID | Story                                                   | Priority | Owner       | Status        | Sprint   | Checkpoint                                                                                           |
| -------- | ------------------------------------------------------- | -------- | ----------- | ------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| E11-S1   | Add unit tests for analysis logic                       | `P0`     | `Backend`   | `review`      | Sprint 6 | URL-state, weighting, and summary-provider boundary coverage are in place                            |
| E11-S2   | Add integration tests for root services and data access | `P0`     | `Fullstack` | `review`      | Sprint 6 | Mocked Supabase, stock-detail API, market data, and search service coverage are in place             |
| E11-S3   | Add end-to-end tests for search and analysis            | `P0`     | `Frontend`  | `review`      | Sprint 6 | Auth-gate smoke coverage and seeded authenticated dashboard-to-analysis e2e pass with local Supabase |
| E11-S4   | Run parity checks against legacy outputs                | `P0`     | `Fullstack` | `review`      | Sprint 6 | AAPL/NVDA/RIVN contract, live root, and live legacy HTTP parity checks pass                          |
| E11-S5   | Remove legacy runtime dependencies                      | `P0`     | `Fullstack` | `in_progress` | Sprint 6 | Active runtime legacy import audit passes; final legacy archive/delete decision remains              |

## File-By-File Migration Map

This maps legacy files to likely destinations in the new root app.

### Frontend To Root App

| Legacy File                                                  | Target                                                                                                                                                    | Action                                                                                              | Priority | Owner        | Sprint   | Status        |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------- | ------------ | -------- | ------------- |
| `legacy/frontend/src/App.tsx`                                | split across `app/` routes and layout                                                                                                                     | use as routing/spec reference only                                                                  | `P0`     | `Fullstack`  | Sprint 1 | `not_started` |
| `legacy/frontend/src/main.tsx`                               | none                                                                                                                                                      | do not migrate directly                                                                             | `P0`     | `Fullstack`  | Sprint 1 | `not_started` |
| `legacy/frontend/src/index.css`                              | `app/globals.css`                                                                                                                                         | selectively merge useful styles                                                                     | `P1`     | `Frontend`   | Sprint 1 | `not_started` |
| `legacy/frontend/src/components/Layout/Navbar.tsx`           | `components/layout/navbar.tsx`, `components/layout/shell-frame.tsx`, `components/layout/stock-symbol-search.tsx`, `components/layout/shell-navigation.ts` | mounted as the protected shared shell with route-aware planned/live states and global symbol search | `P1`     | `Frontend`   | Sprint 1 | `done`        |
| `legacy/frontend/src/components/Layout/Footer.tsx`           | `components/layout/footer.tsx`, `components/layout/shell-frame.tsx`, `components/layout/shell-navigation.ts`                                              | mounted in the protected shared shell and updated to reflect live versus pending root routes        | `P1`     | `Frontend`   | Sprint 1 | `done`        |
| `legacy/frontend/src/components/AppShell.tsx`                | absorbed into Next layouts                                                                                                                                | do not preserve as-is                                                                               | `P2`     | `Frontend`   | Sprint 1 | `not_started` |
| `legacy/frontend/src/contexts/AuthContext.tsx`               | `app/auth/actions.ts`, `utils/supabase/proxy-auth.ts`                                                                                                     | replaced with Supabase auth actions plus proxy-based route protection                               | `P1`     | `Fullstack`  | Sprint 5 | `done`        |
| `legacy/frontend/src/contexts/ThemeContext.tsx`              | `components/providers/theme-provider.tsx`                                                                                                                 | replaced with `next-themes` pattern                                                                 | `P1`     | `Frontend`   | Sprint 1 | `done`        |
| `legacy/frontend/src/components/AISummary.tsx`               | `components/analysis/ai-summary.tsx`                                                                                                                      | migrate                                                                                             | `P1`     | `Frontend`   | Sprint 3 | `not_started` |
| `legacy/frontend/src/components/EnhancedStockAnalysis.tsx`   | `components/analysis/*`                                                                                                                                   | decompose into smaller root components                                                              | `P1`     | `Frontend`   | Sprint 3 | `not_started` |
| `legacy/frontend/src/components/HeadlineList.tsx`            | `components/analysis/sentiment-headlines.tsx`                                                                                                             | migrated as the sentiment/news panel on the analysis route                                          | `P2`     | `Frontend`   | Sprint 3 | `done`        |
| `legacy/frontend/src/components/PriceChart.tsx`              | `components/analysis/price-history-chart.tsx`                                                                                                             | migrated as baseline chart for analysis route                                                       | `P1`     | `Frontend`   | Sprint 3 | `done`        |
| `legacy/frontend/src/components/TradingViewChart.tsx`        | `components/charts/tradingview-chart.tsx`                                                                                                                 | migrate if still preferred chart implementation                                                     | `P2`     | `Frontend`   | Sprint 3 | `not_started` |
| `legacy/frontend/src/components/SimpleTradingViewChart.tsx`  | merged or dropped                                                                                                                                         | decide canonical chart path                                                                         | `P3`     | `Frontend`   | Sprint 3 | `not_started` |
| `legacy/frontend/src/components/RecommendationChip.tsx`      | `components/analysis/recommendation-chip.tsx`                                                                                                             | migrate                                                                                             | `P1`     | `Frontend`   | Sprint 3 | `not_started` |
| `legacy/frontend/src/components/ScoreBadge.tsx`              | `components/analysis/score-badge.tsx`                                                                                                                     | migrate                                                                                             | `P1`     | `Frontend`   | Sprint 3 | `not_started` |
| `legacy/frontend/src/components/SearchBox.tsx`               | `components/search/symbol-search.tsx`, `components/layout/stock-symbol-search.tsx`                                                                        | migrated and wired into dashboard, analysis, and the shared shell header                            | `P1`     | `Frontend`   | Sprint 3 | `done`        |
| `legacy/frontend/src/components/IndicatorsPanel.tsx`         | `components/analysis/indicators-panel.tsx`                                                                                                                | migrated into the root analysis controls                                                            | `P1`     | `Frontend`   | Sprint 4 | `done`        |
| `legacy/frontend/src/components/EnhancedIndicatorsPanel.tsx` | merged into canonical indicators panel                                                                                                                    | keep only stronger behavior                                                                         | `P2`     | `Frontend`   | Sprint 4 | `not_started` |
| `legacy/frontend/src/components/WeightsPanel.tsx`            | `components/analysis/weights-panel.tsx`                                                                                                                   | migrated into the root analysis controls                                                            | `P1`     | `Frontend`   | Sprint 4 | `done`        |
| `legacy/frontend/src/components/EnhancedWeightsPanel.tsx`    | merged into canonical weights panel                                                                                                                       | keep only stronger behavior                                                                         | `P2`     | `Frontend`   | Sprint 4 | `not_started` |
| `legacy/frontend/src/components/TrendingTabs.tsx`            | `components/market/trending-tabs.tsx`                                                                                                                     | reimplemented as curated discovery tabs in the root market route                                    | `P2`     | `Frontend`   | Sprint 4 | `done`        |
| `legacy/frontend/src/components/LoadingSpinner.tsx`          | `components/feedback/loading-spinner.tsx` or existing UI spinner                                                                                          | migrate or replace                                                                                  | `P2`     | `Frontend`   | Sprint 3 | `not_started` |
| `legacy/frontend/src/components/EmptyState.tsx`              | `components/feedback/empty-state.tsx`                                                                                                                     | migrate                                                                                             | `P2`     | `Frontend`   | Sprint 3 | `not_started` |
| `legacy/frontend/src/components/ErrorBoundary.tsx`           | `error.tsx` patterns or shared client boundary                                                                                                            | adapt to Next error model                                                                           | `P2`     | `Frontend`   | Sprint 3 | `not_started` |
| `legacy/frontend/src/components/OnboardingPopup.tsx`         | `components/onboarding/onboarding-dialog.tsx`                                                                                                             | migrate only if still required                                                                      | `P3`     | `Unassigned` | Sprint 5 | `not_started` |
| `legacy/frontend/src/components/UIShowcase.tsx`              | `app/showcase/page.tsx` or none                                                                                                                           | migrate or drop                                                                                     | `P3`     | `Unassigned` | Sprint 5 | `not_started` |
| `legacy/frontend/src/pages/Home.tsx`                         | `proxy.ts`, `utils/supabase/proxy-auth.ts`                                                                                                                | replaced with auth-aware root redirect rather than a public `app/page.tsx` route                    | `P0`     | `Frontend`   | Sprint 1 | `done`        |
| `legacy/frontend/src/pages/SymbolAnalysis.tsx`               | `app/analysis/[symbol]/page.jsx`                                                                                                                          | migrated into the active analysis route                                                             | `P1`     | `Fullstack`  | Sprint 3 | `done`        |
| `legacy/frontend/src/pages/AnalysisResultsPage.tsx`          | `app/analysis/[symbol]/page.jsx`                                                                                                                          | merged into the active analysis route                                                               | `P1`     | `Fullstack`  | Sprint 3 | `done`        |
| `legacy/frontend/src/pages/Indicators.tsx`                   | folded into `app/analysis/[symbol]/page.jsx`                                                                                                              | migrated into the analysis route instead of a standalone page                                       | `P2`     | `Frontend`   | Sprint 4 | `done`        |
| `legacy/frontend/src/pages/Weights.tsx`                      | folded into `app/analysis/[symbol]/page.jsx`                                                                                                              | migrated into the analysis route instead of a standalone page                                       | `P2`     | `Frontend`   | Sprint 4 | `done`        |
| `legacy/frontend/src/pages/Market.tsx`                       | `app/market/page.tsx`                                                                                                                                     | migrated into the root app with live status/news plus curated discovery                             | `P2`     | `Frontend`   | Sprint 4 | `done`        |
| `legacy/frontend/src/pages/Portfolio.tsx`                    | `app/portfolio/page.tsx`                                                                                                                                  | migrated into the root app with authenticated Supabase-backed holdings persistence                  | `P2`     | `Fullstack`  | Sprint 5 | `done`        |
| `legacy/frontend/src/pages/Learn.tsx`                        | likely none                                                                                                                                               | confirm if obsolete                                                                                 | `P3`     | `Unassigned` | Sprint 5 | `not_started` |
| `legacy/frontend/src/pages/LearnPage.tsx`                    | `app/learn/page.tsx`                                                                                                                                      | migrate if retained                                                                                 | `P3`     | `Unassigned` | Sprint 5 | `not_started` |
| `legacy/frontend/src/pages/Admin.tsx`                        | `app/admin/page.tsx`                                                                                                                                      | migrate if still needed                                                                             | `P3`     | `Unassigned` | Sprint 5 | `not_started` |
| `legacy/frontend/src/lib/api.ts`                             | `lib/api/`, `lib/market/`, `lib/analysis/`                                                                                                                | split and remove Express coupling                                                                   | `P0`     | `Backend`    | Sprint 2 | `not_started` |
| `legacy/frontend/src/lib/queries.ts`                         | optional client query layer                                                                                                                               | keep only where client fetching remains necessary                                                   | `P2`     | `Fullstack`  | Sprint 3 | `not_started` |
| `legacy/frontend/src/lib/types.ts`                           | `lib/types.ts` or feature-local types                                                                                                                     | reused in root app types                                                                            | `P0`     | `Fullstack`  | Sprint 2 | `done`        |
| `legacy/frontend/src/lib/urlState.ts`                        | `lib/url-state.ts`                                                                                                                                        | adapted to Next-friendly search param handling                                                      | `P1`     | `Fullstack`  | Sprint 4 | `done`        |
| `legacy/frontend/src/lib/utils.ts`                           | root `lib/utils.ts`                                                                                                                                       | selectively merged into root utilities                                                              | `P2`     | `Frontend`   | Sprint 2 | `done`        |
| `legacy/frontend/src/store/ui.ts`                            | hooks or feature-local state                                                                                                                              | reduce scope, do not copy blindly                                                                   | `P2`     | `Frontend`   | Sprint 3 | `not_started` |
| `legacy/frontend/src/data/companies.ts`                      | Supabase `market_symbols` or import script                                                                                                                | convert from static frontend data                                                                   | `P1`     | `Data`       | Sprint 2 | `not_started` |
| `legacy/frontend/src/data/asxCompanies.ts`                   | Supabase `market_symbols` or import script                                                                                                                | convert                                                                                             | `P1`     | `Data`       | Sprint 2 | `not_started` |
| `legacy/frontend/src/data/bseCompanies.ts`                   | Supabase `market_symbols` or import script                                                                                                                | convert                                                                                             | `P1`     | `Data`       | Sprint 2 | `not_started` |
| `legacy/frontend/src/data/nseCompanies.ts`                   | Supabase `market_symbols` or import script                                                                                                                | convert                                                                                             | `P1`     | `Data`       | Sprint 2 | `not_started` |
| `legacy/frontend/src/data/nyseCompanies.ts`                  | Supabase `market_symbols` or import script                                                                                                                | convert                                                                                             | `P1`     | `Data`       | Sprint 2 | `not_started` |
| `legacy/frontend/src/data/companies copy.ts`                 | none                                                                                                                                                      | treat as duplicate and review for deletion                                                          | `P3`     | `Unassigned` | Sprint 2 | `not_started` |
| `legacy/frontend/src/components/ui/*`                        | none                                                                                                                                                      | prefer root `components/ui` instead                                                                 | `P0`     | `Frontend`   | Sprint 1 | `not_started` |

### Backend To Root App

| Legacy File                                             | Target                                                                                                                                                                                                                                                                        | Action                                                                                                                 | Priority | Owner     | Sprint   | Status        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------- | --------- | -------- | ------------- |
| `legacy/backend/server.js`                              | split across `app/api/*`, `lib/*`, and config                                                                                                                                                                                                                                 | do not migrate as one file                                                                                             | `P0`     | `Backend` | Sprint 2 | `not_started` |
| `legacy/backend/routes/stockRoutes.js`                  | `app/api/quote/route.ts`, `app/api/stock-metric/route.ts`, `app/api/stock-peers/route.ts`, `app/api/stock-price-series/route.ts`, `app/api/stock-recommendation/route.ts`, `app/api/market-news/route.ts`, `app/api/market-status/route.ts`, `app/api/symbol-search/route.ts` | partially decomposed into thin Next route wrappers; some parity cleanup still pending                                  | `P0`     | `Backend` | Sprint 2 | `in_progress` |
| `legacy/backend/controllers/searchController.js`        | `lib/market/search-service.js` and `app/api/search/route.js`                                                                                                                                                                                                                  | extracted into root search service plus Next route                                                                     | `P1`     | `Backend` | Sprint 2 | `done`        |
| `legacy/backend/controllers/stockController.js`         | `lib/analysis/*`, `lib/market/*`, and `components/stock/*` helpers                                                                                                                                                                                                            | stock detail and analysis responsibilities are now split across root services and widgets; parity review still pending | `P1`     | `Backend` | Sprint 2 | `in_progress` |
| `legacy/backend/services/analysisService.js`            | `lib/analysis/analysis-service.js`                                                                                                                                                                                                                                            | extracted to root module and backend file now acts as wrapper                                                          | `P0`     | `Backend` | Sprint 2 | `done`        |
| `legacy/backend/services/fundamentalAnalysisService.js` | `lib/analysis/fundamental-analysis-service.js`                                                                                                                                                                                                                                | extracted to root module and backend file now acts as wrapper                                                          | `P0`     | `Backend` | Sprint 2 | `done`        |
| `legacy/backend/services/technicalAnalysisService.js`   | `lib/analysis/technical-analysis-service.js`                                                                                                                                                                                                                                  | extracted to root module and backend file now acts as wrapper                                                          | `P0`     | `Backend` | Sprint 2 | `done`        |
| `legacy/backend/services/sentimentService.js`           | `lib/analysis/sentiment-service.js`                                                                                                                                                                                                                                           | extracted to root module and backend file now acts as wrapper                                                          | `P0`     | `Backend` | Sprint 2 | `done`        |
| `legacy/backend/services/enhancedScoringService.js`     | `lib/analysis/enhanced-scoring-service.js`                                                                                                                                                                                                                                    | extracted to root module and backend file now acts as wrapper                                                          | `P0`     | `Backend` | Sprint 2 | `done`        |
| `legacy/backend/services/weightService.js`              | `lib/analysis/weight-service.js`                                                                                                                                                                                                                                              | extracted to root module and backend file now acts as wrapper                                                          | `P0`     | `Backend` | Sprint 2 | `done`        |
| `legacy/backend/services/enhancedTrendingService.js`    | `lib/market/trending.ts`                                                                                                                                                                                                                                                      | migrate                                                                                                                | `P1`     | `Backend` | Sprint 2 | `not_started` |
| `legacy/backend/services/dataService.js`                | `lib/market/data-service.js`                                                                                                                                                                                                                                                  | migrated into the root market layer                                                                                    | `P0`     | `Backend` | Sprint 2 | `done`        |
| `legacy/backend/services/dataSourceManager.js`          | `lib/market/data-source-manager.js`                                                                                                                                                                                                                                           | migrated into the root market layer                                                                                    | `P1`     | `Backend` | Sprint 2 | `done`        |
| `legacy/backend/services/geminiService.js`              | `lib/ai/gemini-summary-service.js`; `lib/ai/index.js`                                                                                                                                                                                                                         | migrated into the root AI layer with centralized provider selection and fallback wiring                                | `P1`     | `Backend` | Sprint 2 | `done`        |
| `legacy/backend/services/cacheService.js`               | `lib/cache/database-cache.ts`                                                                                                                                                                                                                                                 | redesign complete; hybrid wrapper provides backward-compatible interface                                               | `P1`     | `Backend` | Sprint 2 | `done`        |
| `legacy/backend/services/apiTrackingService.js`         | `lib/observability/database-api-tracker.ts`                                                                                                                                                                                                                                   | redesign complete; hybrid wrapper provides backward-compatible interface                                               | `P2`     | `Backend` | Sprint 2 | `done`        |
| `legacy/backend/utils/testConnections.js`               | `scripts/test-provider-connections.ts`                                                                                                                                                                                                                                        | convert to developer verification script                                                                               | `P2`     | `Backend` | Sprint 2 | `not_started` |
| `legacy/backend/utils/test-sentiment-service.mjs`       | `scripts/test-sentiment-service.ts`                                                                                                                                                                                                                                           | convert if still useful                                                                                                | `P3`     | `Backend` | Sprint 2 | `not_started` |

## Execution Checkpoints

### Checkpoint A: Root App Ready

- starter public homepage has been removed and `/` now redirects into the auth flow via `proxy.ts`
- `app/layout.tsx` contains real metadata plus shared providers (`ThemeProvider`, `Toaster`, shell frame)
- root env template exists at `.env.local.example` and matches the active service contract
- auth, password reset, analysis, stock detail, and core market proxy routes are live; dedicated market, portfolio, indicators, weights, learn, and admin pages remain pending

### Checkpoint B: Logic Extracted

- core stock analysis code runs from root `lib/`
- at least one route or page uses extracted services
- legacy Express server is no longer the only execution path for analysis

Current state:

- `lib/analysis/analysis-service.js` created
- `lib/analysis/fundamental-analysis-service.js` created
- `lib/analysis/technical-analysis-service.js` created
- `lib/analysis/sentiment-service.js` created
- `lib/analysis/enhanced-scoring-service.js` created
- `lib/analysis/weight-service.js` created
- legacy backend service files now delegate to root analysis modules
- syntax verification completed with `node --check` on new modules and wrappers
- market/data extraction now powers search, analysis, stock detail, and market-data proxy routes
- **cache redesign complete**: `lib/cache/database-cache.ts` with Supabase `analysis_cache` table
- **API tracking redesign complete**: `lib/observability/database-api-tracker.ts` with `api_call_log` table
- cleanup script added: `npm run cache:cleanup`
- **AI summary provider isolation complete**: root `lib/ai/` now selects Gemini when configured and falls back cleanly when it is not

### Checkpoint C: First Vertical Slice Delivered

- search works
- symbol route works
- analysis result renders in root app
- chart, score, summary, and sentiment headlines are visible
- a browse-first `/stock/[symbol]` route now exists for quote, peers, recommendation, and price-history validation

### Checkpoint D: Configurable Analysis Delivered

- weights and indicators are functional in root app
- state survives refresh/share via URL
- market discovery screen works

### Checkpoint E: Auth And Persistence Delivered

- user can sign in and recover access via password reset
- user-owned data is stored in Supabase
- portfolio, wishlist, and preference persistence are live in the root app

### Checkpoint F: Cutover Ready

- tests exist at unit, integration, and end-to-end levels
- selected symbol outputs are validated against legacy behavior
- no production-critical flow depends on `legacy/frontend/` or `legacy/backend/`

## High-Risk Files

These files need redesign rather than direct migration:

- `legacy/frontend/src/App.tsx`
- `legacy/frontend/src/main.tsx`
- `legacy/frontend/src/contexts/AuthContext.tsx`
- `legacy/frontend/src/components/ui/*`
- `legacy/backend/server.js`
- ~~`legacy/backend/services/cacheService.js`~~ — **Done**: replaced with `lib/cache/database-cache.ts`
- ~~`legacy/backend/services/apiTrackingService.js`~~ — **Done**: replaced with `lib/observability/database-api-tracker.ts`

## Immediate Next Actions

| Order | Action                                                                                                                                | Owner       | Status                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1     | Finish the shared shell strategy so the lightweight header either reaches parity or is replaced by the final navbar/footer experience | `Frontend`  | `done`                                                                                                                    |
| 2     | Migrate indicators and weights controls into the root analysis UX with Next-friendly URL state                                        | `Fullstack` | `done`                                                                                                                    |
| 3     | Compose a dedicated `/market` page from the new market-status, market-news, and stock-detail primitives                               | `Frontend`  | `done`                                                                                                                    |
| 4     | Implement authenticated portfolio persistence against `portfolio_holdings`                                                            | `Fullstack` | `done`                                                                                                                    |
| 5     | Implement wishlist and preferences flows on top of `wishlist` and `profiles.preferences`                                              | `Fullstack` | `done`                                                                                                                    |
| 6     | Isolate Gemini, cache, and API tracking behind root adapters                                                                          | `Backend`   | `done`                                                                                                                    |
| 7     | Add automated coverage for search, analysis, stock detail, and Supabase-backed services                                               | `Fullstack` | `in_progress` - seeded authenticated search-to-analysis coverage landed; stock-detail and broader service coverage remain |
| 8     | Decide whether `/learn` and `/admin` should be migrated or formally dropped                                                           | `Product`   | `not_started`                                                                                                             |
| 9     | Restore `supabase/seed.sql` or update Supabase seed config so local seeded resets are reproducible                                    | `Data`      | `done`                                                                                                                    |

## Near-Term Implementation Board (2026-04-22)

This board turns the next migration steps into implementation-ready slices with concrete file targets and exit criteria.

### Track 1: Configurable Analysis Controls (`E7-S1`, `E7-S2`, `E7-S3`)

Goal:

- finish the analysis-route controls inside the root app without regressing the current server-first data load

Primary file targets:

- `components/analysis/indicators-panel.tsx` (new)
- `components/analysis/weights-panel.tsx` (new)
- `lib/url-state.ts` (new; adapt the lightweight encode/decode approach from `legacy/frontend/src/lib/urlState.ts`)
- `app/analysis/[symbol]/page.jsx` (parse, normalize, and pass `weights` plus `indicatorsConfig` into `analyzeSymbol`)
- `legacy/frontend/src/components/IndicatorsPanel.tsx` and `legacy/frontend/src/components/WeightsPanel.tsx` (reference only)

Recommended URL contract:

- keep `tf` as the timeframe key
- add `wf`, `wt`, and `ws` for normalized weights
- add `ic` for encoded indicator configuration

Acceptance criteria:

- analysis controls render inside the root analysis experience
- changing timeframe, weights, or indicators updates the URL and re-runs analysis with the same symbol
- refresh and shared links restore the same state
- invalid query params normalize back to safe defaults
- `npm run lint`, `npm run typecheck`, and `npm run build` pass

### Track 2: Dedicated `/market` Page (`E8-S2`, then `E8-S1`)

Goal:

- land a browse-first market surface using the APIs, hooks, and stock-detail primitives that already exist in the root app

Primary file targets:

- `app/market/page.tsx` (new)
- `components/market/market-overview.tsx` (new)
- `components/market/market-status-card.tsx` (new)
- `components/market/market-news-feed.tsx` (new)
- `components/market/trending-tabs.tsx` (new, second pass once the page skeleton is live)
- `components/layout/shell-navigation.ts` (flip `/market` from planned to live once the route lands)
- `hooks/use-us-market-status.ts`
- `hooks/use-market-news.ts`
- `components/layout/stock-symbol-search.tsx`
- `components/stock/stock-symbol-view.tsx` (reuse or link into it rather than duplicating detail widgets)
- `legacy/frontend/src/pages/Market.tsx` and `legacy/frontend/src/components/TrendingTabs.tsx` (reference only)

Acceptance criteria:

- `/market` renders live market status and live news through the current root APIs
- the page supports browse-first discovery and links users into `/stock/[symbol]`
- no legacy hardcoded market cards are required for the MVP route
- the shell navigation marks `/market` as live
- trending can ship as curated symbols first if `lib/market/trending.ts` is still pending

Implementation notes (2026-04-22):

- Landed `app/market/page.tsx` with a dedicated market overview route in the root app
- Added live market status and market news panels backed by the existing hooks and API proxies
- Added curated discovery tabs that branch into migrated stock detail and analysis routes
- Flipped the shell navigation metadata so `/market` is marked live

### Track 3: Portfolio Persistence MVP (`E9-S2`)

Goal:

- deliver the first authenticated persistence surface before expanding into watchlists or preference presets

Primary file targets:

- `app/portfolio/page.tsx` (new)
- `app/portfolio/actions.ts` (new server actions for add, update, delete)
- `components/portfolio/portfolio-view.tsx` (new)
- `components/portfolio/holdings-table.tsx` (new)
- `components/portfolio/holding-form.tsx` (new)
- `lib/portfolio/holdings-service.ts` (new data-access boundary over `portfolio_holdings`)
- `lib/supabase/server.ts`
- `lib/database.types.ts`
- `components/layout/shell-navigation.ts` (flip `/portfolio` from planned to live when ready)
- `legacy/frontend/src/pages/Portfolio.tsx` (reference only)

Acceptance criteria:

- authenticated users can view only their own holdings
- add, edit, and delete flows persist correctly to `portfolio_holdings`
- the page works behind the existing proxy auth flow without extra route exceptions
- holdings rendering stays isolated from raw Supabase calls via a root service boundary
- `npm run lint`, `npm run typecheck`, and `npm run build` pass

Implementation notes (2026-04-22):

- Landed `app/portfolio/page.tsx` with a dedicated authenticated portfolio route
- Added `app/portfolio/actions.ts` server actions for add, update, and delete flows
- Added `lib/portfolio/holdings-service.ts` as the data-access boundary over `portfolio_holdings`
- Added `components/portfolio/portfolio-view.tsx`, `holding-form.tsx`, and `holdings-table.tsx` for the MVP UX
- Flipped the shell navigation metadata so `/portfolio` is marked live

### Track 4: Wishlist And Preferences (`E9-S3`)

Goal:

- close the remaining authenticated user-feature gap using the existing `wishlist` table and `profiles.preferences` JSON column

Primary file targets:

- `lib/user/wishlist-service.ts` (new data-access boundary over `wishlist` and `stocks`)
- `lib/user/preferences-service.ts` (new profile preference normalization and persistence boundary)
- `app/user/actions.ts` (new server actions for wishlist and preference mutations)
- `components/user/wishlist-button.tsx` (new reusable save/remove affordance)
- `components/user/user-personalization-panel.tsx` (new portfolio-surface wishlist and preferences management UI)
- `components/stock/stock-symbol-view.tsx`, `app/analysis/[symbol]/page.jsx`, and `components/market/trending-tabs.tsx` (surface save/remove actions)
- `app/portfolio/page.tsx` and `components/portfolio/portfolio-view.tsx` (compose wishlist/preferences with the portfolio surface)

Acceptance criteria:

- authenticated users can save and remove symbols through the migrated stock, analysis, and market surfaces
- saved symbols persist through `wishlist` and remain user-scoped by existing RLS policies
- users can update lightweight wishlist notes from the portfolio surface
- users can persist default timeframe, currency, risk profile, and default analysis weights through `profiles.preferences`
- wishlist and preferences rendering stays behind root services and server actions, not direct client Supabase calls

Implementation notes (2026-04-23):

- Added root `lib/user/` service boundaries for session context, wishlist persistence, profile preferences, and combined user-feature snapshots
- Added `app/user/actions.ts` server actions with validation and `revalidatePath` coverage for portfolio, market, stock detail, and analysis views
- Added reusable wishlist controls to stock detail, analysis, and curated market tabs
- Added a portfolio personalization panel for saved symbols, notes, and persisted analysis preferences

### Track 5: Test Harness, Parity, And Cutover Prep (`E11-S1`, `E11-S2`, `E11-S3`, `E11-S4`, `E11-S5`)

Goal:

- add enough automated coverage, parity checks, and runtime dependency audits to protect the migrated surfaces before cutover

Primary file targets:

- `package.json` (add `test` scripts)
- `vitest.config.ts` (new)
- `playwright.config.ts` (new)
- `tests/unit/analysis/*.test.ts` (new)
- `tests/integration/services/*.test.ts` (new)
- `tests/integration/routes/*.test.ts` (new)
- `tests/integration/cutover/*.test.ts` (new)
- `tests/fixtures/parity/symbols.json` (new)
- `scripts/parity-check.ts` (new)
- `tests/e2e/search-analysis.spec.ts` (new)
- `tests/e2e/market.spec.ts` (new)
- `tests/e2e/portfolio.spec.ts` (new)

Acceptance criteria:

- the repo has a repeatable local test entry point instead of only lint/typecheck/build checks
- unit coverage exists for analysis weighting and parameter normalization
- integration coverage exists for root service behavior that touches Supabase-backed persistence
- market data and search service boundaries have provider normalization plus fallback coverage
- end-to-end coverage exists for search -> analysis and for each newly landed `/market` and `/portfolio` route
- stock-detail route handlers have coverage for quote, metrics, peers, recommendation, and price-series behavior
- parity fixtures can be checked in contract mode and live root-runtime mode
- active app code is audited for accidental `legacy/frontend` or `legacy/backend` runtime dependencies

Implementation notes (2026-04-23 through 2026-04-25):

- Added Vitest and Playwright test tooling with repeatable `npm run test`, `npm run test:unit`, `npm run test:integration`, and `npm run test:e2e` scripts
- Added unit coverage for analysis URL-state normalization and the migrated analysis weight service
- Added mocked Supabase-backed integration coverage for profile preferences and portfolio holding persistence
- Added market data service coverage for Twelve Data normalization, caching, API tracking, and service fallback behavior
- Added search service coverage for query validation, Finnhub result normalization, caching, API tracking, and curated fallback behavior
- Added Playwright smoke coverage for the public login flow plus anonymous auth-gate behavior on analysis, market, and portfolio routes
- Added seeded authenticated Playwright coverage for dashboard search -> analysis using the local Supabase demo user flow
- Added stock-detail API route coverage for quote, metrics, peers, recommendation, and Alpha Vantage price-series normalization
- Hardened seeded authenticated Playwright coverage with a Supabase Auth reachability gate so missing local stacks skip cleanly
- Added AAPL/NVDA/RIVN parity fixtures plus `npm run parity:check` and `npm run parity:live`; live legacy HTTP comparison passes when `LEGACY_API_BASE_URL` points at the local legacy backend
- Added a cutover audit that fails if active runtime code imports or references `legacy/frontend` or `legacy/backend`
- Removed tracked TypeScript build-info cache files and redirected/disabled future generation so checks do not leave dirty artifacts
- Verification: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, `npm run parity:check`, `npm run parity:live`, and `npm run build` pass; build requires normal network access for `next/font/google`

### Planning Notes

- `runtime.analyzeSymbol()` already accepts `weights` and `indicatorsConfig`, so the analysis-controls work should wire into existing runtime seams instead of introducing a second analysis path.
- The live schema and generated types currently use `wishlist`, not `watchlist_items`. Keep the naming aligned in docs and code unless the team explicitly chooses to add a migration rename.
- The test runner, stock-detail API coverage, market/search service coverage, parity fixtures, live legacy HTTP comparison, and runtime legacy audit are now in place; next work should focus on `/learn` and `/admin` product decisions plus final tracker reconciliation.

## Progress Log

### Sprint 6 Parity And Cutover Coverage - In Progress (2026-04-25)

- Added stock-detail API route coverage for quote, metrics, peers, recommendation, and Alpha Vantage price-series normalization
- Added market data service coverage for provider normalization, cache writes, API tracking, and fallback behavior
- Added search service coverage for blank query validation, Finnhub normalization, cache writes, API tracking, and fallback behavior
- Hardened seeded authenticated Playwright coverage with a Supabase Auth reachability check so missing local stacks skip cleanly
- Added `tests/fixtures/parity/symbols.json` and `scripts/parity-check.ts` with contract, live root-runtime, and live legacy HTTP comparison modes
- Added active runtime legacy import auditing under `tests/integration/cutover/`
- Fixed legacy backend wrapper paths needed to boot the archived API for HTTP parity, and aligned the legacy technical-analysis wrapper with the active basic technical-analysis implementation
- Removed tracked TypeScript build-info caches and redirected/disabled future cache generation to avoid dirty check artifacts
- Verification: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, `npm run parity:check`, `npm run parity:live`, and `LEGACY_API_BASE_URL=http://127.0.0.1:3001 npm run parity:live` pass.

### Local Supabase Seed Workflow And Auth Coverage - Completed (2026-04-24)

- Added committed `supabase/seed.sql` with deterministic local demo users, seeded preferences, wishlist rows, portfolio holdings, cache entries, and API-log records for repeatable local resets
- Updated `README.md` with local Supabase reset steps, the Docker prerequisite, and seeded demo credentials for local validation
- Validated `supabase db reset` against the running local Supabase stack so seeded resets are now reproducible from the repo
- Expanded `tests/e2e/search-analysis.spec.ts` with a signed-in dashboard search -> analysis flow using the seeded local demo account
- Added `lib/supabase/admin.ts` and moved `lib/cache/database-cache.ts` plus `lib/observability/database-api-tracker.ts` onto a dedicated service-role client so `analysis_cache` and `api_call_log` writes bypass RLS as intended
- Verification: `supabase db reset`, `npm run lint`, and `npx playwright test tests/e2e/search-analysis.spec.ts` pass locally when the Supabase env is configured

### AI Summary Provider Isolation - Completed (2026-04-24)

- Added root `lib/ai/fallback-summary-service.js`, `lib/ai/gemini-summary-service.js`, and `lib/ai/index.js` so analysis summaries are selected through a single root provider boundary
- Updated `lib/analysis/runtime.js` and `lib/analysis/analysis-service.js` so the root runtime injects `summaryService` rather than hard-coding an inline fallback adapter
- Added Gemini boundary tests covering fallback mode, successful Gemini generation, and Gemini failure fallback behavior
- Verification: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, and `npm run build` all pass (build still requires normal network access for `next/font/google`)

### Test Harness And Parity Prep - Started (2026-04-23)

- Added Vitest config and scripts for unit and integration test execution
- Added Playwright config and smoke tests for the migrated auth-gated route surfaces
- Covered analysis parameter normalization, weighting behavior, profile preferences, and portfolio persistence with initial automated tests
- Remaining testing work: optional stock-detail UI smoke coverage if the team wants widget-level coverage beyond API routes; remaining migration decisions are `/learn` plus `/admin`

### Wishlist And Preferences - Completed (2026-04-23)

- Added `lib/user/session.ts`, `lib/user/wishlist-service.ts`, `lib/user/preferences-service.ts`, and `lib/user/user-feature-service.ts` so wishlist and preference logic stays behind root service boundaries
- Added `app/user/actions.ts` server actions for saving/removing wishlist symbols, editing wishlist notes, and updating `profiles.preferences`
- Added `components/user/wishlist-button.tsx` and surfaced it from stock detail, analysis, and curated market tabs
- Added `components/user/user-personalization-panel.tsx` to the portfolio route so users can manage saved symbols, notes, default timeframe, currency, risk profile, and default analysis weights
- Reconciled the near-term board so market, portfolio, and user personalization are marked complete; next implementation focus moves to tests, Gemini provider isolation, and learn/admin decisions

### Configurable Analysis Controls - Completed (2026-04-22)

- Added `lib/url-state.ts` to normalize and serialize timeframe, weights, and indicator configuration in Next-friendly query params
- Added `components/analysis/analysis-controls.tsx`, `components/analysis/weights-panel.tsx`, and `components/analysis/indicators-panel.tsx`
- Updated `app/analysis/[symbol]/page.jsx` to read URL state on the server, pass `weights` and `indicatorsConfig` into `analyzeSymbol`, and preserve custom state across timeframe changes
- Updated `lib/analysis/basic-technical-analysis-service.js` so indicator toggles and parameter overrides change the actual technical-analysis result instead of only changing UI state
- Verification: `npm run lint`, `npm run typecheck`, and `npm run build` all pass (build requires normal network access because `app/layout.tsx` uses `next/font/google`)

### Shared Shell Parity - Completed (2026-04-15)

- Mounted `components/layout/navbar.tsx` and `components/layout/footer.tsx` from `components/layout/shell-frame.tsx`, replacing the temporary lightweight header on protected routes
- Added `components/layout/shell-navigation.ts` so the shared shell can distinguish live routes from planned migration targets without sending users to missing pages
- Replaced static navbar auth placeholders with protected-shell theme controls plus sign out, while keeping `/login`, `/register`, `/forgot-password`, and `/reset-password` shellless
- Verification: `npm run lint`, `npm run typecheck`, and `npm run build` all pass (build requires normal network access because `app/layout.tsx` uses `next/font/google`)

### Cache & API Tracking Redesign — Completed (2026-04-03)

#### Database-Backed Cache (`lib/cache/`)

- Created `lib/cache/database-cache.ts` — Supabase-backed cache using `analysis_cache` table
- Created `lib/cache/index.js` — hybrid wrapper maintaining backward-compatible interface
- Cache operations are now async (database calls) but maintain same API
- TTL-based expiration using `expires_at` column
- Stats method queries database for valid/expired counts
- Cleanup script: `scripts/cleanup-cache.ts` run via `npm run cache:cleanup`

#### Database-Backed API Tracker (`lib/observability/`)

- Created `lib/observability/database-api-tracker.ts` — Supabase-backed tracker using `api_call_log` table
- Created `lib/observability/index.js` — hybrid wrapper maintaining backward-compatible interface
- Automatic cleanup of old records when exceeding max (default 1000)
- Statistics by API name with success/failure counts and average response times
- Recent calls queryable for admin dashboard

#### Integration Changes

- Updated `lib/analysis/runtime.js` to import from new hybrid services
- Updated `lib/market/data-source-manager.js` to use new cache/tracker imports
- Added `SUPABASE_SERVICE_ROLE_KEY` to `.env.local.example`
- Added `tsx` dev dependency for running TypeScript cleanup script
- Added `cache:cleanup` npm script for manual/scheduled cleanup

#### Documentation

- Created `docs/CACHE_SYSTEM.md` with architecture, usage examples, and troubleshooting
- Updated `MIGRATION_PLAN.md` to reflect completed E3-S4 and E3-S5 stories

### Sprint 1 — Completed

#### Backend Extraction (Sprint 2 prep, done early)

- Extracted the legacy backend analysis orchestration into `lib/analysis/analysis-service.js`
- Extracted fundamental analysis into `lib/analysis/fundamental-analysis-service.js`
- Extracted technical indicator logic into `lib/analysis/technical-analysis-service.js`
- Extracted sentiment fetching into `lib/analysis/sentiment-service.js`
- Extracted enhanced scoring into `lib/analysis/enhanced-scoring-service.js`
- Extracted weight parsing and recommendations into `lib/analysis/weight-service.js`
- Replaced the legacy backend service implementations with thin wrappers pointing at the new root modules
- Verified syntax on all extracted root modules and backend wrappers using `node --check`

#### Supabase Setup (E2-S1)

- Created Supabase client/server helpers in `lib/supabase/` (client.ts, server.ts, proxy.ts)
- Created Next.js 16 `proxy.ts` entry point for session refresh (replaces deprecated middleware.ts)
- Uses `@supabase/ssr` with `createBrowserClient` and `createServerClient` factories
- Uses `getClaims()` for auth token validation (current Supabase best practice)
- Added graceful pass-through when Supabase env vars are not configured
- Auth route guarding now exists via `proxy.ts` and `utils/supabase/proxy-auth.ts`
- Auth routes now exist for `/login`, `/register`, `/forgot-password`, `/reset-password`, and `/dashboard`
- Server actions now handle sign-in, sign-up, sign-out, and password recovery via Supabase auth
- Sprint 5 remains incomplete because persistence features are still pending
- Environment template created at `supabase/.env.local.example` with local Docker defaults (port 64321)

#### Supabase Schema (E2-S2/S3/S4)

- Designed and created initial schema in `supabase/migrations/20260329000000_initial_schema.sql`
- 6 tables: `profiles`, `stocks`, `wishlist`, `portfolio_holdings`, `analysis_cache`, `api_call_log`
- Current implementation note: the live schema and generated types use `wishlist`; older references to `watchlist_items` below are historical and should not be used for new work.
- `profiles` auto-created via trigger on `auth.users` insert — includes preferences jsonb
- `wishlist` — one entry per stock per user (unique constraint)
- `portfolio_holdings` — single-lot-per-symbol model matching legacy UI data structure
- `analysis_cache` — replaces legacy in-memory `CacheService` (Map with TTL) — uses `expires_at` for cleanup
- `api_call_log` — replaces legacy in-memory `APITrackingService` (capped array) — indexed for admin queries
- RLS enabled on all tables: user-owned tables scoped to `auth.uid()`, service tables scoped to `service_role`
- Supabase seed configuration now targets committed `supabase/seed.sql` with deterministic local demo users for reproducible seeded resets
- Design decision: no `symbols` table — search uses upstream market API (option B) for live data
- Design decision: single lot per symbol in portfolio — multi-lot can be added later

#### Platform Foundation (E1)

- Removed the starter public homepage; `/` now redirects through `proxy.ts` and `utils/supabase/proxy-auth.ts`
- Replaced starter metadata in `app/layout.tsx` with StockViz SEO metadata and title template
- Current routed surface: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/dashboard`, `/market`, `/portfolio`, `/analysis/[symbol]`, `/stock/[symbol]`, `/auth/callback`, and the root market-data API routes
- Feature routes such as `/learn` and `/admin` remain pending migration, while standalone `/indicators` and `/weights` routes stay intentionally folded into `/analysis/[symbol]`
- Active routes use Next.js 16 conventions where applicable (`params` as `Promise`, `generateMetadata`)
- Created `.env.local.example` at root documenting Supabase, Gemini, and market data keys using the current active variable names
- Added `!.env.example` exception to `.gitignore`
- Created shared TypeScript interfaces in `lib/types.ts` (ported from legacy Zod schemas)
- Excluded `legacy/` from TypeScript checks and ESLint to prevent archived-source false positives

#### App Shell (E4)

- Rebuilt navbar in `components/layout/navbar.tsx` - adapted from react-router-dom to Next.js Link/usePathname
- Rebuilt footer in `components/layout/footer.tsx` - adapted from react-router-dom to Next.js Link
- `components/layout/shell-frame.tsx` now mounts the rebuilt navbar/footer as the protected shared shell while still leaving auth routes shellless
- Created `components/providers/theme-provider.tsx` - thin client wrapper around `next-themes`
- Added `Toaster` from `sonner` to root layout
- Theme uses `storageKey: "stockviz-ui-theme"` matching legacy convention
- Added `components/layout/shell-navigation.ts` so live routes stay clickable while unfinished routes render as planned rather than linking to dead pages
- Protected shell actions now expose theme controls plus sign out instead of static auth placeholders
- Onboarding popup decision: deferred (P3, depends on user state)

#### Auth Flow Merged From Auth Branch (E9-S1 done)

- Added auth-aware `proxy.ts` flow using `utils/supabase/proxy-auth.ts`
- Anonymous users are redirected to `/login`
- Authenticated users are redirected away from `/login` and `/register` to `/dashboard`
- Login and register pages now submit to Supabase server actions, and password recovery is available through `/forgot-password` and `/reset-password`
- Dashboard page and the protected shared shell now support sign out via server action
- Current limitation: wishlist/preferences stories remain pending, but the navbar no longer relies on static auth placeholders

#### Branch Sync From Main/Staging (2026-04-13)

- Merged `origin/main` into `migration`, resolving env, Supabase helper, login, and Next config conflicts in favor of the active migration contract
- Merged `origin/staging` into `migration` afterward to bring in the stock-detail slice, market hooks/routes, and password-recovery screens
- Confirmed `origin/auth` and `origin/chore/ci` do not contain newer work beyond what `migration` already had
- Archived legacy source trees remain under `legacy/frontend/` and `legacy/backend/` for reference only
- Current routed surface now includes `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/dashboard`, `/market`, `/portfolio`, `/analysis/[symbol]`, `/stock/[symbol]`, `/auth/callback`, and root API routes for search, symbol lookup, quote, metrics, peers, price series, recommendations, market news, and market status
- `components/layout/shell-frame.tsx` now mounts the rebuilt navbar/footer shell with global symbol search and route-aware planned/live navigation states

#### Search And Analysis Slice Restored (2026-04-03)

- Extracted a root `lib/market/` layer for stock data, fundamentals, and symbol search using fetch-based provider adapters
- Added lightweight root cache and API tracking adapters so the new market layer no longer depends on legacy in-memory singletons
- Added a root analysis runtime that wires extracted analysis services to the new market layer plus a temporary fallback summary adapter
- Restored authenticated symbol search on `/dashboard` and added `/api/search` from the root app
- Added `/analysis/[symbol]` with live data, timeframe switching, score cards, summary output, and a baseline price-history chart
- Added `components/analysis/sentiment-headlines.tsx` so the analysis route now renders recent headlines and sentiment context
- Pinned `turbopack.root` to the project directory in `next.config.ts` so local builds stay scoped to this repo

#### Stock Detail, Market Data, And Password Recovery (2026-04-13)

- Added `app/stock/[symbol]/page.tsx` with `components/stock/stock-symbol-view.tsx` and dedicated widgets for quote, financial metrics, recommendations, peers, and historical prices
- Added `app/api/quote/route.ts`, `app/api/stock-metric/route.ts`, `app/api/stock-peers/route.ts`, `app/api/stock-price-series/route.ts`, and `app/api/stock-recommendation/route.ts` for the browse-first stock flow
- Added `app/api/market-status/route.ts`, `app/api/market-news/route.ts`, and `app/api/symbol-search/route.ts` plus the corresponding `useUsMarketStatus`, `useMarketNews`, and `useSymbolSearch` hooks
- Added `components/layout/stock-symbol-search.tsx` and mounted it in the shared shell header so symbol lookup is available outside the dashboard
- Added `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`, and the supporting auth server actions/callback flow for password recovery
- Added `supabase/migrations/20260413100000_stocks_add_last_price.sql` and `lib/stocks/upsert-stock.ts` so symbol search results can be cached against canonical stock rows

#### Verification

- `origin/main` and `origin/staging` both merged into `migration`; the main-branch merge needed a normal follow-up commit after Git auto-commit failed on Windows with a signal-pipe error
- `legacy/` is excluded from ESLint and TypeScript active checks
- `npm run lint` passes on the active root app
- `npm run typecheck` passes with the merged market/search/analysis/stock slices
- `npm run build` passes after pinning `turbopack.root`; sandboxed builds still need network access for Google Fonts in `app/layout.tsx`
- Current routed surface now includes `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/dashboard`, `/market`, `/portfolio`, `/analysis/[symbol]`, `/stock/[symbol]`, `/auth/callback`, and the root market-data API routes
- Remaining feature-route work is still pending for dedicated `/learn` and `/admin` screens, while standalone `/indicators` and `/weights` remain intentionally folded into `/analysis/[symbol]`

### Plan Reconciliation (2026-04-13)

- Reconciled the root env contract: examples now use the active Supabase and market-data variable names, and runtime env reads tolerate the previous legacy aliases
- Clarified that the current root entry flow is implemented with proxy-based redirects rather than a public `app/page.tsx` route
- Updated the file-by-file migration map to reflect migrated navbar/footer/theme/auth/search/analysis items that already exist in the repo
- Reconciled the story board and checkpoint notes with the merged `main` + `staging` branch state, including stock detail, password recovery, and market-data proxy routes

### Remaining Backend Gaps

- ~~Gemini provider migration is still incomplete; the root runtime currently uses a fallback summary adapter instead of the legacy Gemini service~~ - **Done**: root `lib/ai/` now handles Gemini plus fallback summary generation
- ~~The root cache and API tracking adapters are still in-memory~~ — **Done**: now database-backed using Supabase
- Search, analysis, stock detail, market overview, portfolio, market status/news, and password recovery are live, but dedicated learn and admin routes still need migrated implementations
- Cutover gates now include root parity scripts, live legacy HTTP comparison, and an active runtime legacy import audit; remaining cutover work is final product-scope reconciliation
- The shared app shell now mounts the rebuilt navbar/footer experience with global symbol search; remaining surface work is now focused on the pending feature routes

## Notes

- Replace placeholder owners with actual names if the team wants this file to function as a live tracker.
- Update status values directly in the tables as work progresses.
- If the team wants tighter sprint control, add target dates beside each sprint heading.
