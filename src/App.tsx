import { useState, useMemo, useRef, useEffect } from "react";

/* ───────────── types ───────────── */
type Domain = { label: string; score: number; weight: number };
type Alert = { id: string; type: "critical_drop" | "churn_risk" | "opportunity"; message: string; ts: string };
type Recommendation = { id: string; text: string; impact: "high" | "medium" | "low"; action?: string };
type ActivityEvent = { id: string; ts: string; kind: "alert" | "action" | "score" | "note"; text: string };
type Client = {
  id: string;
  name: string;
  industry: string;
  accountManager: string;
  score: number;
  status: "healthy" | "at_risk" | "critical";
  trend: number[];
  domains: Domain[];
  mrr: number;
  alerts: Alert[];
  recommendations: Recommendation[];
  lastActivity: string;
  churnProbability: number;
  activity: ActivityEvent[];
};

/* ───────────── industry benchmarks (V2) ───────────── */
const INDUSTRY_BENCHMARK: Record<string, number> = {
  "Dental": 72,
  "Orthodontics": 70,
  "Fitness": 68,
  "Real Estate": 65,
  "Legal": 73,
  "Marketing": 78,
  "Landscaping": 64,
  "Auto Services": 66,
  "Wellness & Spa": 75,
};

/* ───────────── mock data ───────────── */
const CLIENTS: Client[] = [
  {
    id: "1", name: "Aqua Dental Studio", industry: "Dental", accountManager: "Sarah Chen",
    score: 34, status: "critical", churnProbability: 78,
    trend: [62, 58, 51, 47, 42, 38, 34], mrr: 497, lastActivity: "3 days ago",
    domains: [
      { label: "Pipeline", score: 28, weight: 0.35 },
      { label: "Campaigns", score: 41, weight: 0.25 },
      { label: "Conversations", score: 22, weight: 0.25 },
      { label: "Reviews", score: 52, weight: 0.15 },
    ],
    alerts: [
      { id: "a1", type: "critical_drop", message: "Pipeline score dropped 18 pts in 14 days", ts: "2h ago" },
      { id: "a2", type: "churn_risk", message: "No new contacts added in 21 days", ts: "1d ago" },
    ],
    recommendations: [
      { id: "r1", text: "Re-engage stale pipeline — 23 leads untouched >14 days. Send a reactivation campaign.", impact: "high", action: "Open Pipeline" },
      { id: "r2", text: "Review response rate is 12%. Enable AI Review Responder to auto-reply.", impact: "medium", action: "Enable Auto-Reply" },
    ],
    activity: [
      { id: "e1", ts: "2h ago", kind: "alert", text: "Critical drop alert triggered (-18 pts pipeline)" },
      { id: "e2", ts: "1d ago", kind: "alert", text: "Churn risk flag raised — 21d zero new contacts" },
      { id: "e3", ts: "3d ago", kind: "score", text: "Health score crossed below 50 (Critical)" },
      { id: "e4", ts: "6d ago", kind: "note", text: "AM call attempted — no answer" },
    ],
  },
  {
    id: "2", name: "Bright Smile Orthodontics", industry: "Orthodontics", accountManager: "Marcus Lee",
    score: 42, status: "critical", churnProbability: 65,
    trend: [68, 63, 57, 52, 48, 45, 42], mrr: 297, lastActivity: "5 days ago",
    domains: [
      { label: "Pipeline", score: 35, weight: 0.35 },
      { label: "Campaigns", score: 48, weight: 0.25 },
      { label: "Conversations", score: 38, weight: 0.25 },
      { label: "Reviews", score: 55, weight: 0.15 },
    ],
    alerts: [{ id: "a3", type: "critical_drop", message: "Conversations score dropped 15 pts in 7 days", ts: "6h ago" }],
    recommendations: [
      { id: "r3", text: "Missed call rate is 45%. Set up AI Missed-Call Text-Back to recover leads.", impact: "high", action: "Setup Text-Back" },
      { id: "r4", text: "Campaign open rate is declining. A/B test subject lines with AI Email Writer.", impact: "medium" },
    ],
    activity: [
      { id: "e5", ts: "6h ago", kind: "alert", text: "Conversations score dropped 15 pts in 7 days" },
      { id: "e6", ts: "2d ago", kind: "action", text: "AI Missed-Call Text-Back enabled by AM" },
      { id: "e7", ts: "5d ago", kind: "score", text: "Health score moved into Critical band" },
    ],
  },
  {
    id: "3", name: "Peak Performance Gym", industry: "Fitness", accountManager: "Priya Patel",
    score: 48, status: "at_risk", churnProbability: 52,
    trend: [71, 65, 60, 56, 52, 50, 48], mrr: 497, lastActivity: "1 day ago",
    domains: [
      { label: "Pipeline", score: 52, weight: 0.35 },
      { label: "Campaigns", score: 44, weight: 0.25 },
      { label: "Conversations", score: 41, weight: 0.25 },
      { label: "Reviews", score: 58, weight: 0.15 },
    ],
    alerts: [{ id: "a4", type: "churn_risk", message: "Campaign engagement dropped below 20%", ts: "12h ago" }],
    recommendations: [{ id: "r5", text: "Activate workflow automations for new lead nurture — currently manual follow-up only.", impact: "high", action: "Create Workflow" }],
    activity: [
      { id: "e8", ts: "12h ago", kind: "alert", text: "Campaign engagement <20% — churn risk flag" },
      { id: "e9", ts: "3d ago", kind: "action", text: "Workflow automation draft created by AM" },
    ],
  },
  {
    id: "4", name: "Luxe Home Realty", industry: "Real Estate", accountManager: "Diego Ruiz",
    score: 55, status: "at_risk", churnProbability: 28,
    trend: [60, 58, 57, 56, 55, 55, 55], mrr: 297, lastActivity: "Today",
    domains: [
      { label: "Pipeline", score: 58, weight: 0.35 },
      { label: "Campaigns", score: 52, weight: 0.25 },
      { label: "Conversations", score: 50, weight: 0.25 },
      { label: "Reviews", score: 62, weight: 0.15 },
    ],
    alerts: [],
    recommendations: [{ id: "r6", text: "Pipeline velocity slowing — average deal age increased from 8 to 14 days.", impact: "medium", action: "View Pipeline" }],
    activity: [
      { id: "e10", ts: "1d ago", kind: "score", text: "Score plateaued at 55 for 3 consecutive days" },
      { id: "e11", ts: "4d ago", kind: "note", text: "AM scheduled QBR for next week" },
    ],
  },
  {
    id: "5", name: "Summit Legal Group", industry: "Legal", accountManager: "Sarah Chen",
    score: 61, status: "at_risk", churnProbability: 19,
    trend: [72, 70, 68, 65, 63, 62, 61], mrr: 497, lastActivity: "Today",
    domains: [
      { label: "Pipeline", score: 65, weight: 0.35 },
      { label: "Campaigns", score: 58, weight: 0.25 },
      { label: "Conversations", score: 55, weight: 0.25 },
      { label: "Reviews", score: 70, weight: 0.15 },
    ],
    alerts: [{ id: "a5", type: "opportunity", message: "Reviews score trending up — good time to request more", ts: "1d ago" }],
    recommendations: [{ id: "r7", text: "Good review momentum. Launch a review request campaign to capitalize.", impact: "medium", action: "Send Review Request" }],
    activity: [
      { id: "e12", ts: "1d ago", kind: "alert", text: "Opportunity flag — review momentum building" },
      { id: "e13", ts: "1w ago", kind: "action", text: "AM launched review request workflow" },
    ],
  },
  {
    id: "6", name: "Green Valley Landscaping", industry: "Landscaping", accountManager: "Marcus Lee",
    score: 73, status: "healthy", churnProbability: 8,
    trend: [65, 68, 70, 71, 72, 73, 73], mrr: 297, lastActivity: "Today",
    domains: [
      { label: "Pipeline", score: 75, weight: 0.35 },
      { label: "Campaigns", score: 70, weight: 0.25 },
      { label: "Conversations", score: 72, weight: 0.25 },
      { label: "Reviews", score: 76, weight: 0.15 },
    ],
    alerts: [],
    recommendations: [{ id: "r8", text: "Strong engagement across the board. Consider upselling to Agency Pro plan.", impact: "low" }],
    activity: [
      { id: "e14", ts: "2d ago", kind: "score", text: "Score crossed 70 — moved into Healthy band" },
    ],
  },
  {
    id: "7", name: "Nova Digital Marketing", industry: "Marketing", accountManager: "Priya Patel",
    score: 81, status: "healthy", churnProbability: 4,
    trend: [74, 76, 77, 78, 79, 80, 81], mrr: 497, lastActivity: "Today",
    domains: [
      { label: "Pipeline", score: 84, weight: 0.35 },
      { label: "Campaigns", score: 78, weight: 0.25 },
      { label: "Conversations", score: 80, weight: 0.25 },
      { label: "Reviews", score: 82, weight: 0.15 },
    ],
    alerts: [],
    recommendations: [{ id: "r9", text: "Top performer. Feature as a case study for other sub-accounts.", impact: "low" }],
    activity: [
      { id: "e15", ts: "1w ago", kind: "note", text: "Selected as case study reference account" },
    ],
  },
  {
    id: "8", name: "Coastal Fitness Co", industry: "Fitness", accountManager: "Diego Ruiz",
    score: 87, status: "healthy", churnProbability: 2,
    trend: [80, 82, 83, 84, 85, 86, 87], mrr: 297, lastActivity: "Today",
    domains: [
      { label: "Pipeline", score: 90, weight: 0.35 },
      { label: "Campaigns", score: 85, weight: 0.25 },
      { label: "Conversations", score: 84, weight: 0.25 },
      { label: "Reviews", score: 88, weight: 0.15 },
    ],
    alerts: [], recommendations: [], activity: [],
  },
  {
    id: "9", name: "Elite Auto Detailing", industry: "Auto Services", accountManager: "Sarah Chen",
    score: 91, status: "healthy", churnProbability: 1,
    trend: [85, 87, 88, 89, 90, 91, 91], mrr: 497, lastActivity: "Today",
    domains: [
      { label: "Pipeline", score: 93, weight: 0.35 },
      { label: "Campaigns", score: 88, weight: 0.25 },
      { label: "Conversations", score: 90, weight: 0.25 },
      { label: "Reviews", score: 94, weight: 0.15 },
    ],
    alerts: [], recommendations: [], activity: [],
  },
  {
    id: "10", name: "Harmony Wellness Spa", industry: "Wellness & Spa", accountManager: "Marcus Lee",
    score: 95, status: "healthy", churnProbability: 1,
    trend: [88, 90, 91, 92, 93, 94, 95], mrr: 497, lastActivity: "Today",
    domains: [
      { label: "Pipeline", score: 96, weight: 0.35 },
      { label: "Campaigns", score: 94, weight: 0.25 },
      { label: "Conversations", score: 93, weight: 0.25 },
      { label: "Reviews", score: 97, weight: 0.15 },
    ],
    alerts: [], recommendations: [], activity: [],
  },
];

