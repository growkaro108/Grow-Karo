"use client";

import Link from "next/link";
import ChartComponent from "./ChartComponent";

export default function HeroSection() {
  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        data: [100, 115, 108, 125, 140, 135, 150, 170, 162, 185, 195, 210],
        borderColor: "#2563eb",
        borderWidth: 3.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#2563eb",
        pointHoverBorderColor: "#ffffff",
        pointHoverBorderWidth: 2,
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
      }
    ]
  };

  const chartOptions = {
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
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => `$${(context.raw * 1242).toLocaleString()}`
        }
      }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false
    }
  };

  return (
    <section className="rounded-3xl bg-white p-6 sm:p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        {/* Left Column: Content */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl xl:text-6xl leading-tight">
            Invest for Your Future <br className="hidden sm:inline" />
            with Confidence.
          </h1>
          <p className="text-base text-slate-500 sm:text-lg max-w-xl leading-relaxed">
            Secure, intuitive portfolio management for growth.
          </p>
          <div>
            <Link
              href="/login?mode=signup"
              className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-8 text-sm font-semibold text-white transition duration-300 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/20"
            >
              Create Your Account
            </Link>
          </div>
        </div>

        {/* Right Column: Interactive Card */}
        <div className="relative">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-[0_15px_40px_rgba(15,23,42,0.04)] max-w-md mx-auto lg:max-w-none w-full">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-6">
              <span className="rounded-full bg-slate-50 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-slate-600 border border-slate-100">
                SecureGrowth Fund
              </span>
              {/* Decorative mini trend icon */}
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23 6l-9.5 9.5-5-5L1 18h22V6z" opacity="0.2" />
                  <path d="M23 6l-9.5 9.5-5-5L1 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* ChartJS Sparkline */}
            <div className="relative h-44 sm:h-52 w-full rounded-2xl bg-linear-to-b from-slate-50 to-white/50 p-2 overflow-hidden">
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
