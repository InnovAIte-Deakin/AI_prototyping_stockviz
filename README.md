# StockViz

> A stock screening and visualization application for the modern web.

---

## Overview

StockViz is a web-based stock screening tool built for exploring, filtering, and visualizing market data. Now transitioning to a modern full-stack architecture.

---

## Current Architecture

This repository now runs on **Next.js** (bootstrapped with `create-next-app`) with **Supabase** as the backend — bringing server-side rendering, a managed Postgres database, authentication, and real-time capabilities out of the box.

### Legacy Code

The `frontend/` and `backend/` directories at the root contain the **original prototype** — a standalone React frontend paired with an Express API server. These folders are kept for reference and inspection only. They are no longer the active codebase.

---

## Getting Started

**Install dependencies:**

```bash
npm install
```

**Start the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
stockviz/
├── app/          # Next.js App Router (active codebase)
├── frontend/     # Legacy React prototype (inspection only)
└── backend/      # Legacy Express API (inspection only)
```

---

## Roadmap

- [x] Prototype with standalone React + Express
- [x] Bootstrap Next.js with App Router
- [ ] Integrate Supabase (Postgres + Auth + Edge Functions)
- [ ] Migrate features from legacy prototype
- [ ] Real-time data subscriptions

---

*StockViz — Capstone AI Prototyping Project*
