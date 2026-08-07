"use client";

import Link from "next/link";
import ChartComponent from "./ChartComponent";

export default function HeroSection() {
  const chartData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        data: [100, 115, 108, 125, 140, 135, 150, 170, 162, 185, 195, 210],
        borderColor: "#2563eb",
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#2563eb",
        pointHoverBorderColor: "#ffffff",
        pointHoverBorderWidth: 2.5,
        tension: 0.4,
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "rgba(37, 99, 235, 0.05)";
          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );
          gradient.addColorStop(0, "rgba(37, 99, 235, 0.2)");
          gradient.addColorStop(1, "rgba(37, 99, 235, 0)");
          return gradient;
        },
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: "index",
        intersect: false,
        backgroundColor: "#0f172a",
        titleFont: { size: 10, weight: "bold" },
        bodyFont: { size: 12, weight: "bold" },
        padding: 10,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          label: (context) => `$${(context.raw * 1242).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };

  return (
    <section className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-3xl border border-slate-100 bg-slate-50/50 p-4 sm:p-8 lg:p-12 xl:p-16 shadow-xs backdrop-blur-sm">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
        {/* Left Column: Main Hero Content */}
        <div className="flex flex-col items-start justify-center space-y-5 lg:col-span-7">
          {/* Tagline Badge */}
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1.5 text-[11px] font-semibold text-blue-700 shadow-xs backdrop-blur-sm sm:px-3.5 sm:text-xs">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600"></span>
            </span>
            <span className="truncate">Next-Gen Portfolio Management</span>
          </div>

          {/* Hero Heading - Responsive word wrapping & sizing */}
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 xs:text-3xl sm:text-5xl lg:text-5xl xl:text-6xl/tight">
            Invest for Future{" "}
            <span className="inline-block bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              with Confidence.
            </span>
          </h1>

          {/* Subheading Description */}
          <p className="max-w-xl text-sm font-normal leading-relaxed text-slate-600 sm:text-lg">
            Secure, intuitive portfolio management engineered for sustainable
            growth. Track performance, rebalance assets, and build wealth with
            ease.
          </p>

          {/* Action Buttons - Full-width stacked on mobile, row on desktop */}
          <div className="flex w-full flex-col gap-3 pt-1 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/auth"
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition-all duration-300 hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/25 active:scale-[0.98] sm:h-12 sm:w-auto"
            >
              Create Your Account
            </Link>
            <Link
              href="#features"
              className="inline-flex h-11 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] sm:h-12 sm:w-auto"
            >
              Explore Features
            </Link>
          </div>
        </div>

        {/* Right Column: Dynamic Portfolio Card */}
        <div className="relative w-full lg:col-span-5">
          {/* Subtle Glow */}
          <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-blue-500/15 to-indigo-500/15 blur-xl opacity-80"></div>

          <div className="relative rounded-2xl border border-slate-200/80 bg-white/90 p-4 sm:rounded-3xl sm:p-6 shadow-2xl shadow-slate-900/5 backdrop-blur-xl">
            {/* Header Metrics */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:text-xs">
                  Portfolio Value
                </span>
                <div className="mt-1 flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                    $260,820
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 sm:px-2 sm:text-xs">
                    ▲ +110.0% YTD
                  </span>
                </div>
              </div>

              {/* Fund Tag */}
              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600 sm:px-3 sm:text-xs">
                SecureGrowth
              </span>
            </div>

            {/* Sparkline Canvas */}
            <div className="relative mt-4 h-36 w-full sm:mt-6 sm:h-52 lg:h-56">
              <ChartComponent
                type="line"
                data={chartData}
                options={chartOptions}
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
