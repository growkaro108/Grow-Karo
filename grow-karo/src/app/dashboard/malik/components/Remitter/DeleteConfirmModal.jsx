import React from "react";
import { AlertTriangle } from "lucide-react";

export function DeleteConfirmModal({
  target,
  isDeleting,
  onCancel,
  onConfirm,
}) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-all duration-300 ${
        target
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl transition-all duration-300 transform ${
          target ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="bg-rose-500/10 p-2 rounded-xl text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Remove Remitter Tracker
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              This action cannot be undone.
            </p>
          </div>
        </div>

        {target && (
          <p className="text-xs text-slate-400">
            Are you sure you want to remove{" "}
            <span className="font-mono font-semibold text-slate-200">
              {target.code}
            </span>{" "}
            ({target.owner})? Its tracking link and history will no longer be
            accessible from this dashboard.
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="w-1/2 py-2.5 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-1/2 py-2.5 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-500 shadow-md active:scale-[0.99] transition-all disabled:opacity-60"
          >
            {isDeleting ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}
