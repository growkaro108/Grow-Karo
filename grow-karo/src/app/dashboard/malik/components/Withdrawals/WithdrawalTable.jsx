import {
  Loader2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import { StatusBadge } from "../StatusBadge";
import { currency } from "../../utils";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function WithdrawalTable({
  loading,
  rows,
  filter,
  actionLoadingId,
  setConfirm,
  totalElements,
  pageSize,
  setPageSize,
  safePage,
  rangeStart,
  rangeEnd,
  totalPages,
  pageButtons,
  setCurrentPage,
  loadWithdrawals,
  error,
}) {
  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400 font-body flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadWithdrawals}
            className="text-xs font-medium underline hover:text-rose-300"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="w-full min-w-180 text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500 font-body">
              <th className="px-5 py-3 font-medium font-body">Request</th>
              <th className="px-5 py-3 font-medium font-body">User</th>
              <th className="px-5 py-3 font-medium font-body">Amount</th>
              <th className="px-5 py-3 font-medium font-body">Method</th>
              <th className="px-5 py-3 font-medium font-body">Status</th>
              <th className="px-5 py-3 font-medium text-right font-body">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-slate-500 font-body"
                >
                  <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                  Loading withdrawal requests…
                </td>
              </tr>
            ) : rows.length > 0 ? (
              rows.map((w) => (
                <tr
                  key={w.id}
                  className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-5 py-4 font-mono text-xs text-slate-400">
                    {w.id}
                    <br />
                    <span className="text-slate-600">
                      {new Date(w.requestedAt).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-200 font-body">
                      {w.userName}
                    </p>
                    <p className="text-xs text-slate-500 font-body">
                      {w.userEmail}
                    </p>
                  </td>
                  <td className="px-5 py-4 font-mono font-semibold text-slate-100">
                    {currency(w.amount)}
                  </td>
                  <td className="px-5 py-4 text-slate-400 font-body">
                    {w.method}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={w.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    {w.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={actionLoadingId === w.id}
                          onClick={() =>
                            setConfirm({ row: w, action: "processed" })
                          }
                          className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
                        >
                          Processed
                        </button>
                        <button
                          disabled={actionLoadingId === w.id}
                          onClick={() =>
                            setConfirm({ row: w, action: "rejected" })
                          }
                          className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 ring-1 ring-rose-500/30 hover:bg-rose-500/20 transition-colors disabled:opacity-40"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 font-body">
                        Reviewed
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-slate-500 font-body"
                >
                  No withdrawal requests in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {!loading && totalElements > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 px-5 py-3 text-xs text-slate-500 font-body">
            <div className="flex items-center gap-4">
              <span>
                Showing <b className="text-slate-300">{rangeStart}</b>–
                <b className="text-slate-300">{rangeEnd}</b> of{" "}
                <b className="text-slate-300">{totalElements}</b> requests
              </span>
              <div className="flex items-center gap-1.5">
                <span>Rows per page</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={safePage === 1}
                  className="rounded-md border border-slate-700 bg-slate-900 p-1.5 text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="rounded-md border border-slate-700 bg-slate-900 p-1.5 text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                {pageButtons.map((p, idx) =>
                  p === "…" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-slate-600"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-7 h-7 rounded-md border px-2 text-xs font-medium transition-colors ${
                        p === safePage
                          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                          : "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={safePage === totalPages}
                  className="rounded-md border border-slate-700 bg-slate-900 p-1.5 text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safePage === totalPages}
                  className="rounded-md border border-slate-700 bg-slate-900 p-1.5 text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
