import { useCallback, useState } from "react";
import { Radio, History } from "lucide-react";
import LiveLogsPanel from "./LiveLogsPanel";
import RecentLogsPanel from "./RecentLogsPanel";
import LogDetailsModal from "./LogDetailsModal";
// import LiveLogsPanel from "./LiveLogsPanel";
// import RecentLogsPanel from "./RecentLogsPanel";
// import LogDetailsModal from "./LogDetailsModal";

const VIEWS = [
  { id: "live", label: "Live", icon: Radio },
  { id: "recent", label: "Recent", icon: History },
];

export default function ActivityTab({
  feed: initialFeed = [],
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090",
  getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null,
}) {
  const [activeView, setActiveView] = useState("live");
  const [selectedLog, setSelectedLog] = useState(null);
  const [query, setQuery] = useState("");
  const [processFilter, setProcessFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);

  const hasActiveFilters =
    query.trim() !== "" ||
    processFilter !== "all" ||
    statusFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  const resetPage = useCallback(() => {
    setPage(0);
  }, []);

  const handleQueryChange = useCallback((value) => {
    setQuery(value);
    resetPage();
  }, [resetPage]);

  const handleProcessFilterChange = useCallback((value) => {
    setProcessFilter(value);
    resetPage();
  }, [resetPage]);

  const handleStatusFilterChange = useCallback((value) => {
    setStatusFilter(value);
    resetPage();
  }, [resetPage]);

  const handleDateFromChange = useCallback((value) => {
    setDateFrom(value);
    resetPage();
  }, [resetPage]);

  const handleDateToChange = useCallback((value) => {
    setDateTo(value);
    resetPage();
  }, [resetPage]);

  const clearFilters = useCallback(() => {
    setQuery("");
    setProcessFilter("all");
    setStatusFilter("all");
    setShowFilters(false);
    setDateFrom("");
    setDateTo("");
    resetPage();
  }, [resetPage]);

  return (
    <div className="space-y-4">
      {/* View switcher */}
      <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900/60 p-1">
        {VIEWS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveView(id)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium font-body transition-colors ${
              activeView === id
                ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Both panels stay mounted -- toggled with `hidden` rather than
          conditionally rendered -- so the live SSE connection and the
          Recent tab's filters/page don't reset every time you switch. */}
      <div className={activeView === "live" ? "" : "hidden"}>
        <LiveLogsPanel
          initialFeed={initialFeed}
          apiBaseUrl={apiBaseUrl}
          getToken={getToken}
          onSelectLog={setSelectedLog}
          query={query}
          setQuery={handleQueryChange}
          processFilter={processFilter}
          setProcessFilter={handleProcessFilterChange}
          statusFilter={statusFilter}
          setStatusFilter={handleStatusFilterChange}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          hasActiveFilters={hasActiveFilters}
          clearFilters={clearFilters}
        />
      </div>
      <div className={activeView === "recent" ? "" : "hidden"}>
        <RecentLogsPanel
          apiBaseUrl={apiBaseUrl}
          getToken={getToken}
          onSelectLog={setSelectedLog}
          active={activeView === "recent"}
          query={query}
          setQuery={handleQueryChange}
          processFilter={processFilter}
          setProcessFilter={handleProcessFilterChange}
          statusFilter={statusFilter}
          setStatusFilter={handleStatusFilterChange}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          hasActiveFilters={hasActiveFilters}
          clearFilters={clearFilters}
          dateFrom={dateFrom}
          setDateFrom={handleDateFromChange}
          dateTo={dateTo}
          setDateTo={handleDateToChange}
          page={page}
          setPage={setPage}
        />
      </div>

      {selectedLog && (
        <LogDetailsModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
