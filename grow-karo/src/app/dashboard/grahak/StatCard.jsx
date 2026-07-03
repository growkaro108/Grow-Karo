import MiniChartInstance from "./MiniChart";

export default function StatCard({ title, value, label, trendData, trendColor }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold mt-2 text-slate-900 tracking-tight">{value}</p>
        {label}
      </div>
      <MiniChartInstance dataPoints={trendData} color={trendColor} />
    </div>
  );
}