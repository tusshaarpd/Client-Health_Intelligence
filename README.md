# Client Health Intelligence — GoHighLevel Mockup

Interactive mockup of the CHI (Client Health Intelligence) feature for GoHighLevel.

## Features

- **V1 MVP**: Health scores (0–100), inline badges, health widget, "Resolved / Not Useful" feedback buttons
- **V2 Full**: AI summaries, recommendations with one-click actions, critical drop alerts, detail panel
- **10 mock sub-accounts** ranging from Critical (34) to Healthy (95)
- Filter by status, search by name, click any account for the detail panel
- Toggle V1/V2 in the sidebar to show phased rollout

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Zero external dependencies (no chart libraries — all SVG)

## Deploy to Vercel

### Option A: One command (recommended)
```bash
cd chi-mockup
npx vercel
```

### Option B: GitHub → Vercel
1. Push this folder to a GitHub repo
2. Go to vercel.com → Import Project → Select repo
3. Vercel auto-detects Vite — just click Deploy

### Local Development
```bash
npm install
npm run dev
```

Built for: Senior PM – AI Growth Interview at GoHighLevel
