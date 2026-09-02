"use client";

import { useEffect, useState, useRef } from "react";
import {
  Activity,
  AlertTriangle,
  Clock,
  Wallet,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import StatCard from "./StatCard";
import { currency } from "../utils";
import { useEventStream } from "@/api/useEventStream";
import { buildSseUrl, apiRequest } from "@/api/apiClient";
import {
  mapBackendLog,
  TYPE_DOT,
} from "./Activity/activityLogShared";

const SCHEME_PALETTE = [
  "#10b981", "#6366f1", "#f59e0b", "#ef4444",
  "#3b82f6", "#8b5cf6", "#14b8a6", "#f97316",
];

const STATUS_COLORS = {
  PENDING: "#f59e0b",
  SUCCESS: "#10b981",
  PROCESSED: "#6366f1",
  FAILED: "#ef4444",
  REJECTED: "#ef4444",
  REFUNDED: "#3b82f6",
};

export default function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch overview stats ─────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiRequest("/admin/overview", { method: "GET" });
        if (res?.status === "success") setStats(res.data);
      } catch (e) {
        console.error("Failed to load overview:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Live activity SSE feed ───────────────────────────────────────
  const { items: feed, connectionStatus } = useEventStream({
    endpoint: buildSseUrl("admin/activity-logs/stream"),
    eventName: "activity",
    mapEvent: mapBackendLog,
    maxItems: 50,
  });

  const connMeta = {
    live: { dot: "bg-emerald-400 animate-pulse", text: "text-emerald-400", label: "Live" },
    connecting: { dot: "bg-slate-500", text: "text-slate-400", label: "Connecting…" },
    reconnecting: { dot: "bg-amber-400 animate-pulse", text: "text-amber-400", label: "Reconnecting…" },
  }[connectionStatus] ?? { dot: "bg-slate-500", text: "text-slate-400", label: "Connecting…" };

  // ── Inflow chart ─────────────────────────────────────────────────
  const inflowData = stats?.inflowData ?? [];
  const inflowChartData = {
    labels: inflowData.map((d) => {
      try { return new Date(d.day).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }); }
      catch { return d.day; }
    }),
    datasets: [{
      label: "Inflow",
      data: inflowData.map((d) => Number(d.amount)),
      borderColor: "#10b981",
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "#10b981",
      tension: 0.35,
      fill: true,
      backgroundColor: (ctx) => {
        const { chart } = ctx;
        const { chartArea } = chart;
        if (!chartArea) return "rgba(16,185,129,0.15)";
        const g = chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        g.addColorStop(0, "rgba(16,185,129,0.35)");
        g.addColorStop(1, "rgba(16,185,129,0)");
        return g;
      },
    }],
  };

  const inflowOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a", borderColor: "#1e293b", borderWidth: 1,
        titleColor: "#e2e8f0", bodyColor: "#e2e8f0", padding: 10, cornerRadius: 12, displayColors: false,
        callbacks: { label: (i) => `Inflow: ${currency(i.parsed.y)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: "#64748b", font: { size: 10 } } },
      y: { grid: { color: "#1e293b" }, border: { display: false }, ticks: { color: "#64748b", font: { size: 10 }, callback: (v) => `₹${(v / 1000).toFixed(0)}k` } },
    },
  };

  // ── Doughnut: scheme AUM ─────────────────────────────────────────
  const schemeAUM = stats?.schemeAUM ?? [];
  const doughnutData = {
    labels: schemeAUM.map((s) => s.schemeName),
    datasets: [{
      data: schemeAUM.map((s) => Number(s.aum)),
      backgroundColor: SCHEME_PALETTE.slice(0, schemeAUM.length),
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };
  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: "70%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a", borderColor: "#1e293b", borderWidth: 1,
        titleColor: "#e2e8f0", bodyColor: "#e2e8f0", padding: 10, cornerRadius: 12, displayColors: true,
        callbacks: { label: (i) => ` ${currency(i.parsed)}` },
      },
    },
  };

  // ── Bar: withdrawal status ───────────────────────────────────────
  const breakdown = stats?.statusBreakdown ?? {};
  const breakdownLabels = Object.keys(breakdown);
  const barData = {
    labels: breakdownLabels,
    datasets: [{
      label: "Count",
      data: breakdownLabels.map((k) => Number(breakdown[k])),
      backgroundColor: breakdownLabels.map((k) => STATUS_COLORS[k] ?? "#64748b"),
      borderRadius: 6,
      borderSkipped: false,
    }],
  };
  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a", borderColor: "#1e293b", borderWidth: 1,
        titleColor: "#e2e8f0", bodyColor: "#e2e8f0", padding: 10, cornerRadius: 12, displayColors: false,
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: "#64748b", font: { size: 10 } } },
      y: { grid: { color: "#1e293b" }, border: { display: false }, ticks: { color: "#64748b", font: { size: 10 }, stepSize: 1 } },
    },
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-teal-400" />
          <p className="text-xs text-slate-500">Loading overview…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Total AUM"
          value={currency(Number(stats?.totalAUM ?? 0))}
          delta="All approved investments"
          deltaPositive
          accent="bg-emerald-500/15"
          textcolor="text-emerald-400"
        />
        <StatCard
          icon={Users}
          label="Active Investors"
          value={(stats?.activeInvestors ?? 0).toLocaleString("en-IN")}
          delta="Users with live scheme"
          deltaPositive
          accent="bg-indigo-500/15"
          textcolor="text-indigo-400"
        />
        <StatCard
          icon={Clock}
          label="Pending Withdrawals"
          value={`${currency(Number(stats?.pendingWithdrawalAmount ?? 0))}`}
          delta={`${stats?.pendingWithdrawalCount ?? 0} request(s) awaiting approval`}
          deltaPositive={false}
          accent="bg-amber-500/15"
          textcolor="text-amber-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="Open Issues"
          value={stats?.openIssues ?? 0}
          delta="Unresolved support tickets"
          deltaPositive={false}
          accent="bg-rose-500/15"
          textcolor="text-rose-400"
        />
      </div>

      {/* ── Inflow Chart + Live Feed ── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {/* Inflow line chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-200 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Platform Inflow
              </h3>
              <p className="text-xs text-slate-500 font-body mt-0.5">Last 14 days · successful deposits</p>
            </div>
          </div>
          <div className="h-56">
            {inflowData.length > 0
              ? <Line data={inflowChartData} options={inflowOptions} />
              : <div className="flex h-full items-center justify-center text-xs text-slate-600">No deposit data in the last 14 days</div>
            }
          </div>
        </div>

        {/* Live Activity feed */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-slate-200">Live Activity</h3>
            <span className={`flex items-center gap-1.5 text-xs font-body ${connMeta.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${connMeta.dot}`} />
              {connMeta.label}
            </span>
          </div>
          <div className="scrollbar-thin max-h-56 space-y-3 overflow-y-auto pr-1">
            {feed.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-600">Waiting for events…</p>
            )}
            {feed.map((event) => (
              <div key={event.id} className="animate-feed-in flex items-start gap-3 border-b border-slate-800/60 pb-3 last:border-0">
                <span className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${event.type === "withdrawal" ? "bg-amber-500/10 text-amber-400"
                  : event.type === "deposit" ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-indigo-500/10 text-indigo-400"}`}>
                  <span className={`h-2 w-2 rounded-full ${TYPE_DOT[event.type] ?? "bg-slate-500"}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-300 font-body truncate">
                    <span className="font-medium text-slate-100">{event.name}</span>{" "}{event.text}
                    {event.amount && <span className="font-mono text-slate-200"> {event.amount}</span>}
                  </p>
                  <p className="text-[10px] text-slate-600 font-mono">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Doughnut + Bar ── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Doughnut: AUM by scheme */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-4">
            <h3 className="font-display text-sm font-semibold text-slate-200">Investment by Scheme</h3>
            <p className="text-xs text-slate-500 font-body mt-0.5">AUM distribution across active plans</p>
          </div>
          {schemeAUM.length === 0
            ? <div className="flex h-48 items-center justify-center text-xs text-slate-600">No approved investments yet</div>
            : (
              <div className="flex items-center gap-6">
                <div className="h-48 w-48 shrink-0">
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
                <ul className="space-y-2 text-xs">
                  {schemeAUM.map((s, i) => (
                    <li key={s.schemeName} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: SCHEME_PALETTE[i % SCHEME_PALETTE.length] }} />
                      <span className="text-slate-400 truncate max-w-[120px]">{s.schemeName}</span>
                      <span className="ml-auto font-mono text-slate-300">{currency(Number(s.aum))}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>

        {/* Bar: transaction status breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-4">
            <h3 className="font-display text-sm font-semibold text-slate-200">Transaction Status Breakdown</h3>
            <p className="text-xs text-slate-500 font-body mt-0.5">All-time count by status</p>
          </div>
          <div className="h-48">
            {breakdownLabels.length === 0
              ? <div className="flex h-full items-center justify-center text-xs text-slate-600">No transactions yet</div>
              : <Bar data={barData} options={barOptions} />
            }
          </div>
        </div>
      </div>
    </div>
  );
}
