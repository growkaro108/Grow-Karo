import { Plus, Copy } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { currency } from "../data";

export default function FundraiserCodesTab({ codes, onGenerate, onCopy }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400 font-body">{codes.length} active fundraiser codes</p>
        <button
          onClick={onGenerate}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors font-body"
        >
          <Plus className="h-4 w-4" /> Generate Code
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {codes.map((c) => {
          const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
          return (
            <div key={c.id} className="animate-fade-slide-in rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-base font-semibold tracking-wide text-slate-100">{c.code}</span>
                <StatusBadge status={c.status} />
              </div>
              <p className="mb-4 text-xs text-slate-500 font-body">Owner: {c.owner}</p>

              <div className="mb-1 flex items-center justify-between text-xs font-body">
                <span className="text-slate-400">{currency(c.raised)} raised</span>
                <span className="text-slate-500">of {currency(c.goal)}</span>
              </div>
              <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-linear-to-r from-emerald-600 to-emerald-400 transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-body">{c.referrals} referrals</span>
                <button
                  onClick={() => onCopy(c.code)}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
