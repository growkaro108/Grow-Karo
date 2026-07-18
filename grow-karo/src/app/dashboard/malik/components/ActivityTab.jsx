import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Search, X, AlertTriangle, FunnelPlus } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

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

// Maps backend ActivityType enum -> the short "type" used by this UI
const BACKEND_TYPE_TO_UI_TYPE = {
  WITHDRAWAL_REQUESTED: "withdrawal",
  WITHDRAWAL_APPROVED: "withdrawal",
  WITHDRAWAL_REJECTED: "withdrawal",
  DEPOSIT_REQUESTED: "deposit",
  DEPOSIT_COMPLETED: "deposit",
  ACCOUNT_CREATED: "signup",
  KYC_SUBMITTED: "kyc",
  KYC_APPROVED: "kyc",
  REFERRAL_CREATED: "referral",
};

// Maps whatever status string the backend metadata carries -> the UI's status vocabulary
function normalizeStatus(rawStatus) {
  if (!rawStatus) return undefined;
  const s = rawStatus.toString().toLowerCase();
  if (["completed", "approved", "success", "successful"].includes(s)) return "completed";
  if (["pending", "requested"].includes(s)) return "pending";
  if (["processing", "in_progress"].includes(s)) return "processing";
  return s;
}

function formatTime(isoString) {
  try {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// Converts a raw ActivityLog record (as sent by Spring Boot, over REST or SSE)
// into the flat shape this component's UI expects.
function mapBackendLog(log) {
  let metadata = {};
  if (log.metadata) {
    try {
      metadata = typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata;
    } catch {
      metadata = {};
    }
  }

  return {
    id: log.id,
    name: log.actorName,
    text: log.description?.replace(log.actorName, "").trim() || log.description,
    type: BACKEND_TYPE_TO_UI_TYPE[log.type] ?? "signup",
    status: normalizeStatus(metadata.status),
    amount:
      metadata.amount !== undefined
        ? `₹${Number(metadata.amount).toLocaleString("en-IN")}`
        : undefined,
    time: formatTime(log.createdAt),
    createdAt: log.createdAt,
  };
}

const MAX_LIVE_EVENTS = 300; // cap in-memory feed so the tab doesn't grow unbounded over a long session

export default function ActivityTab({
  feed: initialFeed = [],
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090",
  getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),
}) {
  const [feed, setFeed] = useState(initialFeed);
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // connecting | live | reconnecting
  const [query, setQuery] = useState("");
  const [processFilter, setProcessFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const seenIds = useRef(new Set(initialFeed.map((e) => e.id)));

  // --- Live stream subscription ---
  useEffect(() => {
    const token = getToken();
    const url = `${apiBaseUrl}/api/admin/activity-logs/stream${token ? `?token=${encodeURIComponent(token)}` : ""
      }`;

    const es = new EventSource(url);

    es.onopen = () => setConnectionStatus("live");
    es.onerror = () => setConnectionStatus("reconnecting"); // EventSource auto-retries on its own

    es.addEventListener("activity", (e) => {
      try {
        if (e.data) {
          const raw = JSON.parse(e.data);
          const mapped = mapBackendLog(raw);

          if (seenIds.current.has(mapped.id)) return; // dedupe against initial page / re-deliveries
          seenIds.current.add(mapped.id);

          setFeed((prev) => [mapped, ...prev].slice(0, MAX_LIVE_EVENTS));
        } else {
          console.log("No data received from server");
        }
      } catch {
        // ignore malformed event, don't crash the stream handler
      }
    });

    return () => es.close();
  }, [apiBaseUrl, getToken]);

  // --- Filtering (memoized so it only recomputes when inputs actually change) ---
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
  }[connectionStatus];

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
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 overflow-hidden transition-all duration-500 ease-in-out ${showFilters
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
              Full Activity Ledger
            </h3>
            <p className="text-xs text-slate-500 font-body">
              {hasActiveFilters
                ? `${filtered.length} matching event${filtered.length === 1 ? "" : "s"}`
                : "Every deposit, withdrawal, signup and referral, in order"}
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