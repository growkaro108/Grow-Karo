import { useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Search, X, FunnelPlus, RotateCw } from "lucide-react";
import {
  PROCESS_FILTERS,
  STATUS_FILTERS,
  TYPE_DOT,
  mapBackendLog,
  formatDate,
} from "./activityLogShared";
import { StatusBadge } from "../StatusBadge";
import { usePaginatedFetch } from "./usePaginatedFetch";

const PAGE_SIZE = 25;

// Turns a <input type="date"> value ("YYYY-MM-DD") into start/end-of-day
// ISO strings, since most backends store timestamps, not bare dates.
function toStartOfDayIso(dateStr) {
  if (!dateStr) return undefined;
  return new Date(`${dateStr}T00:00:00`).toISOString();
}
function toEndOfDayIso(dateStr) {
  if (!dateStr) return undefined;
  return new Date(`${dateStr}T23:59:59.999`).toISOString();
}

export default function RecentLogsPanel({
  apiBaseUrl,
  getToken,
  onSelectLog,
  active = true, // only fetch while this tab is actually visible
}) {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [processFilter, setProcessFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState(""); // "YYYY-MM-DD"
  const [dateTo, setDateTo] = useState("");

  // NOTE: param names (page/size/sort/from/to/type/status/query) assume a
  // Spring Data-style admin endpoint. Rename these to match your actual
  // controller's @RequestParam names if they differ.
  const params = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      sort: "createdAt,desc", // newest first
      from: toStartOfDayIso(dateFrom),
      to: toEndOfDayIso(dateTo),
      type: processFilter !== "all" ? processFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      query: query.trim() || undefined,
    }),
    [page, dateFrom, dateTo, processFilter, statusFilter, query]
  );

  const { items, totalPages, totalElements, status, error, refetch } = usePaginatedFetch({
    endpoint: `${apiBaseUrl}/api/admin/activity-logs`,
    params,
    mapItem: mapBackendLog,
    getToken,
    enabled: active,
  });

  // console.log(items);

  // Client-side safety net over whatever page came back: if the backend
  // doesn't actually support query/type/status params (or uses different
  // names), search/filtering still works against the fetched page. This
  // mirrors LiveLogsPanel's filtering so behavior is consistent everywhere.
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((event) => {
      const matchesQuery = q === "" || event.name?.toLowerCase().includes(q);
      const matchesProcess = processFilter === "all" || event.type === processFilter;
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      return matchesQuery && matchesProcess && matchesStatus;
    });
  }, [items, query, processFilter, statusFilter]);

  const hasActiveFilters =
    query.trim() !== "" || processFilter !== "all" || statusFilter !== "all" || dateFrom !== "" || dateTo !== "";

  const clearFilters = () => {
    setQuery("");
    setProcessFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  };

  // Any filter change should reset back to page 0
  const updateAndResetPage = (setter) => (value) => {
    setter(value);
    setPage(0);
  };

  const isLoading = status === "loading";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 sm:w-72">
            <Search className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              value={query}
              onChange={(e) => updateAndResetPage(setQuery)(e.target.value)}
              placeholder="Filter by user name…"
              className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none font-body"
            />
            {query && (
              <button type="button" onClick={() => updateAndResetPage(setQuery)("")} className="text-slate-500 hover:text-slate-300">
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
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 overflow-hidden transition-all duration-500 ease-in-out ${showFilters
              ? "max-h-125 opacity-100 mt-4 pointer-events-auto"
              : "max-h-0 opacity-0 mt-0 pointer-events-none"
              }`}
          >
            <div>
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-slate-500 font-body">Process</p>
              <div className="flex flex-wrap gap-2">
                {PROCESS_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => updateAndResetPage(setProcessFilter)(f.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize font-body transition-colors ${processFilter === f.id
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
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-slate-500 font-body">Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => updateAndResetPage(setStatusFilter)(f.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize font-body transition-colors ${statusFilter === f.id
                      ? "bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30"
                      : "bg-slate-800/60 text-slate-400 ring-1 ring-slate-800 hover:text-slate-200"
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range filter */}
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-slate-500 font-body">Date range</p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5">
                  <span className="text-[11px] text-slate-500 font-body">From</span>
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(e) => updateAndResetPage(setDateFrom)(e.target.value)}
                    className="bg-transparent text-xs text-slate-200 outline-none scheme-dark font-body"
                  />
                </label>
                <label className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5">
                  <span className="text-[11px] text-slate-500 font-body">To</span>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => updateAndResetPage(setDateTo)(e.target.value)}
                    className="bg-transparent text-xs text-slate-200 outline-none scheme-dark font-body"
                  />
                </label>
                {(dateFrom || dateTo) && (
                  <button
                    type="button"
                    onClick={() => {
                      updateAndResetPage(setDateFrom)("");
                      updateAndResetPage(setDateTo)("");
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-200"
                  >
                    <X className="h-3 w-3" /> Clear dates
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-200">Recent Activity</h3>
            <p className="text-xs text-slate-500 font-body">
              {status === "success"
                ? hasActiveFilters
                  ? `${filteredItems.length} matching on this page · ${totalElements} total`
                  : `${totalElements} event${totalElements === 1 ? "" : "s"} · newest first`
                : "Past activity, newest first"}
            </p>
          </div>
          <button
            type="button"
            onClick={refetch}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 disabled:opacity-50"
          >
            <RotateCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {status === "error" ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <p className="text-sm text-slate-400 font-body">
              Couldn&apos;t load activity{error?.message ? `: ${error.message}` : "."}
            </p>
            <button type="button" onClick={refetch} className="text-xs font-medium text-emerald-400 hover:text-emerald-300">
              Try again
            </button>
          </div>
        ) : !isLoading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <AlertTriangle className="h-6 w-6 text-slate-600" />
            <p className="text-sm text-slate-400 font-body">{query ? "No activity matches these filters." : "No activity available."}</p>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="text-xs font-medium text-emerald-400 hover:text-emerald-300">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className={`space-y-0 transition-opacity ${isLoading ? "opacity-50" : "opacity-100"}`}>
            {filteredItems.map((event, i) => (
              <div
                key={event.id}
                onClick={() => onSelectLog(event)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelectLog(event);
                }}
                className={`flex cursor-pointer items-center gap-4 border-slate-800/60 px-1 py-3 transition-colors hover:bg-slate-800/40 ${i !== items.length - 1 ? "border-b" : ""}`}
              >
                <span className="hidden font-mono text-[11px] text-slate-600 w-24 shrink-0 sm:inline">
                  {formatDate(event.createdAt)}
                </span>
                <span className="font-mono text-[11px] text-slate-600 w-16 shrink-0">{event.time}</span>
                <span className={`h-2 w-2 shrink-0 rounded-full ${TYPE_DOT[event.type] ?? "bg-slate-500"}`} />
                <p className="min-w-0 flex-1 truncate text-sm text-slate-300 font-body">
                  <span className="font-medium text-slate-100">{event.name}</span>{" "}
                  {event.text}
                  {event.amount ? <span className="font-mono text-slate-200"> {event.amount}</span> : null}
                </p>
                <span className="hidden shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono uppercase text-slate-500 sm:inline">
                  {event.type}
                </span>
                {event.status && <StatusBadge status={event.status} />}
              </div>
            ))}
          </div>
        )}

        {/* Pagination footer */}
        {status === "success" && totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="text-xs text-slate-500 font-body">
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}