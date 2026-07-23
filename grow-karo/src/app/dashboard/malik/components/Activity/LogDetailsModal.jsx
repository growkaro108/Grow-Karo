import { useEffect } from "react";
import { X, Copy } from "lucide-react";
import { StatusBadge } from "../StatusBadge";

function Row({ label, value, mono = false }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-start sm:gap-4">
      <span className="w-32 shrink-0 text-[11px] uppercase tracking-wide text-slate-500 font-body">
        {label}
      </span>
      <span
        className={`min-w-0 flex-1 wrap-break-word text-sm text-slate-200 ${mono ? "font-mono text-[12px] text-slate-300" : "font-body"
          }`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Full-detail view for a single activity log entry. Opened when a row in
 * ActivityTab is clicked. Pass the already-mapped log object (the shape
 * produced by mapBackendLog), which includes `raw` (the original backend
 * record) and `metadata` (parsed metadata JSON) for anything not surfaced
 * in the summary row.
 */
export default function LogDetailsModal({ log, onClose }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!log) return null;

  const rawJson = JSON.stringify(log.raw ?? log, null, 2);

  const copyRaw = () => {
    if (navigator?.clipboard) navigator.clipboard.writeText(rawJson);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-100">
              Log details
            </h3>
            <p className="text-xs text-slate-500 font-body">ID: {log.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/60">
          <Row label="User" value={log.name} />
          <Row label="Description" value={log.text} />
          <Row
            label="Type"
            value={
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono uppercase text-slate-400">
                {log.type}
              </span>
            }
          />
          <Row label="Status" value={log.status && <StatusBadge status={log.status} />} />
          <Row label="Amount" value={log.amount} mono />
          <Row label="Time" value={log.time} mono />
          <Row label="Created at" value={log.createdAt} mono />
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-body">
              Raw record
            </p>
            <button
              type="button"
              onClick={copyRaw}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200"
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
          </div>
          <pre className="max-h-56 overflow-auto rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-400 scrollbar-thin">
            {rawJson}
          </pre>
        </div>
      </div>
    </div>
  );
}
