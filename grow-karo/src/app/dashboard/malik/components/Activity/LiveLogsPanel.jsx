import { useState, useMemo, useCallback } from "react";
import { Search, X, AlertTriangle, FunnelPlus } from "lucide-react";
import {
  PROCESS_FILTERS,
  STATUS_FILTERS,
  TYPE_DOT,
  mapBackendLog,
} from "./activityLogShared";
import { StatusBadge } from "../StatusBadge";
import { useEventStream } from "@/api/useEventStream";

const MAX_LIVE_EVENTS = 100; // cap in-memory feed so the tab doesn't grow unbounded over a long session

export default function LiveLogsPanel({
  initialFeed = [],
  apiBaseUrl,
  getToken,
  onSelectLog,
}) {
  const [query, setQuery] = useState("");
  const [processFilter, setProcessFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

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
      const matchesProcess = processFilter === "all" || event.type === processFilter;
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      return matchesQuery && matchesProcess && matchesStatus;
    });
  }, [feed, query, processFilter, statusFilter]);

  const hasActiveFilters = query.trim() !== "" || processFilter !== "all" || statusFilter !== "all";

  const clearFilters = useCallback(() => {
    setQuery("");
    setProcessFilter("all");
    setStatusFilter("all");
  }, []);

  const statusMeta = {
    live: { dot: "bg-emerald-400 animate-pulse-dot", text: "text-emerald-400", label: "Streaming" },
    connecting: { dot: "bg-slate-500", text: "text-slate-400", label: "Connecting…" },
    reconnecting: { dot: "bg-amber-500 animate-pulse-dot", text: "text-amber-400", label: "Reconnecting…" },
  }[connectionStatus] || { dot: "bg-slate-500", text: "text-slate-400", label: "Connecting…" };

  return (
    <div className="space-y-4">
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
              <button type="button" onClick={() => setQuery("")} className="text-slate-500 hover:text-slate-300">
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
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-slate-500 font-body">
                Status
              </p>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
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
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-200">
              Live Activity
            </h3>
            <p className="text-xs text-slate-500 font-body">
              {hasActiveFilters
                ? `${filtered.length} matching event${filtered.length === 1 ? "" : "s"}`
                : "Every deposit, withdrawal, signup and referral, as it happens"}
            </p>
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-body ${statusMeta.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
            {statusMeta.label}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <AlertTriangle className="h-6 w-6 text-slate-600" />
            <p className="text-sm text-slate-400 font-body">{query ? "No activity matches these filters." : "No activity available."}</p>
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
                <span className={`h-2 w-2 shrink-0 rounded-full ${TYPE_DOT[event.type] ?? "bg-slate-500"}`} />
                <p className="min-w-0 flex-1 truncate text-sm text-slate-300 font-body">
                  <span className="font-medium text-slate-100">{event.name}</span>{" "}
                  {event.text}
                  {event.amount ? (
                    <span className="font-mono text-slate-200"> {event.amount}</span>
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
