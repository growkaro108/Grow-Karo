import { useState } from "react";
import { Check, X } from "lucide-react";
import Modal from "./Modal";
import StatusBadge from "./StatusBadge";
import { currency } from "../data";

export default function WithdrawalsTab({ withdrawals, onDecision }) {
  const [filter, setFilter] = useState("pending");
  const [confirm, setConfirm] = useState(null);

  const filtered = withdrawals.filter((w) => (filter === "all" ? true : w.status === filter));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {["pending", "approved", "rejected", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize font-body transition-colors ${
              filter === f ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-slate-900 text-slate-400 ring-1 ring-slate-800 hover:text-slate-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500 font-body">
              <th className="px-5 py-3 font-medium">Request</th>
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Method</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr key={w.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-4 font-mono text-xs text-slate-400">
                  {w.id}
                  <br />
                  <span className="text-slate-600">{w.requestedAt}</span>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-200 font-body">{w.user}</p>
                  <p className="text-xs text-slate-500 font-body">{w.email}</p>
                </td>
                <td className="px-5 py-4 font-mono font-semibold text-slate-100">{currency(w.amount)}</td>
                <td className="px-5 py-4 text-slate-400 font-body">{w.method}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={w.status} />
                </td>
                <td className="px-5 py-4 text-right">
                  {w.status === "pending" ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setConfirm({ row: w, action: "approved" })}
                        className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setConfirm({ row: w, action: "rejected" })}
                        className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 ring-1 ring-rose-500/30 hover:bg-rose-500/20 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 font-body">Reviewed</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500 font-body">
                  No withdrawal requests in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!confirm} onClose={() => setConfirm(null)}>
        {confirm && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                confirm.action === "approved" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
              }`}>
                {confirm.action === "approved" ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
              </span>
              <div>
                <h3 className="font-display text-base font-semibold text-slate-100">
                  {confirm.action === "approved" ? "Approve withdrawal?" : "Reject withdrawal?"}
                </h3>
                <p className="text-xs text-slate-500 font-body">{confirm.row.id}</p>
              </div>
            </div>
            <div className="mb-5 rounded-xl border border-slate-800 bg-slate-800/40 p-4 text-sm font-body">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">User</span>
                <span className="text-slate-200">{confirm.row.user}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Amount</span>
                <span className="font-mono font-semibold text-slate-100">{currency(confirm.row.amount)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Method</span>
                <span className="text-slate-200">{confirm.row.method}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors font-body">
                Cancel
              </button>
              <button
                onClick={() => {
                  onDecision(confirm.row.id, confirm.action);
                  setConfirm(null);
                }}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium text-white transition-colors font-body ${
                  confirm.action === "approved" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                Confirm {confirm.action === "approved" ? "Approval" : "Rejection"}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
