import { FunnelPlus, Search, X, ChevronDown, Calendar } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

function AnimatedDropdown({
  options,
  value,
  onChange,
  accentColor = "emerald",
  label,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.id === value);

  const accentClasses = {
    emerald: {
      ring: "focus:ring-emerald-500/30 focus:border-emerald-500/50",
      active: "bg-emerald-500/15 text-emerald-400",
    },
    indigo: {
      ring: "focus:ring-indigo-500/30 focus:border-indigo-500/50",
      active: "bg-indigo-500/15 text-indigo-400",
    },
  }[accentColor];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs font-medium capitalize text-slate-300 font-body outline-none transition-colors hover:border-slate-700 ${accentClasses.ring}`}
      >
        <span className="text-slate-500 normal-case">{label}:</span>
        <span>{selected ? selected.label : "All"}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-300 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      <div
        className={`absolute left-0 z-20 mt-2 w-40 origin-top rounded-lg border border-slate-800 bg-slate-900 shadow-lg shadow-black/30 transition-all duration-200 ease-out ${
          open
            ? "translate-y-0 scale-100 opacity-100 pointer-events-auto"
            : "-translate-y-1 scale-95 opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-h-56 overflow-y-auto p-1">
          {options.map((o, idx) => (
            <button
              key={o.id ?? idx}
              type="button"
              onClick={() => {
                onChange(o.id);
                setOpen(false);
              }}
              className={`block w-full rounded-md px-3 py-1.5 text-left text-xs font-medium capitalize font-body transition-colors ${
                value === o.id
                  ? accentClasses.active
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DateRangeFilter({ fromDate, toDate, setDateFrom, setToDate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasDate = fromDate || toDate;

  const label = hasDate ? `${fromDate || "…"} → ${toDate || "…"}` : "Any time";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs font-medium text-slate-300 font-body outline-none transition-colors hover:border-slate-700 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30"
      >
        <Calendar className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-slate-500">Date:</span>
        <span className={hasDate ? "text-slate-200" : ""}>{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-300 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      <div
        className={`absolute left-0 z-20 mt-2 w-64 origin-top rounded-lg border border-slate-800 bg-slate-900 p-3 shadow-lg shadow-black/30 transition-all duration-200 ease-out ${
          open
            ? "translate-y-0 scale-100 opacity-100 pointer-events-auto"
            : "-translate-y-1 scale-95 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-2">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-500 font-body">
              From
            </p>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setDateFrom(e.target.value)}
              max={toDate || undefined}
              className="w-full rounded-md border border-slate-800 bg-slate-950/60 px-2 py-1.5 text-xs text-slate-200 font-body outline-none [color-scheme:dark] focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30"
            />
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-500 font-body">
              To
            </p>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              min={fromDate || undefined}
              className="w-full rounded-md border border-slate-800 bg-slate-950/60 px-2 py-1.5 text-xs text-slate-200 font-body outline-none [color-scheme:dark] focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30"
            />
          </div>

          {hasDate && (
            <button
              type="button"
              onClick={() => {
                setDateFrom("");
                setToDate("");
              }}
              className="mt-1 flex items-center justify-center gap-1 rounded-md border border-slate-800 py-1.5 text-[11px] font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            >
              <X className="h-3 w-3" /> Clear date
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Filter({
  PROCESS_FILTERS,
  STATUS_FILTERS,
  query,
  setQuery,
  hasActiveFilters,
  clearFilters,
  processFilter,
  setProcessFilter,
  statusFilter,
  setStatusFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setToDate,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-40 flex-1 items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 focus:border-emerald-400/50 focus:ring-emerald-500/30 focus:ring-1">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by user name…"
            className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none font-body"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <AnimatedDropdown
          label="Action"
          options={PROCESS_FILTERS}
          value={processFilter}
          onChange={setProcessFilter}
          accentColor="emerald"
        />
        {/* //if fromDate or toDate is present then show DateRangeFilter */}
        {
          <DateRangeFilter
            fromDate={dateFrom}
            toDate={dateTo}
            setDateFrom={setDateFrom}
            setToDate={setToDate}
          />
        }
        <AnimatedDropdown
          label="Status"
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
          accentColor="indigo"
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
export { Filter, AnimatedDropdown };
