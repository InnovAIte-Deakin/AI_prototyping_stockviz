# StockViz

> A stock screening and visualization application built with Next.js 16 and Supabase.

## Overview

StockViz is a web application for exploring, filtering, and visualizing stock market data. The active product now runs as a Next.js App Router application with Supabase-backed authentication and data services, while the earlier prototype remains archived in this repository for reference.

## Current Architecture

- `app/` contains the active Next.js 16 App Router routes, layouts, and API endpoints.
- `components/`, `hooks/`, `lib/`, and `utils/` hold the shared UI, client hooks, and server-side helpers used by the live application.
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

Seeded local accounts:

- `demo@stockviz.local` / `StockVizDemo123!`
- `analyst@stockviz.local` / `StockVizAnalyst123!`

## Useful Commands

```bash
npm run lint
npm run typecheck
npm run build
npm run format:check
```

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
- [ ] Complete the Supabase-backed migration
- [ ] Finish migrating remaining legacy features
- [ ] Add real-time data subscriptions where they provide clear user value

_StockViz - Capstone AI Prototyping Project_
