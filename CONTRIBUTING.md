# Contributing To StockViz

## Branching

Use short-lived branches from `migration` for quality work. Keep one behavioral concern per commit.

## Before Commit

Run:

```bash
npm run typecheck
npm run test
```

For UI or route changes, run the most specific route, component, or Playwright test as well.

## Server Actions

Files with `"use server"` must export only async server functions. Put shared state, constants, and types in a nearby plain module such as `action-types.ts`.

## Next.js Version

This project uses Next.js 16. Read local docs under `node_modules/next/dist/docs/` before changing route, proxy, server action, or caching conventions.

## Legacy Code

`legacy/` is archive/reference code. Do not add product work there.
