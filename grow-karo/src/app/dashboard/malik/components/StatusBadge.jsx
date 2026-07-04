import { CircleDot } from "lucide-react";

export default function StatusBadge({ status }) {
  const map = {
    pending: "bg-amber-500/10 text-amber-400 ring-amber-500/30",
    approved: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
    rejected: "bg-rose-500/10 text-rose-400 ring-rose-500/30",
    open: "bg-amber-500/10 text-amber-400 ring-amber-500/30",
    in_progress: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/30",
    resolved: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
    active: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
    paused: "bg-slate-500/10 text-slate-400 ring-slate-500/30",
  };

  const label = status.replace("_", " ");

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ${map[status]}`}>
      <CircleDot className="h-3 w-3" />
      {label}
    </span>
  );
}
