import { useState, useMemo } from "react";

/* ───────────── types ───────────── */
type Domain = { label: string; score: number; weight: number };
type Alert = { id: string; type: "critical_drop" | "churn_risk" | "opportunity"; message: string; ts: string };
type Recommendation = { id: string; text: string; impact: "high" | "medium" | "low"; action?: string };
type Client = {
  id: string;
  name: string;
  score: number;
  status: "healthy" | "at_risk" | "critical";
  trend: number[];
  domains: Domain[];
  mrr: number;
  alerts: Alert[];
  recommendations: Recommendation[];
  lastActivity: string;
};

/* ───────────── mock data ───────────── */
const CLIENTS: Client[] = [
  {
    id: "1", name: "Aqua Dental Studio", score: 34, status: "critical",
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
  },
  {
    id: "2", name: "Bright Smile Orthodontics", score: 42, status: "critical",
    trend: [68, 63, 57, 52, 48, 45, 42], mrr: 297, lastActivity: "5 days ago",
    domains: [
      { label: "Pipeline", score: 35, weight: 0.35 },
      { label: "Campaigns", score: 48, weight: 0.25 },
      { label: "Conversations", score: 38, weight: 0.25 },
      { label: "Reviews", score: 55, weight: 0.15 },
    ],
    alerts: [
      { id: "a3", type: "critical_drop", message: "Conversations score dropped 15 pts in 7 days", ts: "6h ago" },
    ],
    recommendations: [
      { id: "r3", text: "Missed call rate is 45%. Set up AI Missed-Call Text-Back to recover leads.", impact: "high", action: "Setup Text-Back" },
      { id: "r4", text: "Campaign open rate is declining. A/B test subject lines with AI Email Writer.", impact: "medium" },
    ],
  },
  {
    id: "3", name: "Peak Performance Gym", score: 48, status: "at_risk",
    trend: [71, 65, 60, 56, 52, 50, 48], mrr: 497, lastActivity: "1 day ago",
    domains: [
      { label: "Pipeline", score: 52, weight: 0.35 },
      { label: "Campaigns", score: 44, weight: 0.25 },
      { label: "Conversations", score: 41, weight: 0.25 },
      { label: "Reviews", score: 58, weight: 0.15 },
    ],
    alerts: [
      { id: "a4", type: "churn_risk", message: "Campaign engagement dropped below 20%", ts: "12h ago" },
    ],
    recommendations: [
      { id: "r5", text: "Activate workflow automations for new lead nurture — currently manual follow-up only.", impact: "high", action: "Create Workflow" },
    ],
  },
  {
    id: "4", name: "Luxe Home Realty", score: 55, status: "at_risk",
    trend: [60, 58, 57, 56, 55, 55, 55], mrr: 297, lastActivity: "Today",
    domains: [
      { label: "Pipeline", score: 58, weight: 0.35 },
      { label: "Campaigns", score: 52, weight: 0.25 },
      { label: "Conversations", score: 50, weight: 0.25 },
      { label: "Reviews", score: 62, weight: 0.15 },
    ],
    alerts: [],
    recommendations: [
      { id: "r6", text: "Pipeline velocity slowing — average deal age increased from 8 to 14 days.", impact: "medium", action: "View Pipeline" },
    ],
  },
  {
    id: "5", name: "Summit Legal Group", score: 61, status: "at_risk",
    trend: [72, 70, 68, 65, 63, 62, 61], mrr: 497, lastActivity: "Today",
    domains: [
      { label: "Pipeline", score: 65, weight: 0.35 },
      { label: "Campaigns", score: 58, weight: 0.25 },
      { label: "Conversations", score: 55, weight: 0.25 },
      { label: "Reviews", score: 70, weight: 0.15 },
    ],
    alerts: [
      { id: "a5", type: "opportunity", message: "Reviews score trending up — good time to request more", ts: "1d ago" },
    ],
    recommendations: [
      { id: "r7", text: "Good review momentum. Launch a review request campaign to capitalize.", impact: "medium", action: "Send Review Request" },
    ],
  },
  {
    id: "6", name: "Green Valley Landscaping", score: 73, status: "healthy",
    trend: [65, 68, 70, 71, 72, 73, 73], mrr: 297, lastActivity: "Today",
    domains: [
      { label: "Pipeline", score: 75, weight: 0.35 },
      { label: "Campaigns", score: 70, weight: 0.25 },
      { label: "Conversations", score: 72, weight: 0.25 },
      { label: "Reviews", score: 76, weight: 0.15 },
    ],
    alerts: [],
    recommendations: [
      { id: "r8", text: "Strong engagement across the board. Consider upselling to Agency Pro plan.", impact: "low" },
    ],
  },
  {
    id: "7", name: "Nova Digital Marketing", score: 81, status: "healthy",
    trend: [74, 76, 77, 78, 79, 80, 81], mrr: 497, lastActivity: "Today",
    domains: [
      { label: "Pipeline", score: 84, weight: 0.35 },
      { label: "Campaigns", score: 78, weight: 0.25 },
      { label: "Conversations", score: 80, weight: 0.25 },
      { label: "Reviews", score: 82, weight: 0.15 },
    ],
    alerts: [],
    recommendations: [
      { id: "r9", text: "Top performer. Feature as a case study for other sub-accounts.", impact: "low" },
    ],
  },
  {
    id: "8", name: "Coastal Fitness Co", score: 87, status: "healthy",
    trend: [80, 82, 83, 84, 85, 86, 87], mrr: 297, lastActivity: "Today",
    domains: [
      { label: "Pipeline", score: 90, weight: 0.35 },
      { label: "Campaigns", score: 85, weight: 0.25 },
      { label: "Conversations", score: 84, weight: 0.25 },
      { label: "Reviews", score: 88, weight: 0.15 },
    ],
    alerts: [],
    recommendations: [],
  },
  {
    id: "9", name: "Elite Auto Detailing", score: 91, status: "healthy",
    trend: [85, 87, 88, 89, 90, 91, 91], mrr: 497, lastActivity: "Today",
    domains: [
      { label: "Pipeline", score: 93, weight: 0.35 },
      { label: "Campaigns", score: 88, weight: 0.25 },
      { label: "Conversations", score: 90, weight: 0.25 },
      { label: "Reviews", score: 94, weight: 0.15 },
    ],
    alerts: [],
    recommendations: [],
  },
  {
    id: "10", name: "Harmony Wellness Spa", score: 95, status: "healthy",
    trend: [88, 90, 91, 92, 93, 94, 95], mrr: 497, lastActivity: "Today",
    domains: [
      { label: "Pipeline", score: 96, weight: 0.35 },
      { label: "Campaigns", score: 94, weight: 0.25 },
      { label: "Conversations", score: 93, weight: 0.25 },
      { label: "Reviews", score: 97, weight: 0.15 },
    ],
    alerts: [],
    recommendations: [],
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

/* ───────────── main app ───────────── */
export default function App() {
  const [version, setVersion] = useState<"v1" | "v2">("v1");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "critical" | "at_risk" | "healthy">("all");
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const isV2 = version === "v2";

  const filtered = useMemo(() => {
    let list = CLIENTS as Client[];
    if (filter !== "all") list = list.filter((c) => c.status === filter);
    if (search.trim()) list = list.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [filter, search]);

  const selected = CLIENTS.find((c) => c.id === selectedId) ?? null;

  const counts = useMemo(() => ({
    total: CLIENTS.length,
    critical: CLIENTS.filter((c) => c.status === "critical").length,
    at_risk: CLIENTS.filter((c) => c.status === "at_risk").length,
    healthy: CLIENTS.filter((c) => c.status === "healthy").length,
    revenueAtRisk: CLIENTS.filter((c) => c.status === "critical" || c.status === "at_risk").reduce((s, c) => s + c.mrr, 0),
  }), []);

  const trendColor = (t: number[]) => {
    const last = t[t.length - 1];
    const prev = t[t.length - 2];
    return last >= prev ? "#22c55e" : "#ef4444";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ─── sidebar ─── */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">GH</div>
            <span className="font-semibold text-slate-800 text-sm">GoHighLevel</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Client Health Intelligence</p>
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
              V2 — Full
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 leading-tight">
            {isV2 ? "AI summaries, actions, alerts, detail panel" : "Scores, widget, badges, feedback"}
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
                placeholder="Search sub-accounts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-56"
              />
              <span className="absolute left-2.5 top-2 text-slate-400 text-sm">🔍</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${isV2 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
              {isV2 ? "V2 — Full Suite" : "V1 — MVP"}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {/* stat cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
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
          </div>

          {/* revenue at risk banner */}
          {counts.revenueAtRisk > 0 && (
            <div className="mb-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 text-white flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Monthly Revenue at Risk</p>
                <p className="text-2xl font-bold">${counts.revenueAtRisk.toLocaleString()}/mo</p>
                <p className="text-xs opacity-75 mt-0.5">{counts.critical + counts.at_risk} accounts need attention</p>
              </div>
              {isV2 && (
                <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
                  View Action Plan →
                </button>
              )}
            </div>
          )}

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
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        c.status === "critical" ? "bg-red-100 text-red-600" :
                        c.status === "at_risk" ? "bg-amber-100 text-amber-600" :
                        "bg-emerald-100 text-emerald-600"
                      }`}>
                        {c.score}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800 text-sm truncate">{c.name}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBg(c.status)} border`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDot(c.status)}`} />
                            {statusLabel(c.status)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">${c.mrr}/mo · Last active: {c.lastActivity}</p>
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
                    <p className="text-sm text-slate-400 mt-0.5">${selected.mrr}/mo · Last active: {selected.lastActivity}</p>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                </div>

                {/* score ring + status */}
                <div className="flex items-center gap-6 mb-6">
                  <ScoreRing score={selected.score} />
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusBg(selected.status)} border`}>
                      <span className={`w-2 h-2 rounded-full ${statusDot(selected.status)}`} />
                      {statusLabel(selected.status)}
                    </span>
                    <p className="text-xs text-slate-400 mt-2">7-day trend</p>
                    <Sparkline data={selected.trend} color={trendColor(selected.trend)} w={100} h={32} />
                  </div>
                </div>

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

                {/* V2 AI Summary */}
                {isV2 && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      🤖 AI Health Summary <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">V2</span>
                    </h3>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      {selected.score < 50
                        ? `${selected.name} is in critical condition. The primary issue is declining pipeline activity — no new contacts added recently and lead follow-up has stalled. Campaign engagement is below benchmarks. Immediate action needed on pipeline reactivation to prevent churn.`
                        : selected.score < 70
                        ? `${selected.name} shows early signs of disengagement. While some activity continues, key metrics are trending downward. Focus on improving conversation response rates and campaign engagement to stabilize the account.`
                        : `${selected.name} is performing well across all domains. Pipeline is active, campaigns are engaging, and conversation rates are strong. Consider this account for upsell opportunities or as a case study for best practices.`
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
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
