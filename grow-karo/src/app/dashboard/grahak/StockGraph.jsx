"use client";

import { formatDateTime } from "@/app/plan/utils/planUtils";
import { userContext } from "@/context/UserContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { use, useMemo } from "react";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
);

export const options = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index", // find nearest data point across the x-axis
    intersect: false, // don't require the cursor to be exactly on the point
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: true, // make sure this isn't accidentally false somewhere
      backgroundColor: "#0f172a",
      titleFont: { size: 11, weight: "600" },
      bodyFont: { size: 13, weight: "700" },
      padding: 12,
      cornerRadius: 12,
      displayColors: false,
      callbacks: {
        label: function (context) {
          return `₹${context.raw.toLocaleString("en-IN")}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#94a3b8", font: { size: 11, weight: "500" } },
      border: { display: false },
    },
    y: {
      grid: { color: "#f1f5f9" },
      ticks: { color: "#94a3b8", font: { size: 11, weight: "500" } },
      border: { display: false },
    },
  },
};

export default function StockGraph() {
  const { portfolio } = use(userContext);

  // Build [{ date, paidAmount }] from real portfolio holdings
  const dataset1 = useMemo(() => {
    if (!portfolio) return [];
    return (
      portfolio.holdings
        ?.filter((item) => item?.enrollmentDate != null)
        .map((item) => ({
          date: formatDateTime(item?.enrollmentDate).slice(0, 6),
          paidAmount: item?.paidAmount ?? 0,
        })) ?? []
    );
  }, [portfolio]);

  // Transform dataset1 into Chart.js's { labels, datasets } shape
  const chartData = useMemo(() => {
    const labels = dataset1.map((d) => d.date);
    const values = dataset1.map((d) => d.paidAmount);

    return {
      labels,
      datasets: [
        {
          fill: true,
          label: "Paid Amount",
          data: values,
          borderColor: "#0f172a",
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "#0f172a",
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 2,
          tension: 0.35,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, "rgba(15, 23, 42, 0.12)");
            gradient.addColorStop(1, "rgba(15, 23, 42, 0)");
            return gradient;
          },
        },
      ],
    };
  }, [dataset1]);

  if (!portfolio) {
    return (
      <div className="w-full h-72 mt-2 p-6 bg-white border border-slate-200/60 rounded-2xl shadow-sm flex items-center justify-center text-sm text-slate-400">
        Loading portfolio data...
      </div>
    );
  }

  return (
    <div className="w-full h-72 mt-2 p-6 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Stock Performance
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Holdings over time
          </p>
        </div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
          +26.3% This Month
        </span>
      </div>

      <div className="w-full h-[calc(100%-3.5rem)]">
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
}
