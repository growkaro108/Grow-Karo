"use client";

import { remitterContext } from "@/context/RemitterContext";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import { use, useEffect } from "react";

// Map color name -> full static class strings so Tailwind's scanner can find them.
// (Dynamic template strings like `text-${color}-600` are invisible to Tailwind's JIT scan.)
const COLOR_STYLES = {
  emerald: { text: "text-emerald-600", iconBg: "bg-emerald-50" },
  purple: { text: "text-purple-600", iconBg: "bg-purple-50" },
  amber: { text: "text-amber-600", iconBg: "bg-amber-50" },
};

const Card = ({
  loading,
  data,
  color = "emerald",
  title,
  icon,
  loadingText = "loading...",
  secondIcon,
  secondTitle,
  span = "",
}) => {
  const styles = COLOR_STYLES[color] ?? COLOR_STYLES.emerald;

  return (
    <div
      className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between ${span}`}
    >
      <div className="space-y-1">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </span>
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
          {loading ? loadingText : (data ?? 0)}
        </h3>
        <p
          className={`text-xs ${styles.text} font-medium flex items-center gap-1`}
        >
          {icon}
          {secondTitle}
        </p>
      </div>
      <div className={`${styles.iconBg} p-3.5 rounded-xl ${styles.text}`}>
        {secondIcon}
      </div>
    </div>
  );
};

export default function DashboardView({ chartData = [], transactions = [] }) {
  const { authRemitter, remLoading, fetchRequestsCounts, requestsCounts } =
    use(remitterContext);

  const safeChartData = Array.isArray(chartData) ? chartData : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  useEffect(() => {
    (async () => {
      try {
        await fetchRequestsCounts();
      } catch (error) {
        console.error(error);
      }
    })();
  }, [fetchRequestsCounts]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          loading={remLoading}
          color="emerald"
          data={authRemitter?.totalPaid}
          title="Total Volume Cleared"
          icon={<TrendingUp className="w-3 h-3 mr-1" />}
          secondIcon={<TrendingUp className="w-6 h-6" />}
          secondTitle="+12.4% MoM Growth"
        />

        <Card
          loading={remLoading}
          color="purple"
          data={authRemitter?.totalUsers ?? 0}
          title="Active Counterparties"
          icon={null}
          secondIcon={<Users className="w-6 h-6" />}
          secondTitle="Across 4 secure corridors"
        />

        <Card
          loading={remLoading}
          color="amber"
          data={requestsCounts?.processed || 0}
          title="Pending Requests"
          icon={<AlertCircle className="w-3.5 h-3.5 shrink-0" />}
          secondIcon={<Clock className="w-6 h-6" />}
          secondTitle="Awaiting your authorization"
        />

        <Card
          loading={remLoading}
          color="blue"
          data={requestsCounts?.success ?? 0}
          title="Total Settled"
          icon={<CheckCircle className="w-3 h-3 mr-1" />}
          secondIcon={<CheckCircle className="w-6 h-6" />}
          secondTitle="Transactions Completed"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm border-dashed lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                Request Liquidation Timeline
              </h2>
              <p className="text-xs text-gray-500">
                Chronological summary of transfer amounts deployed specifically
                to fulfill requested payments.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-medium self-start sm:self-center">
              <span className="flex items-center text-gray-500">
                <span className="w-2.5 h-2.5 bg-blue-600 rounded-full mr-1.5 inline-block" />
                Transfer Outlay ($)
              </span>
            </div>
          </div>

          {safeChartData.length === 0 ? (
            <p className="py-8 text-sm text-gray-500 text-center">
              No timeline data available yet.
            </p>
          ) : (
            <>
              <div className="relative w-full h-56 sm:h-64 pt-4">
                {safeChartData.map((node, idx) => (
                  <div
                    key={node.id ?? idx}
                    className="absolute hidden sm:flex flex-col items-center group cursor-pointer -translate-x-1/2"
                    style={{
                      left: `${(node.x / 600) * 100}%`,
                      top: `${(node.y / 200) * 100 - 35}%`,
                    }}
                  >
                    <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
                      {node.amount}
                    </span>
                    <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-0.5" />
                  </div>
                ))}

                <svg
                  className="w-full h-full"
                  viewBox="0 0 600 200"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                      <stop
                        offset="100%"
                        stopColor="#2563eb"
                        stopOpacity="0.0"
                      />
                    </linearGradient>
                  </defs>
                  <line
                    x1="0"
                    y1="40"
                    x2="600"
                    y2="40"
                    stroke="#f8fafc"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="0"
                    y1="90"
                    x2="600"
                    y2="90"
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <line
                    x1="0"
                    y1="140"
                    x2="600"
                    y2="140"
                    stroke="#f8fafc"
                    strokeWidth="1.5"
                  />
                  {/* NOTE: this path is still hardcoded, not derived from safeChartData */}
                  <path
                    d="M 50 150 L 160 110 L 270 70 L 380 130 L 490 30 L 490 180 L 50 180 Z"
                    fill="url(#chartGlow)"
                  />
                  <path
                    d="M 50 150 L 160 110 L 270 70 L 380 130 L 490 30"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {safeChartData.map((node, idx) => (
                    <circle
                      key={node.id ?? idx}
                      cx={node.x}
                      cy={node.y}
                      r="5"
                      fill="#2563eb"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="hover:scale-125 transition-transform"
                    />
                  ))}
                </svg>
              </div>

              <div className="flex justify-between items-center text-xs font-semibold text-gray-400 border-t border-gray-50 pt-3 px-6 sm:px-12">
                {safeChartData.map((node, idx) => (
                  <div key={node.id ?? idx} className="text-center">
                    <p className="text-gray-700 font-medium">{node.date}</p>
                    <p className="text-[10px] text-gray-400 sm:hidden font-bold">
                      {node.amount}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                Recent Settlement Activities
              </h2>
              <p className="text-xs text-gray-500">
                Real-time trace indicators on pending/cleared contracts.
              </p>
            </div>
          </div>
          <div className="divide-y divide-gray-50 text-sm">
            {safeTransactions.length === 0 ? (
              <p className="py-4 text-sm text-gray-500">
                No recent settlements available.
              </p>
            ) : (
              safeTransactions.slice(0, 3).map((tx) => (
                <div
                  key={tx.id}
                  className="py-4 flex items-center justify-between first:pt-0 last:pb-0 hover:bg-gray-50/50 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-gray-900">{tx.name}</p>
                    <p className="text-xs text-gray-400 font-medium">
                      {tx.method}
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="font-bold text-gray-900">{tx.amount}</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${
                        tx.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
