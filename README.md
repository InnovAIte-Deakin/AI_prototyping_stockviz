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

`npm run parity:live` validates the active root analysis runtime against the committed parity symbols. To include a running legacy backend comparison, start the legacy API and set `LEGACY_API_BASE_URL=http://127.0.0.1:3001` before running the command.

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
