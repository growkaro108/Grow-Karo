import { useMemo } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from "lucide-react";
import {
  PROCESS_FILTERS,
  STATUS_FILTERS,
  TYPE_DOT,
  mapBackendLog,
  formatDate,
} from "./activityLogShared";
import { StatusBadge } from "../StatusBadge";
import { usePaginatedFetch } from "./usePaginatedFetch";
import Filter from "./Filter";

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
  active = true,
  query,
  setQuery,
  processFilter,
  setProcessFilter,
  statusFilter,
  setStatusFilter,
  showFilters,
  setShowFilters,
  hasActiveFilters,
  clearFilters,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  page,
  setPage,
}) {
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
    [page, dateFrom, dateTo, processFilter, statusFilter, query],
  );

  const { items, totalPages, totalElements, status, error, refetch } =
    usePaginatedFetch({
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
      const matchesProcess =
        processFilter === "all" || event.type === processFilter;
      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter;
      return matchesQuery && matchesProcess && matchesStatus;
    });
  }, [items, query, processFilter, statusFilter]);

  //crete dynamic filters by status
  const dynamicStatusFilters = useMemo(() => {
    // 1. Extract unique types from filteredItems using a local Set
    const uniqueTypes = [...new Set(filteredItems.map((item) => item.type))];

    // 2. Format unique types into dropdown options
    const dynamicOptions = uniqueTypes.map((type) => ({
      value: type,
      label: type,
    }));

    // 3. Combine static "All" filter with the unique dynamic options
    return [...PROCESS_FILTERS, ...dynamicOptions];
  }, [filteredItems]);
  const isLoading = status === "loading";

  return (
    <div className="space-y-4">
      <Filter
        PROCESS_FILTERS={dynamicStatusFilters}
        STATUS_FILTERS={STATUS_FILTERS}
        query={query}
        setQuery={setQuery}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        processFilter={processFilter}
        setProcessFilter={setProcessFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-200">
              Recent Activity
            </h3>
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
            <RotateCw
              className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {status === "error" ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <p className="text-sm text-slate-400 font-body">
              Couldn&apos;t load activity
              {error?.message ? `: ${error.message}` : "."}
            </p>
            <button
              type="button"
              onClick={refetch}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              Try again
            </button>
          </div>
        ) : !isLoading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <AlertTriangle className="h-6 w-6 text-slate-600" />
            <p className="text-sm text-slate-400 font-body">
              {query
                ? "No activity matches these filters."
                : "No activity available."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div
            className={`space-y-0 transition-opacity ${isLoading ? "opacity-50" : "opacity-100"}`}
          >
            {filteredItems.map((event, i) => (
              <div
                key={i + 1}
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
                <span className="font-mono text-[11px] text-slate-600 w-16 shrink-0">
                  {event.time}
                </span>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${TYPE_DOT[event.type] ?? "bg-slate-500"}`}
                />
                <p className="min-w-0 flex-1 truncate text-sm text-slate-300 font-body">
                  <span className="font-medium text-slate-100">
                    {event.name}
                  </span>{" "}
                  {event.text}
                  {event.amount ? (
                    <span className="font-mono text-slate-200">
                      {" "}
                      {event.amount}
                    </span>
                  ) : null}
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
