import { Check, X, Loader2 } from "lucide-react";
import Modal from "../Modal";
// import RemitterSelectDemo from "../Remitterselect";
import { currency } from "../../utils";
import RemitterSelect from "../Remitterselect";

export default function WithdrawalConfirmModal({
  confirm,
  setConfirm,
  actionLoadingId,
  reason,
  setReason,
  selectedRemitter,
  setSelectedRemitter,
  remitters,
  handleConfirm,
}) {
  return (
    <Modal open={!!confirm} onClose={() => setConfirm(null)}>
      {confirm && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                confirm.action === "processed"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-rose-500/15 text-rose-400"
              }`}
            >
              {confirm.action === "processed" ? (
                <Check className="h-5 w-5" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </span>
            <div>
              <h3 className="font-display text-base font-semibold text-slate-100">
                {confirm.action === "processed"
                  ? "Approve withdrawal?"
                  : "Reject withdrawal?"}
              </h3>
              <p className="text-xs text-slate-500 font-body">
                {confirm.row.id}
              </p>
            </div>
          </div>

          <div className="mb-5 rounded-xl border border-slate-800 bg-slate-800/40 p-4 text-sm font-body">
            <div className="flex justify-between py-1">
              <span className="text-slate-500">User</span>
              <span className="text-slate-200">{confirm.row.userName}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Amount</span>
              <span className="font-mono font-semibold text-slate-100">
                {currency(confirm.row.amount)}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Method</span>
              <span className="text-slate-200">{confirm.row.method}</span>
            </div>

            {confirm.action === "rejected" ? (
              <div className="flex justify-between items-center py-2 border-t border-slate-800 mt-2">
                <span className="text-slate-500">Reason</span>
                <input
                  className="text-slate-200 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-body focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors w-2/3"
                  placeholder="Enter reason..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2 border-t border-slate-800 mt-2 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Assign Remitter</span>
                </div>
                <RemitterSelect
                  selected={selectedRemitter}
                  remitters={remitters}
                  onSelect={(id) => {
                    const r = remitters?.find((x) => x.id === id);
                    setSelectedRemitter(r || null);
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setConfirm(null)}
              disabled={actionLoadingId === confirm.row.id}
              className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors font-body disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={actionLoadingId === confirm.row.id}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white transition-colors font-body disabled:opacity-60 ${
                confirm.action === "processed"
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-rose-600 hover:bg-rose-500"
              }`}
            >
              {actionLoadingId === confirm.row.id && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Confirm{" "}
              {confirm.action === "processed" ? "Approval" : "Rejection"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
