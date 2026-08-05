import { useCallback, useEffect, useState } from "react";
import { Radio, History } from "lucide-react";
import { getAllLogTypes } from "../../../../../../services/malikService";
import { PROCESS_FILTERS } from "./activityLogShared";
import dynamic from "next/dynamic";
import TabLoader from "@/loader/TabLoader";
const LiveLogsPanel = dynamic(() => import("./LiveLogsPanel"), {
  loading: () => <TabLoader />,
  ssr: false,
});
const RecentLogsPanel = dynamic(() => import("./RecentLogsPanel"), {
  loading: () => <TabLoader />,
  ssr: false,
});
const LogDetailsModal = dynamic(() => import("./LogDetailsModal"), {
  loading: () => <TabLoader />,
  ssr: false,
});

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
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  //get all distint type from db
  const [processFilters, setProcessFilters] = useState(PROCESS_FILTERS);
  //active process filter
  const [processFilter, setProcessFilter] = useState("all");

  //check if any filter is active
  const hasActiveFilters =
    query.trim() !== "" ||
    processFilter !== "all" ||
    statusFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  const resetPage = useCallback(() => {
    setPage(0);
  }, []);

  const handleQueryChange = useCallback(
    (value) => {
      setQuery(value);
      resetPage();
    },
    [resetPage],
  );

  const handleProcessFilterChange = useCallback(
    (value) => {
      setProcessFilter(value);
      resetPage();
    },
    [resetPage],
  );

  const handleStatusFilterChange = useCallback(
    (value) => {
      setStatusFilter(value);
      resetPage();
    },
    [resetPage],
  );

  const handleDateFromChange = useCallback(
    (value) => {
      setDateFrom(value);
      resetPage();
    },
    [resetPage],
  );

  const handleDateToChange = useCallback(
    (value) => {
      setDateTo(value);
      resetPage();
    },
    [resetPage],
  );

  const clearFilters = useCallback(() => {
    setQuery("");
    setProcessFilter("all");
    setStatusFilter("all");
    setShowFilters(false);
    setDateFrom("");
    setDateTo("");
    resetPage();
  }, [resetPage]);

  //get all filter options from db
  useEffect(() => {
    const getAllType = async () => {
      const response = await getAllLogTypes();
      const data = response.map((item) => ({
        id: item,
        label: item.toUpperCase(),
      }));

      setProcessFilters((prev) => {
        const existingIds = new Set(prev.map((f) => f.id));
        return [...prev, ...data.filter((d) => !existingIds.has(d.id))];
      });
    };
    getAllType();
  }, []);

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

      {activeView === "live" ? (
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
          PROCESS_FILTERS={processFilters}
        />
      ) : (
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
          PROCESS_FILTERS={processFilters}
        />
      )}

      {selectedLog && (
        <LogDetailsModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