/* ───────────── helpers ───────────── */
const statusBg = (s: string) =>
  s === "critical" ? "bg-red-50 border-red-200" : s === "at_risk" ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200";
const statusDot = (s: string) =>
  s === "critical" ? "bg-red-500" : s === "at_risk" ? "bg-amber-400" : "bg-emerald-500";
const statusLabel = (s: string) =>
  s === "critical" ? "Critical" : s === "at_risk" ? "At Risk" : "Healthy";
const impactBadge = (i: string) =>
  i === "high" ? "bg-red-100 text-red-700" : i === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600";
const churnColor = (p: number) =>
  p >= 60 ? "text-red-600" : p >= 30 ? "text-amber-600" : "text-emerald-600";
const churnBg = (p: number) =>
  p >= 60 ? "bg-red-500" : p >= 30 ? "bg-amber-400" : "bg-emerald-500";
const activityIcon = (k: string) =>
  k === "alert" ? "⚠️" : k === "action" ? "⚡" : k === "score" ? "📊" : "📝";

/* ───────────── status tracker (V2) ───────────── */
type TrackerEntry = {
  clientName: string; alertDate: string; daysElapsed: number; alertType: string;
  mrr: number; outcome: "active_recovered" | "active_stable" | "churned" | "in_progress";
  scoreChange: number; amAction: string;
};

const STATUS_TRACKER: TrackerEntry[] = [
  { clientName: "Aqua Dental Studio", alertDate: "Feb 14, 2026", daysElapsed: 60, alertType: "Critical Drop", mrr: 497, outcome: "active_recovered", scoreChange: +28, amAction: "Re-engagement campaign sent" },
  { clientName: "Bright Smile Orthodontics", alertDate: "Feb 20, 2026", daysElapsed: 54, alertType: "Critical Drop", mrr: 297, outcome: "in_progress", scoreChange: +3, amAction: "AI Text-Back enabled" },
  { clientName: "Peak Performance Gym", alertDate: "Feb 25, 2026", daysElapsed: 49, alertType: "Churn Risk", mrr: 497, outcome: "in_progress", scoreChange: -2, amAction: "Workflow automation setup" },
  { clientName: "Maple Leaf Dental", alertDate: "Jan 10, 2026", daysElapsed: 95, alertType: "Critical Drop", mrr: 297, outcome: "churned", scoreChange: -15, amAction: "No action taken" },
  { clientName: "Summit Legal Group", alertDate: "Feb 08, 2026", daysElapsed: 66, alertType: "Churn Risk", mrr: 497, outcome: "active_stable", scoreChange: +12, amAction: "Review request campaign launched" },
  { clientName: "Riverside Auto Repair", alertDate: "Jan 22, 2026", daysElapsed: 83, alertType: "Critical Drop", mrr: 297, outcome: "churned", scoreChange: -22, amAction: "AM contacted but declined help" },
  { clientName: "Coastal Insurance Co", alertDate: "Feb 02, 2026", daysElapsed: 72, alertType: "Churn Risk", mrr: 497, outcome: "active_recovered", scoreChange: +19, amAction: "Pipeline reactivation done" },
  { clientName: "Green Valley Landscaping", alertDate: "Feb 12, 2026", daysElapsed: 62, alertType: "Churn Risk", mrr: 297, outcome: "active_stable", scoreChange: +8, amAction: "Upsell to Pro plan" },
];

