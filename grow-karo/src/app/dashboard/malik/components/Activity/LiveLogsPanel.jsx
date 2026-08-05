import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { STATUS_FILTERS, TYPE_DOT, mapBackendLog } from "./activityLogShared";
import { StatusBadge } from "../StatusBadge";
import { useEventStream } from "@/api/useEventStream";
import { Filter } from "./Filter";

const MAX_LIVE_EVENTS = 100; // cap in-memory feed so the tab doesn't grow unbounded over a long session

export default function LiveLogsPanel({
  initialFeed = [],
  apiBaseUrl,
  getToken,
  onSelectLog,
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
  PROCESS_FILTERS,
}) {
  const { items: feed, connectionStatus } = useEventStream({
    endpoint: `${apiBaseUrl}/api/admin/activity-logs/stream`,
    eventName: "activity",
    mapEvent: mapBackendLog,
    initialItems: initialFeed,
    maxItems: MAX_LIVE_EVENTS,
    getToken,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return feed.filter((event) => {
      const matchesQuery = q === "" || event.name?.toLowerCase().includes(q);
      const matchesProcess =
        processFilter === "all" ||
        event.type?.toLowerCase() === processFilter.toLowerCase();
      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter;
      return matchesQuery && matchesProcess && matchesStatus;
    });
  }, [feed, query, processFilter, statusFilter]);

  const statusMeta = {
    live: {
      dot: "bg-emerald-400 animate-pulse-dot",
      text: "text-emerald-400",
      label: "Streaming",
    },
    connecting: {
      dot: "bg-slate-500",
      text: "text-slate-400",
      label: "Connecting…",
    },
    reconnecting: {
      dot: "bg-amber-500 animate-pulse-dot",
      text: "text-amber-400",
      label: "Reconnecting…",
    },
  }[connectionStatus] || {
    dot: "bg-slate-500",
    text: "text-slate-400",
    label: "Connecting…",
  };

  return (
    <div className="space-y-4">
      <Filter
        PROCESS_FILTERS={PROCESS_FILTERS}
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
              Live Activity
            </h3>
            <p className="text-xs text-slate-500 font-body">
              {hasActiveFilters
                ? `${filtered.length} matching event${filtered.length === 1 ? "" : "s"}`
                : "Every deposit, withdrawal, signup and more action, as it happens"}
            </p>
          </div>
          <span
            className={`flex items-center gap-1.5 text-xs font-body ${statusMeta.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
            {statusMeta.label}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <AlertTriangle className="h-6 w-6 text-slate-600" />
            <p className="text-sm text-slate-400 font-body">
              {query
                ? "No activity matches these filters."
                : "No activity available."}
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="scrollbar-thin max-h-[65vh] space-y-0 overflow-y-auto">
            {filtered.map((event, i) => (
              <div
                key={event.id}
                onClick={() => onSelectLog(event)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelectLog(event);
                }}
                className={`animate-feed-in flex cursor-pointer items-center gap-4 border-slate-800/60 px-1 py-3 transition-colors hover:bg-slate-800/40 ${i !== filtered.length - 1 ? "border-b" : ""}`}
              >
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
      </div>
    </div>
  );
}
