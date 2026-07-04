import { Loader2, ShieldCheck } from "lucide-react";

export default function TabLoader() {
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-3 animate-fade-slide-in">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute h-14 w-14 rounded-full border-2 border-slate-800" />
        <Loader2 className="h-14 w-14 animate-spin text-emerald-500" style={{ animationDuration: "0.9s" }} />
        <ShieldCheck className="absolute h-5 w-5 text-emerald-400" />
      </div>
      <p className="font-mono text-xs tracking-wider text-slate-500">VERIFYING SESSION…</p>
    </div>
  );
}
