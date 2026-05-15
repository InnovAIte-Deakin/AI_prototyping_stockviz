# StockViz

> A stock screening and visualization application built with Next.js 16 and Supabase.

## Overview

StockViz is a web application for exploring, filtering, and visualizing stock market data. The active product now runs as a Next.js App Router application with Supabase-backed authentication and data services, while the earlier prototype remains archived in this repository for reference.

## Current Architecture

- `app/` contains the active Next.js 16 App Router routes, layouts, and API endpoints.
- `components/`, `hooks/`, `lib/`, and `utils/` hold the shared UI, client hooks, and server-side helpers used by the live application.
- `/admin` provides the retained in-app diagnostics console for service readiness, cache state, and API usage.
- `supabase/` contains backend configuration and supporting project assets.
- `legacy/frontend/` and `legacy/backend/` contain the original React and Express prototype and are no longer part of the active runtime.

## Market Data Direction

The active app now uses Yahoo Finance as the primary source for chart data and symbol search, while Alpha Vantage is preferred for fundamentals and sentiment when configured. The admin diagnostics page can control preferred providers where supported, with alternate providers retained as fallbacks.

Newer stock-detail and dashboard features also use Finnhub quotes, FMP movers/news, and Gemini explanations where configured. API-key-dependent experiences fail gracefully when their keys are absent.

Changes from the original migrated project:

- Added a Yahoo Finance market data adapter for chart data, quote summary fundamentals, and symbol search normalization.
- Updated the market data manager so Yahoo Finance is tried first for stock data and search, while Alpha Vantage is preferred for fundamentals and sentiment where configured.
- Updated the stock price series API to serve Yahoo Finance chart data through the existing `{ series }` response contract used by the application.
- Renamed the active client-side price series hook and yearly aggregation utility to provider-neutral modules, while keeping Alpha Vantage compatibility re-exports for existing imports.
- Updated dashboard/detail copy and admin diagnostics so the active provider status reflects Yahoo Finance for chart/search data and Alpha Vantage for fundamentals/sentiment data.
- Added tests for the Yahoo Finance normalizers, provider fallback behavior, and the updated price series route.
- Added provider-backed technical analysis, price-range explanations, market movers, wishlist stars, richer financial widgets, and additive paper trading.

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill the services needed for the flows you are testing:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for authenticated app routes.
- `SUPABASE_SERVICE_ROLE_KEY` for admin/provider server reads and paper-trading RPC execution.
- `FINNHUB_API_KEY` for quotes, stock detail widgets, paper-trading execution prices, and paper portfolio marks.
- `ALPHA_VANTAGE_API_KEY` and `TWELVE_DATA_API_KEY` for configured market-data fallbacks.
- `FMP_API_KEY` for dashboard movers and news used in explanations.
- `GEMINI_API_KEY` plus optional `GEMINI_EXPLAIN_MODEL` for AI explanations.

## Paper Trading Setup

Paper trading is additive to the existing manual portfolio screen. Apply the committed Supabase migrations with `supabase db reset` locally or your normal deployment migration flow. The paper-trading migration adds `profiles.paper_cash_usd`, `portfolio_transactions`, and service-role-only `paper_buy` / `paper_sell` RPCs.

The stock-page trade widget appears only when the signed-in profile has a `paper_cash_usd` value. The portfolio page keeps manual holdings and adds the paper portfolio ledger panel underneath.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Local Supabase Reset

To rebuild the local database with the committed schema and seed data:

```bash
supabase start
supabase db reset
```

Docker Desktop needs to be running before you use the local Supabase CLI.
Copy `.env.local.example` to `.env.local` and fill in the local Supabase URL and publishable key before testing authenticated flows.
Root `.env.local.example` documents the Next.js app environment contract. `supabase/.env.local.example` documents local Supabase CLI defaults for the Supabase project directory.

If login or registration shows `fetch failed`, check that the local Supabase
stack is running:

```bash
supabase status
supabase start
```

When the CLI reports stale or stopped containers, restart the stack:

```bash
supabase stop
supabase start
```

Seeded local accounts:

- `demo@stockviz.local` / `StockVizDemo123!`
- `analyst@stockviz.local` / `StockVizAnalyst123!`

Optional admin restriction:

- Set `STOCKVIZ_ADMIN_EMAILS` to a comma-separated list of operator emails before a shared deployment. If unset, authenticated local/dev users can open `/admin`.

## Useful Commands

CI runs lint, typecheck, Vitest, build, and parity checks against deterministic dummy environment values. Browser E2E tests remain local until the project has a CI-owned Supabase/Auth fixture.

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run parity:check
npm run parity:live
npm run build
npm run format:check
```

## Parity Checks

`npm run parity:check` validates the committed parity fixture contract and confirms active runtime code does not import from `legacy/`.

`npm run parity:live` validates the active root analysis runtime against the committed parity symbols.

## Project Structure

```text
stockviz/
|- app/                  # Active Next.js App Router codebase
|- components/           # Shared UI and feature components
|- hooks/                # Client hooks
|- lib/                  # Data, analysis, and server utilities
|- supabase/             # Supabase project assets
|- docs/                 # Project documentation and evidence
`- legacy/
   |- frontend/          # Archived React prototype
   `- backend/           # Archived Express API prototype
```

## Roadmap

- [x] Prototype with standalone React and Express
- [x] Bootstrap the active Next.js App Router application
- [x] Complete the Supabase-backed migration foundations
- [x] Resolve remaining legacy feature scope
- [ ] Add real-time data subscriptions where they provide clear user value

_StockViz - Capstone AI Prototyping Project_
