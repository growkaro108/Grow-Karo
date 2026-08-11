import React from "react";
import { ShieldCheck, Users, Pencil, Trash2, Phone } from "lucide-react";
import { currency } from "../../utils";
import { StatusBadge } from "../StatusBadge";

export function RemitterTrackerCard({ tracker, onEdit, onRemove }) {
  const pct = Math.min(
    100,
    Math.round((tracker.totalPaid / tracker.allocationLimit) * 100),
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between hover:border-slate-700 transition-colors">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-mono  font-medium flex items-center gap-1  text-slate-100">
              <Phone className="w-4 h-4 text-slate-500" />:{" "}
              {tracker.RemitterPhone}
            </span>
            <p className="text-[12px] text-slate-400 capitalize flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />{" "}
              {tracker.organizationName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={tracker.status} />
            <button
              type="button"
              onClick={() => onEdit(tracker)}
              title="Edit remitter details"
              className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            {/* <button
              type="button"
              onClick={() => onRemove(tracker)}
              title="Remove remitter tracker"
              className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button> */}
          </div>
        </div>
        <div className="mb-2 flex items-baseline justify-between text-xs">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Total Disbursed
            </p>
            <span className="text-base font-bold text-emerald-400">
              {currency(tracker.totalPaid)}
            </span>
          </div>
          <div className="text-right space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Allocation Limit
            </p>
            <span className="text-sm font-medium text-slate-300">
              of {currency(tracker.allocationLimit)}
            </span>
          </div>
        </div>
        <div className="relative mb-5 pt-1">
          <div className="mb-1 flex items-center justify-end">
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">
              {pct}% Cleared
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-linear-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 mt-2">
        <span className="text-xs text-slate-400 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-bold text-slate-200">
            {tracker.totalUsers}
          </span>{" "}
          successful payouts
        </span>
        <span
          className="text-[11px] font-medium text-slate-500 truncate max-w-32.5 flex items-center gap-1"
          title={tracker.RemitterEmail}
        >
          <span className="text-slate-400 font-bold">@ :</span>{" "}
          {tracker.RemitterEmail}
        </span>
      </div>
    </div>
  );
}