const outcomeStyle = (o: string) => {
  switch (o) {
    case "active_recovered": return { label: "Recovered", bg: "bg-emerald-100 text-emerald-700", icon: "✓" };
    case "active_stable": return { label: "Stable", bg: "bg-blue-100 text-blue-700", icon: "~" };
    case "churned": return { label: "Churned", bg: "bg-red-100 text-red-700", icon: "✕" };
    case "in_progress": return { label: "In Progress", bg: "bg-amber-100 text-amber-700", icon: "⟳" };
    default: return { label: "Unknown", bg: "bg-slate-100 text-slate-600", icon: "?" };
  }
};

/* ───────────── micro-components ───────────── */
function Sparkline({ data, color = "#3b82f6", w = 80, h = 28 }: { data: number[]; color?: string; w?: number; h?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="text-2xl font-bold" fill={color}>
        {score}
      </text>
    </svg>
  );
}

function DomainBar({ label, score, weight }: Domain) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{score}/100 <span className="text-xs text-slate-400">({(weight * 100).toFixed(0)}% wt)</span></span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function PortfolioTrend({ data, w = 320, h = 80 }: { data: number[]; w?: number; h?: number }) {
  const min = Math.min(...data) - 2;
  const max = Math.max(...data) + 2;
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} className="shrink-0">
      <defs>
        <linearGradient id="pt-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#pt-grad)" points={area} />
      <polyline fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

/* ───────────── AI co-pilot engine (V2) ───────────── */
type ChatMessage = { role: "user" | "assistant"; text: string };

const SUGGESTED_QUERIES = [
  "Which clients need attention this week?",
  "Why is Aqua Dental's score dropping?",
  "Show me clients with pipeline problems",
  "What's the biggest revenue risk right now?",
  "Compare Bright Smile vs Peak Performance",
  "Which clients improved this month?",
  "Forecast: who's most likely to churn?",
];

function generateCopilotResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes("forecast") || q.includes("most likely to churn") || q.includes("churn risk")) {
    const ranked = [...CLIENTS].sort((a, b) => b.churnProbability - a.churnProbability).slice(0, 5);
    let resp = `🔮 **30-Day Churn Forecast (top 5):**\n\n`;
    ranked.forEach((c, i) => {
      resp += `${i + 1}. **${c.name}** — ${c.churnProbability}% churn probability ($${c.mrr}/mo)\n`;
      resp += `   Score: ${c.score}/100 · Industry benchmark: ${INDUSTRY_BENCHMARK[c.industry] ?? "n/a"} · AM: ${c.accountManager}\n`;
    });
    const totalRisk = ranked.filter(c => c.churnProbability >= 30).reduce((s, c) => s + c.mrr, 0);
    resp += `\n💰 **Forecasted MRR at risk (>=30% probability): $${totalRisk.toLocaleString()}/mo.**`;
    return resp;
  }

  if (q.includes("need attention") || q.includes("priority") || q.includes("this week") || q.includes("who should i focus")) {
    const critical = CLIENTS.filter((c) => c.status === "critical").sort((a, b) => a.score - b.score);
    const atRisk = CLIENTS.filter((c) => c.status === "at_risk").sort((a, b) => a.score - b.score);
    let resp = `📋 **This week's priority list (ranked by severity):**\n\n`;
    resp += `🔴 **Critical — act immediately:**\n`;
    critical.forEach((c, i) => {
      const worstDomain = c.domains.reduce((a, b) => a.score < b.score ? a : b);
      resp += `${i + 1}. **${c.name}** — Score: ${c.score}/100 · Churn: ${c.churnProbability}% ($${c.mrr}/mo)\n`;
      resp += `   Root cause: ${worstDomain.label} domain at ${worstDomain.score}/100\n`;
      if (c.alerts[0]) resp += `   Alert: ${c.alerts[0].message}\n`;
      resp += `\n`;
    });
    resp += `🟡 **At Risk — monitor closely:**\n`;
    atRisk.forEach((c, i) => {
      const worstDomain = c.domains.reduce((a, b) => a.score < b.score ? a : b);
      resp += `${i + 1}. **${c.name}** — Score: ${c.score}/100 · Churn: ${c.churnProbability}% ($${c.mrr}/mo)\n`;
      resp += `   Weakest area: ${worstDomain.label} at ${worstDomain.score}/100\n\n`;
    });
    const totalMrr = [...critical, ...atRisk].reduce((s, c) => s + c.mrr, 0);
    resp += `💰 **Total MRR at risk: $${totalMrr.toLocaleString()}/mo across ${critical.length + atRisk.length} accounts.**\n\n`;
    resp += `I'd start with ${critical[0]?.name} — lowest score and highest revenue impact.`;
    return resp;
  }

  const clientMatch = CLIENTS.find((c) => q.includes(c.name.toLowerCase().split(" ")[0].toLowerCase()));
  if (clientMatch && (q.includes("why") || q.includes("dropping") || q.includes("score") || q.includes("tell me about") || q.includes("what's wrong"))) {
    const trendDelta = clientMatch.trend[clientMatch.trend.length - 1] - clientMatch.trend[0];
    const sorted = [...clientMatch.domains].sort((a, b) => a.score - b.score);
    const benchmark = INDUSTRY_BENCHMARK[clientMatch.industry];
    let resp = `🔍 **${clientMatch.name} — Deep Dive**\n\n`;
    resp += `**Current Score: ${clientMatch.score}/100** (${statusLabel(clientMatch.status)})\n`;
    resp += `**Industry:** ${clientMatch.industry} · **Benchmark:** ${benchmark}/100 · **AM:** ${clientMatch.accountManager}\n`;
    resp += `**7-Day Trend:** ${trendDelta > 0 ? "↑" : "↓"} ${Math.abs(trendDelta)} points\n`;
    resp += `**Churn Probability:** ${clientMatch.churnProbability}% · **MRR:** $${clientMatch.mrr}/mo\n\n`;
    resp += `**Domain Breakdown:**\n`;
    clientMatch.domains.forEach((d) => {
      const bar = d.score >= 70 ? "🟢" : d.score >= 50 ? "🟡" : "🔴";
      resp += `${bar} ${d.label}: ${d.score}/100 (${(d.weight * 100).toFixed(0)}% weight)\n`;
    });
    resp += `\n**Root Cause Analysis:**\n`;
    resp += `The primary drag is **${sorted[0].label}** at ${sorted[0].score}/100.`;
    if (sorted[1].score < 50) resp += ` **${sorted[1].label}** is also concerning at ${sorted[1].score}/100.`;
    if (benchmark && clientMatch.score < benchmark) resp += ` Account is **${benchmark - clientMatch.score} pts below** the ${clientMatch.industry} benchmark of ${benchmark}.`;
    resp += `\n\n`;
    if (clientMatch.alerts.length > 0) {
      resp += `**Active Alerts:**\n`;
      clientMatch.alerts.forEach((a) => resp += `⚠️ ${a.message} (${a.ts})\n`);
      resp += `\n`;
    }
    if (clientMatch.recommendations.length > 0) {
      resp += `**Recommended Actions:**\n`;
      clientMatch.recommendations.forEach((r, i) => resp += `${i + 1}. ${r.text}\n`);
    }
    return resp;
  }

  if (q.includes("pipeline")) {
    const pipelineIssues = CLIENTS.filter((c) => {
      const pipeline = c.domains.find((d) => d.label === "Pipeline");
      return pipeline && pipeline.score < 60;
    }).sort((a, b) => {
      const aP = a.domains.find((d) => d.label === "Pipeline")!.score;
      const bP = b.domains.find((d) => d.label === "Pipeline")!.score;
      return aP - bP;
    });
    let resp = `🔍 **Clients with Pipeline Problems** (score <60):\n\n`;
    pipelineIssues.forEach((c, i) => {
      const ps = c.domains.find((d) => d.label === "Pipeline")!.score;
      resp += `${i + 1}. **${c.name}** — Pipeline: ${ps}/100, Overall: ${c.score}/100 ($${c.mrr}/mo)\n`;
    });
    resp += `\n${pipelineIssues.length} clients have weak pipelines. Common pattern: leads added but not contacted within 48 hours. A lead follow-up workflow automation would address this across all accounts.`;
    return resp;
  }

  if (q.includes("revenue") || q.includes("mrr") || q.includes("money")) {
    const atRiskClients = CLIENTS.filter((c) => c.status === "critical" || c.status === "at_risk").sort((a, b) => b.mrr - a.mrr);
    const totalRisk = atRiskClients.reduce((s, c) => s + c.mrr, 0);
    let resp = `💰 **Revenue Risk Assessment:**\n\n`;
    resp += `**Total MRR at risk: $${totalRisk.toLocaleString()}/mo** across ${atRiskClients.length} accounts.\n\n`;
    resp += `Ranked by revenue impact:\n`;
    atRiskClients.forEach((c, i) => {
      resp += `${i + 1}. **${c.name}** — $${c.mrr}/mo (Score: ${c.score}, ${statusLabel(c.status)}, ${c.churnProbability}% churn)\n`;
    });
    resp += `\nIf we lose all critical accounts, that's $${CLIENTS.filter((c) => c.status === "critical").reduce((s, c) => s + c.mrr, 0).toLocaleString()}/mo in immediate revenue loss. The highest-leverage save is ${atRiskClients[0]?.name} at $${atRiskClients[0]?.mrr}/mo.`;
    return resp;
  }

  if (q.includes("compare") || q.includes(" vs ")) {
    const matched = CLIENTS.filter((c) => q.includes(c.name.toLowerCase().split(" ")[0].toLowerCase()));
    if (matched.length >= 2) {
      const [a, b] = matched;
      let resp = `⚖️ **${a.name} vs ${b.name}:**\n\n`;
      resp += `| Metric | ${a.name.split(" ")[0]} | ${b.name.split(" ")[0]} |\n`;
      resp += `|--------|---------|----------|\n`;
      resp += `| Overall Score | ${a.score} | ${b.score} |\n`;
      resp += `| Status | ${statusLabel(a.status)} | ${statusLabel(b.status)} |\n`;
      resp += `| Churn % | ${a.churnProbability}% | ${b.churnProbability}% |\n`;
      resp += `| MRR | $${a.mrr} | $${b.mrr} |\n`;
      a.domains.forEach((d, i) => {
        resp += `| ${d.label} | ${d.score} | ${b.domains[i].score} |\n`;
      });
      resp += `\n`;
      const aBetter = a.score > b.score;
      resp += `**${aBetter ? a.name : b.name}** is healthier overall. The gap is widest in `;
      let maxGap = 0, gapDomain = "";
      a.domains.forEach((d, i) => {
        const gap = Math.abs(d.score - b.domains[i].score);
        if (gap > maxGap) { maxGap = gap; gapDomain = d.label; }
      });
      resp += `**${gapDomain}** (${maxGap} point difference).`;
      return resp;
    }
    return `I can compare any two clients. Try: "Compare Aqua Dental vs Bright Smile" or name any two sub-accounts.`;
  }

  if (q.includes("improv") || q.includes("getting better") || q.includes("positive")) {
    const improving = CLIENTS.filter((c) => c.trend[c.trend.length - 1] >= c.trend[c.trend.length - 2]).sort((a, b) => {
      const aD = a.trend[a.trend.length - 1] - a.trend[0];
      const bD = b.trend[b.trend.length - 1] - b.trend[0];
      return bD - aD;
    });
    let resp = `📈 **Clients Trending Up:**\n\n`;
    if (improving.length === 0) {
      resp += `No clients show an upward trend this week. This is a signal to review intervention effectiveness across the portfolio.`;
    } else {
      improving.forEach((c, i) => {
        const delta = c.trend[c.trend.length - 1] - c.trend[0];
        resp += `${i + 1}. **${c.name}** — Score: ${c.score} (↑${delta > 0 ? "+" : ""}${delta} over 7 days)\n`;
      });
      resp += `\n${improving.length} clients are heading in the right direction. ${improving[0].name} shows the strongest recovery.`;
    }
    return resp;
  }

  return `I can help you with:\n\n• **"Which clients need attention this week?"** — ranked priority list\n• **"Forecast: who's most likely to churn?"** — 30-day churn predictions\n• **"Why is [client name]'s score dropping?"** — root cause breakdown\n• **"Show me clients with pipeline problems"** — domain-specific filter\n• **"What's the biggest revenue risk?"** — MRR impact analysis\n• **"Compare [client A] vs [client B]"** — side-by-side\n• **"Which clients improved this month?"** — positive trends\n\nTry any of the above, or ask about a specific client by name!`;
}

/* ───────────── notification feed (V2) ───────────── */
type Notification = { id: string; ts: string; severity: "high" | "med" | "low"; text: string; read: boolean };
const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: "n1", ts: "2h ago", severity: "high", text: "Aqua Dental Studio dropped 18 pts in 14 days", read: false },
  { id: "n2", ts: "6h ago", severity: "high", text: "Bright Smile Orthodontics — Conversations -15 pts in 7d", read: false },
  { id: "n3", ts: "12h ago", severity: "med", text: "Peak Performance Gym — campaign engagement <20%", read: false },
  { id: "n4", ts: "1d ago", severity: "low", text: "Summit Legal Group — review momentum building (opportunity)", read: true },
];

