export default function StatCard({ icon: Icon, label, value, delta, deltaPositive, accent }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400 font-body">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 font-mono text-2xl font-semibold text-slate-100">{value}</div>
      {delta && (
        <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${deltaPositive ? "text-emerald-400" : "text-rose-400"}`}>
          {deltaPositive ? (
            <span className="text-emerald-400">↑</span>
          ) : (
            <span className="text-rose-400">↓</span>
          )}
          {delta}
        </div>
      )}
    </div>
  );
}
