# PulseIQ — Client Health Intelligence

> Predict churn, surface root causes, and act in one click — across every sub-account in your portfolio.

**PulseIQ** is a client health intelligence platform for agencies and SaaS teams managing many sub-accounts. It rolls up activity across pipeline, campaigns, conversations and reviews into a single 0–100 health score, then layers AI on top to forecast churn, recommend interventions, and prove that early-warning alerts actually retain revenue.

This repository is an interactive product demo built as a single-page React app. All data is mocked — there are no external services or API keys required to run it.

---

## Demo highlights

- **10 mock sub-accounts** spanning Critical (34) → Healthy (95)
- **V1 / V2 toggle** in the sidebar to walk through phased rollout
- **AI Co-pilot** that answers natural-language portfolio questions
- **Churn forecasts**, industry benchmarks, account-manager ownership
- **60-day Save Rate tracker** validating that alerts actually prevent churn

---

## Features

### V1 — MVP
| Feature | What it does |
| --- | --- |
| Health Score (0–100) | Weighted roll-up of Pipeline (35%), Campaigns (25%), Conversations (25%), Reviews (15%) |
| Inline Status Badges | Critical / At Risk / Healthy badges on every account row |
| Sparkline Trends | 7-day mini chart per account, color-coded by direction |
| Status Filter | One-click filter for Critical / At Risk / Healthy |
| Search | Filter by account name |
| Feedback Buttons | "Resolved / Not Useful" on each card to grade score quality |
| Detail Panel | Click any account for the full domain breakdown |

### V2 — Pro
| Feature | What it does |
| --- | --- |
| **AI Co-pilot** | Chat assistant that reads live portfolio data; answers priority, root-cause, comparison and forecast questions in seconds |
| **30-day Churn Forecast** | Per-account churn probability + a top-3 widget on the dashboard |
| **Industry Benchmarks** | Each score is plotted against its vertical baseline (Dental, Fitness, Real Estate, Legal, Marketing, etc.) |
| **Account Manager Ownership** | AM assigned to each account, shown in list and detail; AM is a searchable field |
| **Activity Timeline** | Chronological log of alert / action / score / note events on every account |
| **Bulk Actions** | When the Critical filter is active, run a coordinated re-engagement or AM assignment across all flagged accounts |
| **Weekly Digest** | Auto-generated wins + watch-list summary, exportable to PDF, email, or Slack |
| **Notification Center** | Bell icon in the header with unread badges; routes to Slack `#cs-alerts` and AM email |
| **Portfolio Trend Chart** | 7-day rolling average across all accounts with delta vs. a week ago |
| **Save Rate Goal Tracker** | Progress bar against a configurable retention target |
| **Client Status Tracker** | 60-day post-alert outcomes table — Recovered / Stable / Churned / In Progress, with MRR saved vs. lost |
| **AI Health Summary** | Human-readable narrative for the selected account, citing benchmark and AM |
| **One-Click Recommendations** | Impact-tagged actions (Open Pipeline, Enable Auto-Reply, Setup Text-Back, etc.) |

---

## Tech stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS 4** (via `@tailwindcss/vite`)
- **Zero charting libraries** — every sparkline, trend chart, and ring is hand-rolled SVG
- **No backend** — all client data lives in `src/App.tsx` and is fully deterministic

---

## Try the AI Co-pilot

Open V2 from the sidebar, click the floating 🤖 button (or the **AI Co-pilot** nav item), and try:

- *"Which clients need attention this week?"* — ranked priority list with root causes
- *"Forecast: who's most likely to churn?"* — top-5 with probabilities and MRR exposure
- *"Why is Aqua Dental's score dropping?"* — domain-level deep dive vs. industry benchmark
- *"Show me clients with pipeline problems"* — domain-specific filter
- *"What's the biggest revenue risk right now?"* — MRR-weighted impact analysis
- *"Compare Bright Smile vs Peak Performance"* — side-by-side metrics
- *"Which clients improved this month?"* — positive trends

The Co-pilot is fully deterministic — no LLM is called, no key is needed. It runs against the in-memory dataset.

---

## Project structure

```
.
├── index.html              # SPA entry, OG tags, theme color
├── vercel.json             # Build, SPA fallback, asset cache headers
├── vite.config.ts          # Vite + React + Tailwind plugins
├── public/                 # Static favicon & icons
└── src/
    ├── main.tsx            # React root
    ├── index.css           # Tailwind + body styling
    └── App.tsx             # Entire app — data, components, co-pilot
```

`src/App.tsx` is intentionally a single file so the demo is easy to read end-to-end. Mock data, helper utilities, micro-components, the co-pilot intent engine, and the main layout all live there.

---

## Local development

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build to dist/
npm run preview      # serve the production build locally
npm run lint         # eslint
```

---

## Deploy to Vercel

`vercel.json` already declares the framework, build commands, SPA rewrites, and long-term cache headers for `/assets/*`. **No additional configuration is needed.**

### Option A — CLI

```bash
npx vercel           # preview deploy
npx vercel --prod    # production deploy
```

### Option B — Git import (recommended)

1. Push this repo to GitHub.
2. Open [vercel.com](https://vercel.com) → **Add New… → Project** → import this repo.
3. Vercel auto-detects Vite. Click **Deploy**.
4. Subsequent pushes to the connected branch trigger automatic builds.

### Build output

```
dist/index.html         ~1 kB
dist/assets/index-*.css ~33 kB  (gzip: ~6.6 kB)
dist/assets/index-*.js  ~251 kB (gzip: ~74 kB)
```

### `vercel.json` highlights

- `framework: "vite"` — auto-detection still works even without it
- `cleanUrls: true` — strips `.html` from URLs
- `rewrites` → SPA fallback to `/index.html` for any non-asset path
- `headers` → `Cache-Control: public, max-age=31536000, immutable` on hashed assets

---

## Roadmap (post V2)

- Real-time data ingestion via webhook + edge functions
- Per-AM workload view and SLA tracking
- Cohort segmentation by industry / MRR tier
- Configurable score weights and benchmarks per workspace
- Dark mode
- LLM-backed Co-pilot (Anthropic / OpenAI) with tool use over the live dataset

---

## License

Proprietary demo. Not for redistribution.
