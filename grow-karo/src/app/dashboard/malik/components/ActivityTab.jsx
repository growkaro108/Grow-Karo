import { useState } from "react";
import { Search, X, AlertTriangle, FunnelPlus } from "lucide-react";
import StatusBadge from "./StatusBadge";



/* ---------------------------------- */
/* Activity Log tab (full ledger)      */
/* ---------------------------------- */
const PROCESS_FILTERS = [
  { id: "all", label: "All" },
  { id: "deposit", label: "Deposit" },
  { id: "withdrawal", label: "Withdrawal" },
  { id: "signup", label: "Signup" },
  { id: "kyc", label: "KYC" },
  { id: "referral", label: "Referral" },
];

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "completed", label: "Completed" },
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
];

const TYPE_DOT = {
  withdrawal: "bg-amber-500",
  deposit: "bg-emerald-500",
  signup: "bg-indigo-500",
  kyc: "bg-indigo-500",
  referral: "bg-indigo-500",
};

export default function ActivityTab({ feed }) {
  const [query, setQuery] = useState("");
  const [processFilter, setProcessFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  //work of this function is to filter the feed based on the query, processFilter and statusFilter.
  //  If the query is empty, it will return all the events. If the processFilter is "all", it will return all the events.
  //  If the statusFilter is "all", it will return all the events. Otherwise, 
  // it will return only the events that match the query, processFilter and statusFilter.
  const filtered = feed.filter((event) => {
    const matchesQuery =
      query.trim() === "" ||
      event.name.toLowerCase().includes(query.trim().toLowerCase());
    const matchesProcess =
      processFilter === "all" || event.type === processFilter;
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;
    return matchesQuery && matchesProcess && matchesStatus;
  });

  const hasActiveFilters =
    query.trim() !== "" || processFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setProcessFilter("all");
    setStatusFilter("all");
  };

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
              <button
                onClick={() => setQuery("")}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-indigo-50 border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition"
          >
            <FunnelPlus className="w-5 h-5 text-slate-500" />(
            {showFilters ? "Hide Filters" : "Show Filters"})
          </button>

          {hasActiveFilters && (
            <button
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
            {/* Process Filters Column */}
            <div>
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-slate-500 font-body">
                Process
              </p>
              <div className="flex flex-wrap gap-2">
                {PROCESS_FILTERS.map((f) => (
                  <button
                    key={f.id}
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

            {/* Status Filters Column */}
            <div>
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-slate-500 font-body">
                Status
              </p>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.id}
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

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-200">
              Full Activity Ledger
            </h3>
            <p className="text-xs text-slate-500 font-body">
              {hasActiveFilters
                ? `${filtered.length} matching event${filtered.length === 1 ? "" : "s"}`
                : "Every deposit, withdrawal, signup and referral, in order"}
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-body">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />{" "}
            Streaming
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <AlertTriangle className="h-6 w-6 text-slate-600" />
            <p className="text-sm text-slate-400 font-body">
              No activity matches these filters.
            </p>
            <button
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
                className={`animate-feed-in flex items-center gap-4 border-slate-800/60 px-1 py-3 ${i !== filtered.length - 1 ? "border-b" : ""}`}
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
