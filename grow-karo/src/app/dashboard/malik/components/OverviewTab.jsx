import { Activity, AlertTriangle, Clock, Wallet } from "lucide-react";
import { Line } from "react-chartjs-2";
import StatCard from "./StatCard";
import { INFLOW_DATA, currency } from "../data";

export default function OverviewTab({ withdrawals, issues, feed }) {
  const pending = withdrawals.filter((w) => w.status === "pending");
  const openIssues = issues.filter((i) => i.status !== "resolved");

  const inflowChartData = {
    labels: INFLOW_DATA.map((d) => d.day),
    datasets: [
      {
        label: "Inflow",
        data: INFLOW_DATA.map((d) => d.amount),
        borderColor: "#10b981",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#10b981",
        pointHoverBorderColor: "#0f172a",
        pointHoverBorderWidth: 2,
        tension: 0.35,
        fill: true,
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return "rgba(16,185,129,0.15)";
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(16,185,129,0.35)");
          gradient.addColorStop(1, "rgba(16,185,129,0)");
          return gradient;
        },
      },
    ],
  };

  const inflowChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
        borderWidth: 1,
        titleColor: "#e2e8f0",
        bodyColor: "#e2e8f0",
        padding: 10,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (item) => `Inflow: ${currency(item.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#64748b", font: { size: 11 } },
      },
      y: {
        grid: { color: "#1e293b" },
        border: { display: false },
        ticks: {
          color: "#64748b",
          font: { size: 11 },
          callback: (v) => `₹${v / 1000}k`,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Wallet} label="Total Invested (AUM)" value={currency(18420000)} delta="+4.2% this week" deltaPositive accent="bg-emerald-500/15 text-emerald-400" />
        <StatCard icon={Activity} label="Active Users" value="6,204" delta="+312 this week" deltaPositive accent="bg-indigo-500/15 text-indigo-400" />
        <StatCard icon={Clock} label="Pending Withdrawals" value={`${currency(pending.reduce((s, w) => s + w.amount, 0))}`} delta="Needs review" deltaPositive={false} accent="bg-amber-500/15 text-amber-400" />
        <StatCard icon={AlertTriangle} label="Open Issues" value={openIssues.length} delta="2 high priority" deltaPositive={false} accent="bg-rose-500/15 text-rose-400" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-200">Platform Inflow</h3>
              <p className="text-xs text-slate-500 font-body">Last 14 days · gross deposits</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">+31.6%</span>
          </div>
          <div className="h-64">
            <Line data={inflowChartData} options={inflowChartOptions} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-slate-200">Live Activity</h3>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-body">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" /> Live
            </span>
          </div>
          <div className="scrollbar-thin max-h-64 space-y-3 overflow-y-auto pr-1">
            {feed.map((event) => (
              <div key={event.id} className="animate-feed-in flex items-start gap-3 border-b border-slate-800/60 pb-3 last:border-0">
                <span className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  event.type === "withdrawal" ? "bg-amber-500/10 text-amber-400" : event.type === "deposit" ? "bg-emerald-500/10 text-emerald-400" : "bg-indigo-500/10 text-indigo-400"
                }`}>
                  <Activity className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-300 font-body">
                    <span className="font-medium text-slate-100">{event.name}</span> {event.text}
                    {event.amount ? <span className="font-mono text-slate-200"> {currency(event.amount)}</span> : null}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