/* ───────────── main app ───────────── */
export default function App() {
  const [version, setVersion] = useState<"v1" | "v2">("v2");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "critical" | "at_risk" | "healthy">("all");
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "👋 Hi! I'm your PulseIQ Co-pilot. I monitor all your sub-accounts 24/7.\n\nAsk me anything — which clients need attention, why a score is dropping, what to do next, or who's most likely to churn." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [digestOpen, setDigestOpen] = useState(false);
  const [bulkBanner, setBulkBanner] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const isV2 = version === "v2";

  const filtered = useMemo(() => {
    let list = CLIENTS as Client[];
    if (filter !== "all") list = list.filter((c) => c.status === filter);
    if (search.trim()) list = list.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry.toLowerCase().includes(search.toLowerCase()) ||
      c.accountManager.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [filter, search]);

  const selected = CLIENTS.find((c) => c.id === selectedId) ?? null;

  const counts = useMemo(() => ({
    total: CLIENTS.length,
    critical: CLIENTS.filter((c) => c.status === "critical").length,
    at_risk: CLIENTS.filter((c) => c.status === "at_risk").length,
    healthy: CLIENTS.filter((c) => c.status === "healthy").length,
    revenueAtRisk: CLIENTS.filter((c) => c.status === "critical" || c.status === "at_risk").reduce((s, c) => s + c.mrr, 0),
    avgScore: Math.round(CLIENTS.reduce((s, c) => s + c.score, 0) / CLIENTS.length),
  }), []);

  const portfolioTrend = useMemo(() => {
    const days = CLIENTS[0].trend.length;
    return Array.from({ length: days }, (_, i) =>
      Math.round(CLIENTS.reduce((s, c) => s + c.trend[i], 0) / CLIENTS.length)
    );
  }, []);

  const topChurnRisk = useMemo(
    () => [...CLIENTS].sort((a, b) => b.churnProbability - a.churnProbability).slice(0, 3),
    []
  );

  const trendColor = (t: number[]) => {
    const last = t[t.length - 1];
    const prev = t[t.length - 2];
    return last >= prev ? "#22c55e" : "#ef4444";
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })));

  const sendChat = (text: string) => {
    setChatMessages((prev) => [...prev, { role: "user", text }]);
    setIsTyping(true);
    setTimeout(() => {
      const response = generateCopilotResponse(text);
      setChatMessages((prev) => [...prev, { role: "assistant", text: response }]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ─── sidebar ─── */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white text-base shadow-sm">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 12 7 12 10 5 14 19 17 12 21 12" /></svg>
            </div>
            <div>
              <span className="font-bold text-slate-800 text-base tracking-tight">PulseIQ</span>
              <p className="text-[10px] text-slate-400 -mt-0.5">Client Health Intelligence</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium text-left">
            <span>📊</span> Dashboard
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 text-left">
            <span>👥</span> Sub-Accounts
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 text-left">
            <span>🔔</span> Alerts
            {counts.critical > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{counts.critical}</span>
            )}
          </button>
          {isV2 && (
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 text-left">
              <span>⚡</span> Actions
            </button>
          )}
          {isV2 && (
            <button onClick={() => setDigestOpen(true)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 text-left">
              <span>📰</span> Weekly Digest
              <span className="ml-auto text-[9px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">NEW</span>
            </button>
          )}
          {isV2 && (
            <button onClick={() => setCopilotOpen(!copilotOpen)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${copilotOpen ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}>
              <span>🤖</span> AI Co-pilot
              <span className="ml-auto text-[9px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">NEW</span>
            </button>
          )}
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 text-left">
            <span>⚙️</span> Settings
          </button>
        </nav>

        {/* version toggle */}
        <div className="px-4 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Version</p>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setVersion("v1")}
              className={`flex-1 text-xs py-1.5 rounded-md font-medium ${version === "v1" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
            >
              V1 — MVP
            </button>
            <button
              onClick={() => setVersion("v2")}
              className={`flex-1 text-xs py-1.5 rounded-md font-medium ${version === "v2" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
            >
              V2 — Pro
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 leading-tight">
            {isV2 ? "Co-pilot, churn forecast, benchmarks, digest, bulk actions" : "Scores, widget, badges, feedback"}
          </p>
        </div>
      </aside>

      {/* ─── main content ─── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* top bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 shrink-0 justify-between">
          <h1 className="text-lg font-semibold text-slate-800">Client Health Dashboard</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, industry, AM..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
              <span className="absolute left-2.5 top-2 text-slate-400 text-sm">🔍</span>
            </div>
            {isV2 && (
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center"
                  title="Notifications"
                >
                  <span className="text-base">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 top-11 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-40">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <p className="font-semibold text-sm text-slate-700">Notifications</p>
                      <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 ${!n.read ? "bg-blue-50/30" : ""}`}>
                          <div className="flex gap-2 items-start">
                            <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${n.severity === "high" ? "bg-red-500" : n.severity === "med" ? "bg-amber-500" : "bg-blue-500"}`} />
                            <div className="flex-1">
                              <p className="text-xs text-slate-700 leading-snug">{n.text}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{n.ts}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                      <p className="text-[10px] text-slate-500">Routes to: <span className="font-medium">Slack #cs-alerts</span> · <span className="font-medium">am@team.io</span></p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${isV2 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
              {isV2 ? "V2 — Pro Suite" : "V1 — MVP"}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {/* stat cards */}
          <div className={`grid ${isV2 ? "grid-cols-5" : "grid-cols-4"} gap-4 mb-6`}>
            <button onClick={() => setFilter("all")} className={`rounded-xl border p-4 text-left ${filter === "all" ? "ring-2 ring-blue-500 border-blue-200 bg-blue-50" : "bg-white border-slate-200 hover:shadow-sm"}`}>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Accounts</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{counts.total}</p>
            </button>
            <button onClick={() => setFilter("critical")} className={`rounded-xl border p-4 text-left ${filter === "critical" ? "ring-2 ring-red-500 border-red-200 bg-red-50" : "bg-white border-slate-200 hover:shadow-sm"}`}>
              <p className="text-xs text-red-500 font-medium uppercase tracking-wide">Critical</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{counts.critical}</p>
              <p className="text-xs text-slate-400 mt-1">Score &lt; 50</p>
            </button>
            <button onClick={() => setFilter("at_risk")} className={`rounded-xl border p-4 text-left ${filter === "at_risk" ? "ring-2 ring-amber-500 border-amber-200 bg-amber-50" : "bg-white border-slate-200 hover:shadow-sm"}`}>
              <p className="text-xs text-amber-500 font-medium uppercase tracking-wide">At Risk</p>
              <p className="text-3xl font-bold text-amber-500 mt-1">{counts.at_risk}</p>
              <p className="text-xs text-slate-400 mt-1">Score 50–69</p>
            </button>
            <button onClick={() => setFilter("healthy")} className={`rounded-xl border p-4 text-left ${filter === "healthy" ? "ring-2 ring-emerald-500 border-emerald-200 bg-emerald-50" : "bg-white border-slate-200 hover:shadow-sm"}`}>
              <p className="text-xs text-emerald-500 font-medium uppercase tracking-wide">Healthy</p>
              <p className="text-3xl font-bold text-emerald-500 mt-1">{counts.healthy}</p>
              <p className="text-xs text-slate-400 mt-1">Score 70+</p>
            </button>
            {isV2 && (
              <div className="rounded-xl border bg-white border-slate-200 p-4 text-left">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Portfolio Avg</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{counts.avgScore}</p>
                <p className="text-xs text-slate-400 mt-1">7-day rolling</p>
              </div>
            )}
          </div>

          {/* V2 Portfolio Trend + Churn Forecast */}
          {isV2 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                      📈 Portfolio Health Trend
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">V2</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Average health across all sub-accounts (last 7 days)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-800">{portfolioTrend[portfolioTrend.length - 1]}</p>
                    <p className={`text-xs font-medium ${portfolioTrend[portfolioTrend.length - 1] >= portfolioTrend[0] ? "text-emerald-600" : "text-red-600"}`}>
                      {portfolioTrend[portfolioTrend.length - 1] - portfolioTrend[0] >= 0 ? "+" : ""}
                      {portfolioTrend[portfolioTrend.length - 1] - portfolioTrend[0]} pts vs. 7d ago
                    </p>
                  </div>
                </div>
                <PortfolioTrend data={portfolioTrend} w={520} h={90} />
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 mb-3">
                  🔮 Churn Forecast
                  <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">V2</span>
                </h2>
                <p className="text-[10px] text-slate-400 mb-3">Top 3 highest churn probability (next 30 days)</p>
                <div className="space-y-3">
                  {topChurnRisk.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700 truncate">{c.name}</span>
                        <span className={`font-bold ${churnColor(c.churnProbability)}`}>{c.churnProbability}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${churnBg(c.churnProbability)}`} style={{ width: `${c.churnProbability}%` }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* revenue at risk banner */}
          {counts.revenueAtRisk > 0 && (
            <div className="mb-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 text-white flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Monthly Revenue at Risk</p>
                <p className="text-2xl font-bold">${counts.revenueAtRisk.toLocaleString()}/mo</p>
                <p className="text-xs opacity-75 mt-0.5">{counts.critical + counts.at_risk} accounts need attention</p>
              </div>
              {isV2 && (
                <button onClick={() => setDigestOpen(true)} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
                  View Action Plan →
                </button>
              )}
            </div>
          )}

          {/* V2 Bulk action banner — visible only when filter is "critical" */}
          {isV2 && filter === "critical" && bulkBanner && filtered.length > 0 && (
            <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚡</span>
                <div>
                  <p className="text-sm font-medium text-indigo-800">{filtered.length} critical accounts selected</p>
                  <p className="text-xs text-indigo-600">Run a coordinated intervention across all of them in one click.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 font-medium">
                  Send re-engagement campaign
                </button>
                <button className="text-xs bg-white border border-indigo-300 text-indigo-700 px-3 py-1.5 rounded-md hover:bg-indigo-100 font-medium">
                  Assign to AM
                </button>
                <button onClick={() => setBulkBanner(false)} className="text-indigo-400 hover:text-indigo-600 text-sm ml-1">✕</button>
              </div>
            </div>
          )}

          {/* ─── V2: Client Status Tracker (60-day post-alert outcomes) ─── */}
          {isV2 && (() => {
            const completed = STATUS_TRACKER.filter((e) => e.daysElapsed >= 60);
            const recovered = completed.filter((e) => e.outcome === "active_recovered").length;
            const stable = completed.filter((e) => e.outcome === "active_stable").length;
            const churned = completed.filter((e) => e.outcome === "churned").length;
            const inProgress = STATUS_TRACKER.filter((e) => e.outcome === "in_progress").length;
            const totalCompleted = completed.length;
            const saveRate = totalCompleted > 0 ? Math.round(((recovered + stable) / totalCompleted) * 100) : 0;
            const mrrSaved = completed.filter((e) => e.outcome !== "churned").reduce((s, e) => s + e.mrr, 0);
            const mrrLost = completed.filter((e) => e.outcome === "churned").reduce((s, e) => s + e.mrr, 0);
            const saveTarget = 75;

            return (
              <div className="mb-6 bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                      📋 Client Status Tracker
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">V2</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Outcomes of PulseIQ-alerted clients at 60 days post-alert. Validates whether early warnings prevented churn.</p>
                  </div>
                </div>

                {/* Save Rate goal tracker */}
                <div className="mb-5 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-600">Save Rate vs. Goal</p>
                    <p className="text-xs text-slate-500">Target: <span className="font-bold text-slate-700">{saveTarget}%</span></p>
                  </div>
                  <div className="relative h-3 bg-white rounded-full border border-slate-200 overflow-hidden">
                    <div className="absolute inset-y-0 bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: `${saveRate}%` }} />
                    <div className="absolute inset-y-0 border-l-2 border-slate-700" style={{ left: `${saveTarget}%` }} title={`Goal: ${saveTarget}%`} />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    Currently at <span className="font-bold text-slate-700">{saveRate}%</span> — {saveRate >= saveTarget ? `🎯 ${saveRate - saveTarget}pp above target` : `${saveTarget - saveRate}pp below target`}
                  </p>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-5 gap-3 mb-5">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-[10px] text-emerald-600 uppercase font-medium tracking-wide">Save Rate</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">{saveRate}%</p>
                    <p className="text-[10px] text-emerald-500 mt-0.5">of alerted clients retained</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[10px] text-emerald-600 uppercase font-medium tracking-wide">Recovered</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{recovered}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">score ↑ post-alert</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[10px] text-blue-600 uppercase font-medium tracking-wide">Stable</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{stable}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">score held steady</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-[10px] text-red-600 uppercase font-medium tracking-wide">Churned</p>
                    <p className="text-2xl font-bold text-red-700 mt-1">{churned}</p>
                    <p className="text-[10px] text-red-500 mt-0.5">cancelled / lost</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-[10px] text-amber-600 uppercase font-medium tracking-wide">In Progress</p>
                    <p className="text-2xl font-bold text-amber-700 mt-1">{inProgress}</p>
                    <p className="text-[10px] text-amber-500 mt-0.5">&lt; 60 days elapsed</p>
                  </div>
                </div>

                {/* MRR saved vs lost banner */}
                <div className="flex gap-3 mb-4">
                  <div className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-90">MRR Saved</p>
                      <p className="text-xl font-bold">${mrrSaved.toLocaleString()}/mo</p>
                    </div>
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-90">MRR Lost to Churn</p>
                      <p className="text-xl font-bold">${mrrLost.toLocaleString()}/mo</p>
                    </div>
                    <span className="text-2xl">📉</span>
                  </div>
                </div>

                {/* Tracker table */}
                <div className="overflow-hidden border border-slate-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium">Client</th>
                        <th className="text-left py-2 px-3 font-medium">Alert Date</th>
                        <th className="text-left py-2 px-3 font-medium">Days</th>
                        <th className="text-left py-2 px-3 font-medium">Alert Type</th>
                        <th className="text-left py-2 px-3 font-medium">AM Action</th>
                        <th className="text-left py-2 px-3 font-medium">Δ Score</th>
                        <th className="text-left py-2 px-3 font-medium">MRR</th>
                        <th className="text-left py-2 px-3 font-medium">Outcome</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STATUS_TRACKER.map((e, i) => {
                        const out = outcomeStyle(e.outcome);
                        const scoreColor = e.scoreChange > 0 ? "text-emerald-600" : e.scoreChange < 0 ? "text-red-600" : "text-slate-500";
                        return (
                          <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-medium text-slate-700">{e.clientName}</td>
                            <td className="py-2.5 px-3 text-slate-500">{e.alertDate}</td>
                            <td className="py-2.5 px-3 text-slate-500">{e.daysElapsed}d</td>
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{e.alertType}</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 text-xs max-w-[180px] truncate" title={e.amAction}>{e.amAction}</td>
                            <td className={`py-2.5 px-3 font-semibold ${scoreColor}`}>
                              {e.scoreChange > 0 ? "+" : ""}{e.scoreChange}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">${e.mrr}</td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${out.bg}`}>
                                <span>{out.icon}</span> {out.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
                  <strong>How to read this:</strong> Every time PulseIQ flags a client as Critical or Churn Risk, we track whether that client is still active 60 days later. Save Rate = (Recovered + Stable) / Total Completed. This is the ultimate validation that early warnings actually prevent churn.
                </p>
              </div>
            );
          })()}

          {/* account list + detail panel */}
          <div className="flex gap-6">
            {/* list */}
            <div className={`${selected ? "w-1/2" : "w-full"}`} style={{ transition: "width 0.2s ease" }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  Sub-Accounts {filter !== "all" && `(${statusLabel(filter)})`}
                </h2>
                <span className="text-xs text-slate-400">{filtered.length} accounts</span>
              </div>

              <div className="space-y-2">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                    className={`w-full text-left rounded-xl border p-4 hover:shadow-md ${
                      selectedId === c.id ? "ring-2 ring-blue-500 border-blue-200 bg-white" : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* inline badge */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        c.status === "critical" ? "bg-red-100 text-red-600" :
                        c.status === "at_risk" ? "bg-amber-100 text-amber-600" :
                        "bg-emerald-100 text-emerald-600"
                      }`}>
                        {c.score}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-800 text-sm truncate">{c.name}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBg(c.status)} border`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDot(c.status)}`} />
                            {statusLabel(c.status)}
                          </span>
                          {isV2 && c.churnProbability >= 30 && (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 ${churnColor(c.churnProbability)}`}>
                              🔮 {c.churnProbability}% churn
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {c.industry} · ${c.mrr}/mo
                          {isV2 && <> · AM: {c.accountManager}</>}
                          · Last active: {c.lastActivity}
                        </p>
                      </div>

                      <Sparkline data={c.trend} color={trendColor(c.trend)} />

                      {c.alerts.length > 0 && (
                        <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                          {c.alerts.length} alert{c.alerts.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* V1 feedback row */}
                    {feedback[c.id] ? (
                      <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-400">
                        Feedback recorded: <span className="font-medium text-slate-600">{feedback[c.id]}</span>
                      </div>
                    ) : (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setFeedback({ ...feedback, [c.id]: "Resolved" }); }}
                          className="text-xs px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium"
                        >
                          ✓ Resolved
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setFeedback({ ...feedback, [c.id]: "Not Useful" }); }}
                          className="text-xs px-3 py-1 rounded-md bg-slate-50 text-slate-500 hover:bg-slate-100 font-medium"
                        >
                          ✕ Not Useful
                        </button>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* detail panel */}
            {selected && (
              <div className="w-1/2 bg-white rounded-xl border border-slate-200 p-6 overflow-y-auto max-h-[calc(100vh-220px)] sticky top-0">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{selected.name}</h2>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {selected.industry} · ${selected.mrr}/mo · Last active: {selected.lastActivity}
                    </p>
                    {isV2 && (
                      <p className="text-xs text-slate-500 mt-1">Account Manager: <span className="font-medium text-slate-700">{selected.accountManager}</span></p>
                    )}
                  </div>
                  <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                </div>

                {/* score ring + status */}
                <div className="flex items-center gap-6 mb-6">
                  <ScoreRing score={selected.score} />
                  <div className="flex-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusBg(selected.status)} border`}>
                      <span className={`w-2 h-2 rounded-full ${statusDot(selected.status)}`} />
                      {statusLabel(selected.status)}
                    </span>
                    <p className="text-xs text-slate-400 mt-2">7-day trend</p>
                    <Sparkline data={selected.trend} color={trendColor(selected.trend)} w={100} h={32} />
                  </div>
                </div>

                {/* V2: churn forecast + benchmark */}
                {isV2 && (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 uppercase font-medium tracking-wide">Churn Forecast (30d)</p>
                      <p className={`text-2xl font-bold mt-1 ${churnColor(selected.churnProbability)}`}>{selected.churnProbability}%</p>
                      <div className="h-1.5 bg-white border border-slate-200 rounded-full overflow-hidden mt-2">
                        <div className={`h-full ${churnBg(selected.churnProbability)}`} style={{ width: `${selected.churnProbability}%` }} />
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 uppercase font-medium tracking-wide">Industry Benchmark</p>
                      <p className="text-2xl font-bold mt-1 text-slate-800">{INDUSTRY_BENCHMARK[selected.industry] ?? "—"}</p>
                      <p className={`text-[11px] mt-1 font-medium ${selected.score >= (INDUSTRY_BENCHMARK[selected.industry] ?? 0) ? "text-emerald-600" : "text-red-600"}`}>
                        {selected.score - (INDUSTRY_BENCHMARK[selected.industry] ?? 0) >= 0 ? "+" : ""}
                        {selected.score - (INDUSTRY_BENCHMARK[selected.industry] ?? 0)} vs. {selected.industry}
                      </p>
                    </div>
                  </div>
                )}

                {/* domain breakdown */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Domain Breakdown</h3>
                  {selected.domains.map((d) => (
                    <DomainBar key={d.label} {...d} />
                  ))}
                </div>

                {/* alerts */}
                {selected.alerts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Alerts</h3>
                    <div className="space-y-2">
                      {selected.alerts.map((a) => (
                        <div key={a.id} className={`p-3 rounded-lg border text-sm ${
                          a.type === "critical_drop" ? "bg-red-50 border-red-200 text-red-700" :
                          a.type === "churn_risk" ? "bg-amber-50 border-amber-200 text-amber-700" :
                          "bg-blue-50 border-blue-200 text-blue-700"
                        }`}>
                          <div className="flex justify-between">
                            <span>{a.message}</span>
                            <span className="text-xs opacity-60 ml-2 shrink-0">{a.ts}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Recommendations — V2 only */}
                {isV2 && selected.recommendations.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                      AI Recommendations <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">V2</span>
                    </h3>
                    <div className="space-y-2">
                      {selected.recommendations.map((rec) => (
                        <div key={rec.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                          <div className="flex items-start gap-2">
                            <span className="text-base mt-0.5">💡</span>
                            <div className="flex-1">
                              <p className="text-sm text-slate-700">{rec.text}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${impactBadge(rec.impact)}`}>
                                  {rec.impact.toUpperCase()} IMPACT
                                </span>
                                {rec.action && (
                                  <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 font-medium">
                                    {rec.action}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* V2 Activity Timeline */}
                {isV2 && selected.activity.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                      Activity Timeline <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">V2</span>
                    </h3>
                    <ol className="relative border-l-2 border-slate-200 ml-2 space-y-3 pl-4">
                      {selected.activity.map((ev) => (
                        <li key={ev.id} className="relative">
                          <span className="absolute -left-[22px] top-1 w-4 h-4 bg-white border-2 border-slate-300 rounded-full flex items-center justify-center text-[10px]">
                            {activityIcon(ev.kind)}
                          </span>
                          <p className="text-sm text-slate-700 leading-snug">{ev.text}</p>
                          <p className="text-[10px] text-slate-400">{ev.ts}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* V2 AI Summary */}
                {isV2 && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      🤖 AI Health Summary <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">V2</span>
                    </h3>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      {selected.score < 50
                        ? `${selected.name} is in critical condition with a ${selected.churnProbability}% 30-day churn probability. The primary issue is declining pipeline activity — no new contacts added recently and lead follow-up has stalled. Account is ${(INDUSTRY_BENCHMARK[selected.industry] ?? 0) - selected.score} points below the ${selected.industry} benchmark. Immediate intervention by ${selected.accountManager} required.`
                        : selected.score < 70
                        ? `${selected.name} shows early signs of disengagement. While some activity continues, key metrics are trending downward. Forecasted churn risk: ${selected.churnProbability}%. Focus on improving conversation response rates and campaign engagement to stabilize the account.`
                        : `${selected.name} is performing well across all domains. Pipeline is active, campaigns are engaging, conversation rates are strong. Score sits ${selected.score - (INDUSTRY_BENCHMARK[selected.industry] ?? 0)} points above industry benchmark. Consider this account for upsell or as a reference case study.`
                      }
                    </p>
                  </div>
                )}

                {/* Feature labels */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Visible Features</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Score Computation</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Health Widget</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inline Badges</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Feedback Buttons</span>
                    {isV2 && (
                      <>
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">AI Summaries</span>
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Recommendations</span>
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">One-Click Actions</span>
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Critical Alerts</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Churn Forecast</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Industry Benchmarks</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Activity Timeline</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Bulk Actions</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Weekly Digest</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Notification Center</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ─── V2: Weekly Digest modal ─── */}
      {isV2 && digestOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6" onClick={() => setDigestOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-bold text-slate-800">📰 Weekly Digest</h2>
                <p className="text-xs text-slate-400 mt-0.5">Auto-generated summary · Week of May 1–6, 2026</p>
              </div>
              <button onClick={() => setDigestOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase font-medium">Portfolio Avg</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{counts.avgScore}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-[10px] text-red-500 uppercase font-medium">Critical</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{counts.critical}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-[10px] text-emerald-500 uppercase font-medium">MRR at risk</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">${counts.revenueAtRisk.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">🔥 Top 3 to focus on this week</h3>
                <ol className="space-y-2">
                  {topChurnRisk.map((c, i) => (
                    <li key={c.id} className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                      <span className="font-bold text-slate-800">{i + 1}. {c.name}</span> ({c.industry}, ${c.mrr}/mo) — score {c.score}, churn {c.churnProbability}%. <span className="text-slate-500">AM: {c.accountManager}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">📈 Wins this week</h3>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li>• Aqua Dental Studio (recovered): +28 pts after re-engagement campaign</li>
                  <li>• Coastal Insurance Co (recovered): +19 pts after pipeline reactivation</li>
                  <li>• Summit Legal Group (stable): +12 pts review momentum</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">⚠️ Watch list</h3>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li>• Bright Smile Orthodontics — 60d window closes in 6d, currently +3</li>
                  <li>• Peak Performance Gym — 60d window closes in 11d, currently -2</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => window.print()} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                  📄 Export as PDF
                </button>
                <button className="text-sm bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium text-slate-700">
                  📧 Email to team
                </button>
                <button className="text-sm bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium text-slate-700">
                  💬 Post to Slack
                </button>
              </div>
              <p className="text-[10px] text-slate-400">Digest scheduled to send every Monday 8:00 AM in your timezone.</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── V2: AI Co-pilot floating button ─── */}
      {isV2 && !copilotOpen && (
        <button
          onClick={() => setCopilotOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl z-40 hover:scale-105 transition-all"
          title="Open AI Co-pilot"
        >
          🤖
        </button>
      )}

      {/* ─── V2: AI Co-pilot chat panel ─── */}
      {isV2 && copilotOpen && (
        <div className="fixed right-0 top-0 h-screen w-[420px] bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-lg backdrop-blur-sm">🤖</div>
                <div>
                  <h3 className="font-semibold text-sm">PulseIQ Co-pilot</h3>
                  <p className="text-[10px] text-white/70">AI-powered client intelligence assistant</p>
                </div>
              </div>
              <button onClick={() => setCopilotOpen(false)} className="text-white/70 hover:text-white text-lg">✕</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-md"
                    : "bg-slate-100 text-slate-700 rounded-bl-md"
                }`}>
                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>')
                  }} />
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-slate-400">
                  <span className="inline-flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {chatMessages.length <= 2 && (
            <div className="px-4 pb-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUERIES.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => { setChatInput(""); sendChat(sq); }}
                    className="text-[11px] px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-left leading-tight"
                  >
                    {sq}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 py-3 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatInput.trim() || isTyping) return;
                const userMsg = chatInput.trim();
                setChatInput("");
                sendChat(userMsg);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about your clients..."
                className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={isTyping || !chatInput.trim()}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
            <p className="text-[9px] text-slate-400 mt-2 text-center">PulseIQ Co-pilot reads live health data from all your sub-accounts</p>
          </div>
        </div>
      )}
    </div>
  );
}
