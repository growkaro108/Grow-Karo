"use client";

import { AlertCircle, Clock } from "lucide-react";
import React from "react";

export default function DashboardView({
  dashboardMetrics = {},
  chartData = [],
  transactions = [],
  requests = [],
}) {
  const safeDashboardMetrics = dashboardMetrics || {};
  const safeChartData = Array.isArray(chartData) ? chartData : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeRequests = Array.isArray(requests) ? requests : [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Volume Cleared
            </span>
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
              ₹14,250.00
            </h3>
            <p className="text-xs text-emerald-600 font-medium flex items-center">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                  clipRule="evenodd"
                />
              </svg>
              +12.4% MoM Growth
            </p>
          </div>
          <div className="bg-blue-50 p-3.5 rounded-xl text-blue-600">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Active Counterparties
            </span>
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
              {safeDashboardMetrics.activeCounterparties ?? 0}
            </h3>
            <p className="text-xs text-gray-500">Across 4 secure corridors</p>
          </div>
          <div className="bg-purple-50 p-3.5 rounded-xl text-purple-600">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Pending Requests
            </span>
            {/* Dynamic count based on your requests array length */}
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
              {safeRequests.filter((req) => !req.isSettled).length}
            </h3>
            <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              Awaiting your authorization
            </p>
          </div>
          {/* Clock style icon wrapper */}
          <div className="bg-amber-50 p-3.5 rounded-xl text-amber-600">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
        </div>
      </div>
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm border-dashed lg:col-span-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">
              Request Liquidation Timeline
            </h2>
            <p className="text-xs text-gray-500">
              Chronological summary of transfer amounts deployed specifically to
              fulfill requested payments.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-medium self-start sm:self-center">
            <span className="flex items-center text-gray-500">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full mr-1.5 inline-block"></span>{" "}
              Transfer Outlay ($)
            </span>
          </div>
        </div>

        <div className="relative w-full h-56 sm:h-64 pt-4">
          {safeChartData.map((node, idx) => (
            <div
              key={idx}
              className="absolute hidden sm:flex flex-col items-center group cursor-pointer -translate-x-1/2"
              style={{
                left: `${(node.x / 600) * 100}%`,
                top: `${(node.y / 200) * 100 - 35}%`,
              }}
            >
              <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
                {node.amount}
              </span>
              <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-0.5"></div>
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
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
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
                key={idx}
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
            <div key={idx} className="text-center">
              <p className="text-gray-700 font-medium">{node.date}</p>
              <p className="text-[10px] text-gray-400 sm:hidden font-bold">
                {node.amount}
              </p>
            </div>
          ))}
        </div>
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
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${tx.status === "Completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
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
