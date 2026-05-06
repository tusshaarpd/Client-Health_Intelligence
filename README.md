# PulseIQ — Client Health Intelligence

Interactive product demo of **PulseIQ**, a client health intelligence platform for agencies and SaaS teams managing many sub-accounts. Detects churn risk early, surfaces root causes, and recommends one-click interventions.

## Features

### V1 — MVP
- Health scores (0–100) per sub-account
- Inline status badges and the health widget
- Sparkline trends and a status filter
- "Resolved / Not Useful" feedback buttons for score quality

### V2 — Pro
- **AI Co-pilot** — natural-language assistant that reads live portfolio data
- **30-day Churn Forecast** — per-account churn probability with portfolio top 3
- **Industry Benchmarks** — score vs. peer industry baseline
- **Account Manager assignment** — search by AM, see ownership in detail
- **Activity Timeline** — chronological log of alerts, actions, score events
- **Bulk Actions** — coordinated interventions across all critical accounts
- **Weekly Digest** — exportable wins/watch-list summary (PDF / Email / Slack)
- **Notification Center** — real-time alerts routed to Slack / email
- **Portfolio Trend chart** — 7-day rolling average across all accounts
- **Save Rate goal tracker** — measured against configurable target
- **Client Status Tracker** — 60-day post-alert outcomes (Save Rate %, MRR saved/lost)
- **AI summaries & one-click recommendations** in the detail panel

## Tech Stack
- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Zero external charting libraries (all SVG)

## Local development
```bash
npm install
npm run dev
```

## Deploy to Vercel

Vercel auto-detects this as a Vite project. The included `vercel.json` configures the build, output directory, and SPA fallback.

### Option A — One command
```bash
npx vercel
```

### Option B — Git import
1. Push the repo to GitHub
2. Open vercel.com → **Import Project** → select the repo
3. Click **Deploy** (no config needed)

The production build is generated with `npm run build` and served from `dist/`.
