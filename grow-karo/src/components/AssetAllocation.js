"use client";

import { useState } from "react";
import ChartComponent from "./ChartComponent";

export default function AssetAllocation() {
  const [activeRange, setActiveRange] = useState("ALL");

  const ranges = ["1W", "1M", "1Y", "ALL"];

  // Donut chart configuration
  const donutData = {
    labels: ["Liquid Funds", "Margin Trading", "Gold", "Shares"],
    datasets: [
      {
        data: [29, 18, 14, 39],
        backgroundColor: ["#2563eb", "#f43f5e", "#f59e0b", "#10b981"],
        borderColor: "#ffffff",
        borderWidth: 2.5,
        hoverOffset: 6,
      },
    ],
  };

  const donutOptions = {
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
    cutout: "55%",
  };

  // Performance line chart configuration
  const performanceData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Portfolio",
        data: [10000, 15000, 12000, 18000, 22000, 25000],
        borderColor: "#0f172a",
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: "#0f172a",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 1.5,
        tension: 0.4,
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "rgba(37, 99, 235, 0.05)";
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(37, 99, 235, 0.15)");
          gradient.addColorStop(1, "rgba(37, 99, 235, 0)");
          return gradient;
        },
      },
      {
        label: "Benchmark A",
        data: [10000, 13000, 11500, 15000, 18000, 21000],
        borderColor: "#3b82f6",
        borderWidth: 1.8,
        pointRadius: 0,
        tension: 0.4,
        fill: false,
        borderDash: [4, 4],
      },
      {
        label: "Benchmark B",
        data: [10000, 11000, 10500, 13000, 14500, 16000],
        borderColor: "#10b981",
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const performanceOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: $${context.raw.toLocaleString()}`,
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
          callback: (value) => `$${value / 1000}k`,
        },
        border: { display: false },
      },
    },
  };

  return (
    <section id="insights" className="rounded-3xl sm:rounded-4xl bg-white p-6 sm:p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Dynamic Portfolio Insights</h2>
          <p className="mt-1.5 text-sm text-slate-500">Interactive data visualization in secure investment platform.</p>
        </div>

        {/* Interactive range filters */}
        <div className="flex bg-slate-50 p-1.5 rounded-full border border-slate-100 self-start sm:self-auto shadow-sm">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider transition ${
                activeRange === range
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-950"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Card: Asset Allocation */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Asset Allocation</h3>
            <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
              Portfolio split
            </span>
          </div>

          {/* ChartJS Donut Container */}
          <div className="relative flex h-52 sm:h-60 items-center justify-center rounded-2xl bg-white p-4 shadow-sm border border-slate-100/50 my-6">
            <ChartComponent
              type="doughnut"
              data={donutData}
              options={donutOptions}
              className="h-full w-full max-h-55"
            />
          </div>

          {/* Legends */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { label: "Liquid Funds", value: "29%", color: "bg-blue-600" },
              { label: "Margin Trading", value: "18%", color: "bg-rose-500" },
              { label: "Gold", value: "14%", color: "bg-amber-500" },
              { label: "Shares", value: "39%", color: "bg-emerald-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  <span className="font-semibold text-slate-600">{item.label}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Growth Over Time */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Growth Over Time</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
              Performance trend
            </span>
          </div>

          {/* ChartJS Line Chart Container */}
          <div className="relative h-64 sm:h-72 w-full rounded-2xl bg-white p-4 shadow-sm border border-slate-100/50 my-6 overflow-hidden">
            <ChartComponent
              type="line"
              data={performanceData}
              options={performanceOptions}
              className="h-full w-full"
            />
          </div>

          <div className="text-center text-[10px] text-slate-400 font-semibold tracking-wider uppercase flex justify-center gap-6">
            <span>-- Hypothetical style --</span>
            <span>-- Hypothetical style --</span>
          </div>
        </div>
      </div>
    </section>
  );
}
