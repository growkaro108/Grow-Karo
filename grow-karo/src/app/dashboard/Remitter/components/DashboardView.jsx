"use client";

import { generateBarChartData } from "@/app/utils/constant";
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
  blue: { text: "text-blue-600", iconBg: "bg-blue-50" },
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

export default function DashboardView() {
  const {
    authRemitter,
    remLoading,
    fetchRequestsCounts,
    requestsCounts,
    fetchTransactions,
    transactions,
    paymentTimeline,
  } = use(remitterContext);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([fetchRequestsCounts(), fetchTransactions()]);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [fetchRequestsCounts, fetchTransactions]);

  // Defensive: transactions can be undefined before the first fetch resolves,
  // or if the fetch fails. Without this guard, `.slice` on undefined throws
  // and crashes the whole render tree (chart included).
  const recentTrxn = Array.isArray(transactions) ? transactions.slice(0, 3) : [];

  // Bars: one per unique date (same-day amounts summed), height scaled to
  // that day's total. Handles duplicate dates cleanly and avoids implying
  // a trend between sparse dates the way a line chart would.
  const chartData = Array.isArray(paymentTimeline)
    ? generateBarChartData(paymentTimeline, {
        width: 600,
        height: 320,
        margin: { top: 20, right: 20, bottom: 40, left: 20 },
        barWidthRatio: 0.45,
      })
    : [];

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
                Transfer Outlay (₹)
              </span>
            </div>
          </div>

          {chartData.length === 0 ? (
            <p className="py-8 text-sm text-gray-500 text-center">
              No timeline data available yet.
            </p>
          ) : (
            <>
              <div className="relative w-full h-56 sm:h-64">
                {/* Tooltip trigger sized to the bar's actual footprint
                    (top of bar to baseline) so hovering anywhere on the
                    bar shows the tooltip — an empty/absolute-only div has
                    no hoverable area on its own. */}
                {chartData.map((bar, idx) => (
                  <div
                    key={bar.id ?? idx}
                    className="absolute group z-10"
                    style={{
                      left: `${bar.hitLeftPercent}%`,
                      top: `${bar.hitTopPercent}%`,
                      width: `${bar.hitWidthPercent}%`,
                      height: `${bar.hitHeightPercent}%`,
                    }}
                  >
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 whitespace-nowrap rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                      ₹{bar.amount.toLocaleString("en-IN")}
                      {bar.count > 1 ? ` (${bar.count} txns)` : ""}
                    </span>
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rotate-45 bg-slate-900 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
                  </div>
                ))}

                <svg
                  className="w-full h-full"
                  viewBox="0 0 600 320"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.85" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="40" x2="600" y2="40" stroke="#f8fafc" strokeWidth="1.5" />
                  <line x1="0" y1="90" x2="600" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="140" x2="600" y2="140" stroke="#f8fafc" strokeWidth="1.5" />
                  <line x1="0" y1="280" x2="600" y2="280" stroke="#e5e7eb" strokeWidth="1" />

                  {chartData.map((bar, idx) => (
                    <rect
                      key={bar.id ?? idx}
                      x={bar.x}
                      y={bar.y}
                      width={bar.width}
                      height={Math.max(bar.height, 2)}
                      rx="4"
                      fill="url(#barGradient)"
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </svg>
              </div>

              {/* One label per bar, positioned at that bar's center xPercent. */}
              <div className="relative w-full h-10 border-t border-gray-50 pt-3">
                {chartData.map((bar, idx) => (
                  <div
                    key={bar.id ?? idx}
                    className="absolute -translate-x-1/2 text-center text-xs font-semibold text-gray-400"
                    style={{ left: `${bar.xPercent}%` }}
                  >
                    <p className="text-gray-700 font-medium whitespace-nowrap">
                      {bar.date}
                    </p>
                    <p className="text-[10px] text-gray-400 sm:hidden font-bold">
                      {bar.count > 1 ? `${bar.count} txns` : bar.amount}
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
            {recentTrxn.length === 0 ? (
              <p className="py-4 text-sm text-gray-500">
                No recent settlements available.
              </p>
            ) : (
              recentTrxn.map((tx) => (
                <div
                  key={tx.txnId}
                  className="py-4 flex items-center justify-between first:pt-0 last:pb-0 hover:bg-gray-50/50 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-gray-900">{tx.username}</p>
                    <p className="text-xs text-gray-400 font-medium">
                      {tx.bankName}
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="font-bold text-gray-900">{tx.amount}</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${
                        tx.proofUrl
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {tx.proofUrl ? `Completed` : `Pending`}
                    </span>
                    <span className="font-semibold text-gray-500">
                      {tx.settlementDate
                        ? `on: ${tx.settlementDate}`
                        : `requested on: ${tx.requestedDate}`}
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