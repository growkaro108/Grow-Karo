import { useState } from "react";
import { MessageSquare, ChevronDown } from "lucide-react";
import StatusBadge from "./StatusBadge";
import PriorityDot from "./PriorityDot";

export default function IssuesTab({ issues, onResolve }) {
  const [openId, setOpenId] = useState(issues[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {issues.map((issue) => {
        const expanded = openId === issue.id;
        return (
          <div key={issue.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
            <button
              onClick={() => setOpenId(expanded ? null : issue.id)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="hidden shrink-0 rounded-lg bg-slate-800 px-2 py-1 font-mono text-[11px] text-slate-500 sm:inline">{issue.id}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-200 font-body">{issue.subject}</p>
                  <p className="truncate text-xs text-slate-500 font-body">{issue.user} · {issue.createdAt}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <PriorityDot priority={issue.priority} />
                <StatusBadge status={issue.status} />
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
              </div>
            </button>

            {expanded && (
              <div className="animate-fade-slide-in border-t border-slate-800 px-5 py-4">
                <p className="mb-4 text-sm leading-relaxed text-slate-300 font-body">{issue.message}</p>
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-800/40 px-3 py-2">
                  <MessageSquare className="h-4 w-4 shrink-0 text-slate-500" />
                  <input
                    placeholder="Write a reply to the user…"
                    className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none font-body"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-lg bg-indigo-500/10 px-3.5 py-2 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/30 hover:bg-indigo-500/20 transition-colors">
                    Send Reply
                  </button>
                  {issue.status !== "resolved" && (
                    <button
                      onClick={() => onResolve(issue.id)}
                      className="rounded-lg bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
