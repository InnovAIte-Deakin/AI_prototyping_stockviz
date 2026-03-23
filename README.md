# StockViz

> A stock screening and visualization application for the modern web.

---

## Overview

StockViz is a web-based stock screening tool built for exploring, filtering, and visualizing market data. The project is currently structured as two self-contained applications — a frontend and a backend.

---

## Architecture Notice

> **This is a legacy architecture.**
>
> The current Express + React setup served its purpose as a rapid prototype. We are actively planning a migration to a modern, scalable stack based on **Next.js** and **Supabase**. The new architecture will bring server-side rendering, edge functions, a managed Postgres database, and real-time capabilities out of the box.

Stay tuned for updates on the migration.

---

## Getting Started

Both the frontend and backend are independently runnable. To get up and running:

**1. Install dependencies**

```bash
# From the project root
cd frontend && npm install
cd ../backend && npm install
```

**2. Start the development servers**

```bash
# In separate terminals
cd frontend && npm run dev
cd backend && npm run dev
```

---

## Project Structure

```
stockviz/
├── frontend/   # React-based UI
└── backend/    # API server
```

---

*StockViz — Capstone AI Prototyping Project*
