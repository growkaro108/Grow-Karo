"use client";

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
import { Line } from "react-chartjs-2";

// Register the essential Chart.js modules (treeshaking keeps it as lean as possible)
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const data = {
  labels,
  datasets: [
    {
      fill: true,
      label: "Stock Value",
      data: [4200, 4500, 4300, 5100, 4900, 5400, 5700.75], // Matches your ₹5,700.75 invested total
      borderColor: "#0f172a", // Slate-900
      borderWidth: 2.5,
      pointRadius: 0, // Hides points by default for a clean look
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "#0f172a",
      pointHoverBorderColor: "#fff",
      pointHoverBorderWidth: 2,
      tension: 0.35, // Gives it that smooth premium curve
      // Creates the gradient fade dynamically under the line
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

export const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false, // Hide the box label for a clean dashboard look
    },
    tooltip: {
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
      grid: {
        display: false, // Remove vertical lines
      },
      ticks: {
        color: "#94a3b8", // Slate-400
        font: { size: 11, weight: "500" },
      },
      border: { display: false },
    },
    y: {
      grid: {
        color: "#f1f5f9", // Subtle horizontal lines
      },
      ticks: {
        color: "#94a3b8",
        font: { size: 11, weight: "500" },
      },
      border: { display: false },
    },
  },
};

export default function StockGraph() {
  return (
    <div className="w-full h-72 mt-2 p-6 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Stock Performance</h3>
          <p className="text-xs text-slate-400 font-medium">Weekly growth trajectory</p>
        </div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
          +26.3% This Month
        </span>
      </div>

      <div className="w-full h-[calc(100%-3.5rem)]">
        <Line options={options} data={data} />
      </div>
    </div>
  );
}
