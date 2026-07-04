import { CheckCircle2, XCircle } from "lucide-react";

export default function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div className="fixed bottom-5 right-5 z-[60] animate-toast-in">
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md ${
        isError ? "border-rose-500/30 bg-rose-500/10" : "border-emerald-500/30 bg-emerald-500/10"
      }
      `}>
        {isError ? <XCircle className="h-5 w-5 text-rose-400" /> : <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
        <span className="text-sm font-medium text-slate-100 font-body">{toast.message}</span>
      </div>
    </div>
  );
}
