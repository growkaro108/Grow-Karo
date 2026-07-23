import { useState } from "react";
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
  getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),
}) {
  const [activeView, setActiveView] = useState("live");
  const [selectedLog, setSelectedLog] = useState(null);

  return (
    <div className="space-y-4">
      {/* View switcher */}
      <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900/60 p-1">
        {VIEWS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveView(id)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium font-body transition-colors ${activeView === id
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
        />
      </div>
      <div className={activeView === "recent" ? "" : "hidden"}>
        <RecentLogsPanel
          apiBaseUrl={apiBaseUrl}
          getToken={getToken}
          onSelectLog={setSelectedLog}
          active={activeView === "recent"}
        />
      </div>

      {selectedLog && (
        <LogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
