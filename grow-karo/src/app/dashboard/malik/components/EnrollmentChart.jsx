"use client";

import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  CalendarDays,
  TrendingUp,
  Layers,
  Flame,
  ChevronDown,
} from "lucide-react";
import { currency } from "./utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

function parseEnrollmentDate(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (!s || s === "-" || s === "—") return null;

  // Format: YYYY-MM-DD
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(s)) {
    const parts = s.slice(0, 10).split(/[-/]/);
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return isNaN(d.getTime()) ? null : d;
  }

  // Format: DD-MM-YYYY or DD/MM/YYYY
  const parts = s.split(/[-/]/);
  if (parts.length === 3 && parts[2].length === 4) {
    const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export default function EnrollmentChart({
  schemes = [],
  view,
  selectedScheme: externalScheme,
  onSchemeChange,
  showSchemeFilter = true,
  title = "Investment Timeline",
  subtitle = "Capital enrolled over time by enrollment date",
}) {
  const [internalScheme, setInternalScheme] = useState("all");

  const activeScheme =
    externalScheme !== undefined ? externalScheme : internalScheme;

  const handleSchemeChange = (schemeName) => {
    if (onSchemeChange) {
      onSchemeChange(schemeName);
    } else {
      setInternalScheme(schemeName);
    }
  };

  // Derive unique scheme names for dropdown filter
  const schemeOptions = useMemo(() => {
    const set = new Set();
    schemes.forEach((s) => {
      if (s?.name) set.add(s.name);
    });
    return Array.from(set).sort();
  }, [schemes]);

  // Filter schemes if a specific scheme is selected
  const filteredSchemes = useMemo(() => {
    if (!activeScheme || activeScheme === "all") return schemes;
    return schemes.filter((s) => s.name === activeScheme);
  }, [schemes, activeScheme]);

  // Aggregate investedAmount and enrollment count grouped by enrollmentDate
  const { timeline, totalAmount, totalCount, peakDay } = useMemo(() => {
    const map = new Map();

    filteredSchemes.forEach((s) => {
      const d = parseEnrollmentDate(s.enrolledOn);
      if (!d) return;

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${y}-${m}-${day}`;

      const existing = map.get(key) || {
        key,
        dateObj: d,
        displayDate: d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        shortDate: d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        amount: 0,
        count: 0,
      };

      existing.amount += Number(s.investedAmount || 0);
      existing.count += 1;
      map.set(key, existing);
    });

    const sorted = Array.from(map.values()).sort(
      (a, b) => a.dateObj.getTime() - b.dateObj.getTime(),
    );

    let sumAmount = 0;
    let sumCount = 0;
    let maxDay = null;

    sorted.forEach((item) => {
      sumAmount += item.amount;
      sumCount += item.count;
      if (!maxDay || item.amount > maxDay.amount) {
        maxDay = item;
      }
    });

    return {
      timeline: sorted,
      totalAmount: sumAmount,
      totalCount: sumCount,
      peakDay: maxDay,
    };
  }, [filteredSchemes]);

  const chartData = useMemo(() => {
    return {
      labels: timeline.map((d) => d.shortDate),
      datasets: [
        {
          label: "Invested Amount",
          data: timeline.map((d) => d.amount),
          borderColor: "#C9A66B",
          borderWidth: 2.5,
          pointRadius: timeline.length === 1 ? 5 : 3,
          pointHoverRadius: 6,
          pointBackgroundColor: "#E0C58F",
          pointBorderColor: "#1e1e2d",
          pointBorderWidth: 2,
          tension: 0.35,
          fill: true,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return "rgba(201, 166, 107, 0.15)";
            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, "rgba(201, 166, 107, 0.35)");
            gradient.addColorStop(0.7, "rgba(201, 166, 107, 0.08)");
            gradient.addColorStop(1, "rgba(201, 166, 107, 0)");
            return gradient;
          },
        },
      ],
    };
  }, [timeline]);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "#0b0f19",
          borderColor: "rgba(255, 255, 255, 0.15)",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 12,
          titleColor: "#f1f5f9",
          titleFont: { size: 12, weight: "bold" },
          bodyColor: "#cbd5e1",
          bodyFont: { size: 11 },
          displayColors: false,
          callbacks: {
            title: (items) => {
              const idx = items[0]?.dataIndex;
              return timeline[idx]?.displayDate || "";
            },
            label: (item) => {
              const idx = item.dataIndex;
              const point = timeline[idx];
              const formattedAmt = `₹${Number(point?.amount || 0).toLocaleString("en-IN")}`;
              const countText = `${point?.count || 0} enrollment${point?.count !== 1 ? "s" : ""}`;
              return [
                `Amount: ${formattedAmt}`,
                `Enrollments: ${countText}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(255, 255, 255, 0.04)",
          },
          border: { display: false },
          ticks: {
            color: "#64748b",
            font: { size: 10 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
          },
        },
        y: {
          grid: {
            color: "rgba(255, 255, 255, 0.05)",
          },
          border: { display: false },
          ticks: {
            color: "#64748b",
            font: { size: 10 },
            callback: (v) => currency(Number(v)),
          },
        },
      },
    };
  }, [timeline]);

  const isAll = !activeScheme || activeScheme === "all";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur h-full flex flex-col justify-between">
      {/* Decorative ambient glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#C9A66B]/10 blur-3xl" />

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#C9A66B]/15 text-[#E0C58F] ring-1 ring-[#C9A66B]/30">
                <TrendingUp size={15} />
              </span>
              <h3 className="text-sm font-semibold text-slate-100 tracking-tight font-display">
                {title}
              </h3>

              {showSchemeFilter && schemeOptions.length > 0 && (
                <div className="relative inline-flex items-center">
                  <select
                    value={activeScheme || "all"}
                    onChange={(e) => handleSchemeChange(e.target.value)}
                    aria-label="Filter timeline by scheme"
                    className="appearance-none rounded-full bg-white/[0.06] pl-2.5 pr-6 py-0.5 text-[11px] font-medium text-slate-300 ring-1 ring-white/15 outline-none hover:bg-white/10 hover:text-white transition cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900 text-slate-200">
                      All Schemes ({schemes.length})
                    </option>
                    {schemeOptions.map((name) => (
                      <option
                        key={name}
                        value={name}
                        className="bg-slate-900 text-slate-200"
                      >
                        {name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={11}
                    className="pointer-events-none absolute right-2 text-slate-400"
                  />
                </div>
              )}

              {!showSchemeFilter && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-slate-300 ring-1 ring-white/10">
                  <Layers size={10} className="text-[#C9A66B]" />
                  {isAll ? "All Schemes" : activeScheme}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500 font-body">
              {subtitle}
            </p>
          </div>

          {/* Quick summary stats */}
          <div className="flex flex-wrap items-center gap-2">
            {peakDay && (
              <div className="flex items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                <Flame size={12} />
                <span>
                  Peak: {currency(peakDay.amount)} ({peakDay.shortDate})
                </span>
              </div>
            )}
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold tabular-nums text-white">
              Total: <span className="text-[#E0C58F]">{currency(totalAmount)}</span>
              <span className="ml-1 text-[11px] font-normal text-slate-400">
                ({totalCount} enrollment{totalCount !== 1 ? "s" : ""})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-4 h-56 sm:h-60 w-full">
        {timeline.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-slate-500">
              <CalendarDays size={18} />
            </span>
            <p className="mt-2 text-xs font-medium text-slate-300">
              No enrollment date records
            </p>
            <p className="mt-0.5 max-w-xs text-[11px] text-slate-500">
              Enrollments for the selected scheme will appear here with dates
              and amounts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
