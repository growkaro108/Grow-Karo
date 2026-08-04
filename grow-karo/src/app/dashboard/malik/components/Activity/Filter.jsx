import { FunnelPlus, Search, X } from "lucide-react";
import React from "react";

export default function Filter({
  PROCESS_FILTERS,
  STATUS_FILTERS,
  query,
  setQuery,
  hasActiveFilters,
  clearFilters,
  showFilters,
  setShowFilters,
  processFilter,
  setProcessFilter,
  statusFilter,
  setStatusFilter,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 sm:w-72">
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by user name…"
            className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none font-body"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-indigo-50 border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition"
        >
          <FunnelPlus className="w-5 h-5 text-slate-500" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1.5 self-start text-xs font-medium text-slate-400 hover:text-slate-200 sm:self-auto"
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      {showFilters && (
        <div
          className={`grid grid-cols-1 gap-4 sm:grid-cols-2 overflow-hidden transition-all duration-500 ease-in-out ${
            showFilters
              ? "max-h-75 opacity-100 mt-4 pointer-events-auto"
              : "max-h-0 opacity-0 mt-0 pointer-events-none"
          }`}
        >
          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-slate-500 font-body">
              Process
            </p>
            <div className="flex flex-wrap gap-2">
              {PROCESS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setProcessFilter(f.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize font-body transition-colors ${
                    processFilter === f.id
                      ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                      : "bg-slate-800/60 text-slate-400 ring-1 ring-slate-800 hover:text-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-slate-500 font-body">
              Status
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize font-body transition-colors ${
                    statusFilter === f.id
                      ? "bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30"
                      : "bg-slate-800/60 text-slate-400 ring-1 ring-slate-800 hover:text-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
