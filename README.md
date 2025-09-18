## StockViz – Hybrid Stock Analysis (Frontend + Backend)

An end-to-end stock analysis app that combines fundamentals, technicals, sentiment, and AI-powered summaries in a responsive React UI served by an Express API. It supports advanced “Pro Mode” sliders, technical indicator presets, and a first‑time tutorial.

This README covers:
- Cloning and running locally
- Running with Docker (one command)
- Deploying to Render from the Docker image
- Branches and project layout
- Feature overview and usage tips

---

## Quick Start (no setup) – Docker

If you have Docker installed, you can run the entire app (frontend + backend) with a single command:

```bash
docker run -p 3001:3001 anoop896/stock-analysis-app:latest
```

Then open the app at:

- http://localhost:3001

Notes:
- Dark theme is default and follows system preference.
- A tutorial icon appears in the navbar (near Sign In/Sign Up). First-time visitors will see the tutorial automatically.
- API keys are optional for trying things out. For live fundamentals/technicals/sentiment at scale, set env vars (see Environment Variables below).

---

## Deploy from Docker to Render (public URL)

Use the already-published image to get a shareable link quickly.

1) Sign in at https://render.com
2) New → Web Service → “Deploy an existing image”
3) Image: `anoop896/stock-analysis-app:latest`
4) Port: `3001`
5) Add env vars if you have them (see Environment Variables)
6) Deploy → copy the public URL once healthy

That’s it. The same container serves the React UI and the API.

---

## Run from source – recommended branch

There are two key branches:
- `backend` – stable baseline. Recently reverted to preserve history.
- `updated-UI` – latest UI/UX, tutorial system, navbar tutorial icon, theme fixes, and Docker integration.

For the best local developer experience, use `updated-UI`:

```bash
git clone https://github.com/InnovAIte-Deakin/AI_prototyping_stockviz.git
cd AI_prototyping_stockviz
git checkout updated-UI
```

The `updated-UI` branch contains a single-container setup (Dockerfile) where the backend serves the built frontend. You can either:

### A) One-command Docker run (from source)

```bash
docker build -t stock-analysis-app .
docker run -p 3001:3001 stock-analysis-app
```

Open http://localhost:3001

### B) Local dev (hot reload)

In `updated-UI`, the backend exposes API routes and also serves the frontend build. For hot reload on the frontend during dev, run Vite separately and point the backend CORS to it (or use same-origin by building frontend).

Typical developer loop:

1) Install dependencies

```bash
# In project root (updated-UI)
npm install
```

2) Start backend (Express)

```bash
# From Backend/backend folder if present, or root depending on layout in updated-UI
npm run start
```

3) Start frontend (Vite)

```bash
# From Frontend folder
npm run dev
```

4) Visit the frontend dev server URL (usually http://localhost:5173) and ensure the API base URL is set (see Environment Variables and apiClient notes below). For production-like testing, simply run the Docker build/run and use http://localhost:3001.

---

## Environment Variables

The app works without keys for a quick trial (uses graceful fallbacks), but for full fidelity you can set:

- `ALPHA_VANTAGE_API_KEY` – Fundamentals/Technicals
- `GEMINI_API_KEY` – AI summaries
- `PORT` – Defaults to 3001 in the container
- Frontend `VITE_BACKEND_URL` – Optional; if omitted, the frontend defaults to same-origin API (ideal inside the single container)

Examples (Docker):

```bash
docker run -p 3001:3001 \
  -e ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key \
  -e GEMINI_API_KEY=your_gemini_key \
  anoop896/stock-analysis-app:latest
```

---

## Features Overview

- Stock search with exchange-aware symbols
- Live TradingView chart (exchange:symbol formatting)
- Smart Mode (simple) and Pro Mode (advanced)
- Pro Mode controls: Weights, indicators (RSI, MACD, SMA/EMA, Bollinger Bands, patterns)
- Technical snapshot panel
- Fundamentals panel (hides nulls automatically)
- News & sentiment with markdown-rendered summaries
- Tutorial system:
  - Auto-shown to first-time visitors
  - Tutorial icon in navbar near Sign In/Sign Up
  - Step-by-step guidance and feature highlights

---

## API Endpoints (served by Express)

Base URL depends on how you run the app:
- Docker/local single container: `http://localhost:3001`
- Render (or other host): `https://your-deployment.example.com`

Key endpoints:
- `GET /health`
- `GET /api/stocks/search?query=SYMBOL_OR_NAME`
- `GET /api/stocks/indicators` (presets)
- `GET /api/stocks/weights/defaults`
- `GET /api/stocks/analysis/:symbol?timeframe=1M&mode=normal`
- Advanced examples:
  - `...&mode=advanced&fundamental=30&technical=40&sentiment=30`
  - `...&mode=advanced&indicators={"RSI":{"period":14},"MACD":{"fastPeriod":12,"slowPeriod":26,"signalPeriod":9}}`

The frontend maps Pro Mode sliders and toggles to these query parameters.

---

## Frontend Notes

- Stack: Vite + React + TypeScript + Tailwind + shadcn-ui
- Markdown rendering: `react-markdown` for AI and sentiment summaries
- API client logic: `src/services/apiClient.ts` defaults to same-origin if `VITE_BACKEND_URL` is not set (ideal inside Docker)
- Tutorial:
  - Global context ensures navbar icon and pages share state
  - Auto-opens once for new users; stored in `localStorage` under `stockviz-tutorial-seen`

---

## Branches & How to Switch

- `backend`: Baseline branch. A revert was applied to keep history clean.
- `updated-UI`: Latest UI/UX and deployment improvements (recommended for development and Docker builds from source).

Switch branches:

```bash
git checkout updated-UI   # recommended for active development
# or
git checkout backend      # baseline branch
```

---

## Troubleshooting

- Port already in use (Windows):
  - Try another port: `docker run -p 8080:3001 ...` then open http://localhost:8080
- Render shows only API:
  - Ensure you deployed the Docker image `anoop896/stock-analysis-app:latest`
  - The container serves both API and frontend from the same process
- Tutorial icon not opening:
  - Ensure you’re on the latest image
  - Open DevTools Console; clicking the icon should log messages from the tutorial context

---

## License

This project is provided as-is for educational and prototyping purposes.

