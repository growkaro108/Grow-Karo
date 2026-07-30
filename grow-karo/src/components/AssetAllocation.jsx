"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

// Chart.js lazy load with skeleton placeholder
const ChartComponent = dynamic(() => import("./ChartComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />
  ),
});

const RANGES = ["1W", "1M", "1Y", "ALL"];

const ALLOCATION = [
  { label: "Liquid Funds", value: 29, color: "#2563eb", swatch: "bg-blue-600" },
  {
    label: "Margin Trading",
    value: 18,
    color: "#f43f5e",
    swatch: "bg-rose-500",
  },
  { label: "Gold", value: 14, color: "#f59e0b", swatch: "bg-amber-500" },
  { label: "Shares", value: 39, color: "#10b981", swatch: "bg-emerald-500" },
];

const donutData = {
  labels: ALLOCATION.map((a) => a.label),
  datasets: [
    {
      data: ALLOCATION.map((a) => a.value),
      backgroundColor: ALLOCATION.map((a) => a.color),
      borderColor: "#ffffff",
      borderWidth: 2.5,
      hoverOffset: 6,
    },
  ],
};

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#0f172a",
      padding: 10,
      cornerRadius: 8,
      titleFont: { size: 11, weight: "bold" },
      bodyFont: { size: 12 },
      callbacks: {
        label: (context) => ` ${context.label}: ${context.raw}%`,
      },
    },
  },
  cutout: "60%",
};

const SERIES = [
  { key: "portfolio", label: "Portfolio", color: "#0f172a", dash: false },
  { key: "benchmarkA", label: "Benchmark A", color: "#3b82f6", dash: true },
  { key: "benchmarkB", label: "Benchmark B", color: "#10b981", dash: false },
];

const PERFORMANCE_BY_RANGE = {
  "1W": {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    portfolio: [24200, 24450, 24100, 24800, 25100, 24950, 25000],
    benchmarkA: [20800, 20950, 20900, 21050, 21150, 21050, 21000],
    benchmarkB: [15700, 15750, 15680, 15820, 15900, 15950, 16000],
  },
  "1M": {
    labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
    portfolio: [22000, 23200, 24100, 25000],
    benchmarkA: [19500, 20100, 20600, 21000],
    benchmarkB: [15000, 15300, 15650, 16000],
  },
  "1Y": {
    labels: ["Jan", "Mar", "May", "Jul", "Sep", "Nov"],
    portfolio: [10000, 13500, 17000, 19500, 22500, 25000],
    benchmarkA: [10000, 12000, 15000, 17500, 19500, 21000],
    benchmarkB: [10000, 10800, 12200, 13600, 14800, 16000],
  },
  ALL: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    portfolio: [10000, 15000, 12000, 18000, 22000, 25000],
    benchmarkA: [10000, 13000, 11500, 15000, 18000, 21000],
    benchmarkB: [10000, 11000, 10500, 13000, 14500, 16000],
  },
};

const performanceOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#0f172a",
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        label: (context) =>
          ` ${context.dataset.label}: ₹${context.raw.toLocaleString()}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#94a3b8", font: { size: 10, weight: "600" } },
      border: { display: false },
    },
    y: {
      grid: { color: "#f1f5f9" },
      ticks: {
        color: "#94a3b8",
        font: { size: 10, weight: "600" },
        callback: (value) => `₹${value / 1000}k`,
      },
      border: { display: false },
    },
  },
};

export default function AssetAllocation() {
  const [activeRange, setActiveRange] = useState("ALL");

  const performanceData = useMemo(() => {
    const range = PERFORMANCE_BY_RANGE[activeRange];
    return {
      labels: range.labels,
      datasets: [
        {
          label: "Portfolio",
          data: range.portfolio,
          borderColor: "#0f172a",
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#0f172a",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 1.5,
          tension: 0.4,
          fill: true,
          backgroundColor: (context) => {
            const { chart } = context;
            const { ctx, chartArea } = chart;
            if (!chartArea) return "rgba(37, 99, 235, 0.05)";
            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, "rgba(37, 99, 235, 0.15)");
            gradient.addColorStop(1, "rgba(37, 99, 235, 0)");
            return gradient;
          },
        },
        {
          label: "Benchmark A",
          data: range.benchmarkA,
          borderColor: "#3b82f6",
          borderWidth: 1.8,
          pointRadius: 0,
          tension: 0.4,
          fill: false,
          borderDash: [4, 4],
        },
        {
          label: "Benchmark B",
          data: range.benchmarkB,
          borderColor: "#10b981",
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.4,
          fill: false,
        },
      ],
    };
  }, [activeRange]);

  return (
    <section
      id="insights"
      aria-labelledby="insights-heading"
      className="mx-auto w-full max-w-7xl rounded-3xl bg-white p-5 border border-slate-100 shadow-sm sm:p-8 lg:p-10"
    >
      {/* Header & Filter Controls */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="insights-heading"
            className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
          >
            Dynamic Portfolio Insights
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Interactive data visualization in secure investment platform.
          </p>
        </div>

        {/* Time range selector filter */}
        <div
          role="group"
          aria-label="Select time range"
          className="flex self-start overflow-x-auto rounded-full border border-slate-200/80 bg-slate-50 p-1 shadow-xs sm:self-auto"
        >
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setActiveRange(range)}
              aria-pressed={activeRange === range}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                activeRange === range
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: 1 col on mobile, 2 cols on tablet/desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Asset Allocation Doughnut */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Asset Allocation
            </h3>
            <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-xs">
              Portfolio split
            </span>
          </div>

          <div className="relative my-6 flex h-48 sm:h-56 w-full items-center justify-center">
            <ChartComponent
              type="doughnut"
              data={donutData}
              options={donutOptions}
              className="h-full w-full"
            />
          </div>

          {/* Allocation Legend */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
            {ALLOCATION.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white px-3.5 py-2.5 shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.swatch}`} />
                  <span className="font-medium text-slate-700">
                    {item.label}
                  </span>
                </div>
                <span className="font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Growth Over Time Line Chart */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Growth Over Time
            </h3>
            <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-xs">
              Performance trend
            </span>
          </div>

          <div className="relative my-6 h-52 sm:h-64 w-full">
            <ChartComponent
              type="line"
              data={performanceData}
              options={performanceOptions}
              className="h-full w-full"
            />
          </div>

          {/* Series Legend */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold tracking-wide text-slate-600">
            {SERIES.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-2">
                <span
                  className="h-2 w-3 rounded-xs"
                  style={{
                    backgroundColor: s.dash ? "transparent" : s.color,
                    borderBottom: s.dash ? `2px dashed ${s.color}` : "none",
                  }}
                />
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
