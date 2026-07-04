export default function PriorityDot({ priority }) {
  const map = { high: "bg-rose-500", medium: "bg-amber-500", low: "bg-slate-500" };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium capitalize text-slate-400">
      <span className={`h-1.5 w-1.5 rounded-full ${map[priority]}`} />
      {priority}
    </span>
  );
}
