import { formatDate } from "./portfolioUtils";

export default function DetailField({ label, value, highlight = false }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <span
        className={`text-sm font-semibold tracking-tight ${highlight ? "text-emerald-600 font-bold" : "text-slate-700"}`}
      >
        {Array.isArray(value)
          ? value.map((date) => <span key={date} className="block">{formatDate(date)}</span>)
          : (value ?? "-")}
      </span>
    </div>
  );
}
