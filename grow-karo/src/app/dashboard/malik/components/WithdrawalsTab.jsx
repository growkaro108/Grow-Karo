import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Check,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Modal from "./Modal";
import { StatusBadge } from "./StatusBadge";
import { currency } from "../utils";
import {
  approveUserTranactions,
  getAllTransaction,
  rejectUserTranactions,
} from "../../../../../services/malikService";
import { allRounderMessage, infoMessage } from "@/components/Message";

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const METHOD_OPTIONS = ["All", "Bank Transfer", "UPI", "Wallet"];

export default function WithdrawalsTab({ onDecision }) {
  const [filter, setFilter] = useState("pending");
  const [confirm, setConfirm] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // debounced value actually sent to the API
  const [method, setMethod] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // Debounce search input -> search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const activeFilterCount =
    (method !== "All" ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0) +
    (minAmount ? 1 : 0) +
    (maxAmount ? 1 : 0);

  const clearAllFilters = () => {
    setMethod("All");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
  };

  // Pagination (server-driven)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [reason, setReason] = useState("Rejected by Admin");

  const loadWithdrawals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = (currentPage - 1) * pageSize;
      const params = new URLSearchParams({
        filter: String(filter),
        offset: String(offset),
        limit: String(pageSize),
      });
      if (search) params.set("search", search);
      if (method !== "All") params.set("method", method);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (minAmount) params.set("minAmount", minAmount);
      if (maxAmount) params.set("maxAmount", maxAmount);

      const res = await getAllTransaction(params.toString());
      if (!res.status === "success") {
        allRounderMessage(res.message);
        setError(res.message);
        setRows([]);
      } else {
        const data = res.data;
        setRows(data.content);
        setTotalElements(data.totalElements);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      setError(err.message || "Could not load withdrawal requests.");
    } finally {
      setLoading(false);
    }
  }, [
    filter,
    currentPage,
    pageSize,
    search,
    method,
    startDate,
    endDate,
    minAmount,
    maxAmount,
  ]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWithdrawals();
  }, [loadWithdrawals]);

  // Reset to page 1 whenever the filter, page size, or any filter value changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [
    filter,
    pageSize,
    search,
    method,
    startDate,
    endDate,
    minAmount,
    maxAmount,
  ]);

  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const startIdx = (safePage - 1) * pageSize;
  const rangeStart = totalElements === 0 ? 0 : startIdx + 1;
  const rangeEnd = Math.min(startIdx + pageSize, totalElements);

  const pageButtons = useMemo(() => {
    const pages = [];
    const windowSize = 1;
    for (let p = 1; p <= totalPages; p++) {
      if (
        p === 1 ||
        p === totalPages ||
        (p >= safePage - windowSize && p <= safePage + windowSize)
      ) {
        pages.push(p);
      } else if (pages[pages.length - 1] !== "…") {
        pages.push("…");
      }
    }
    return pages;
  }, [totalPages, safePage]);

  const handleConfirm = async () => {
    if (!confirm) return;
    const { row, action } = confirm;
    setActionLoadingId(row.id);
    let res = null;
    try {
      if (action === "approved") {
        res = await approveUserTranactions(row.id);
      } else {
        //sanitize reason
        const sanitizedReason = reason.trim();
        if (sanitizedReason.length < 5 || sanitizedReason.length > 100) {
          setLoading(false);
          infoMessage(
            "Reason must be at least 5 characters and at most 100 characters long.",
          );
          return;
        }
        res = await rejectUserTranactions(row.id, sanitizedReason);
      }

      if (res.status !== "success") {
        setLoading(false);
        return;
      }
      const updated = res.data;

      // Reflect the change locally instead of refetching the whole list
      setRows((prev) =>
        filter === "all"
          ? prev.map((r) => (r.id === updated.id ? updated : r))
          : prev.filter((r) => r.id !== updated.id),
      );

      onDecision?.(row.id, action);
    } catch (err) {
      setError(err.message || "Could not complete this action.");
      console.error(err);
    } finally {
      allRounderMessage(res);
      setActionLoadingId(null);
      setConfirm(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {["pending", "approved", "rejected", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize font-body transition-colors ${
                filter === f
                  ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                  : "bg-slate-900 text-slate-400 ring-1 ring-slate-800 hover:text-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search user, email, or ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-56 rounded-lg border border-slate-800 bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-600 font-body focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-colors font-body ${
              showFilters || activeFilterCount > 0
                ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30"
                : "bg-slate-900 text-slate-400 ring-slate-800 hover:text-slate-200"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500/25 px-1 text-[10px]">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="grid grid-cols-1 gap-x-7 gap-y-4 sm:grid-cols-2 ">
            {/* <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 font-body">
                Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 font-body focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {METHOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div> */}

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 font-body">
                Date range
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-2 text-xs text-slate-200 font-body focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-600">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-2 text-xs text-slate-200 font-body focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 font-body">
                Amount range
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="Min"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-2 text-xs text-slate-200 placeholder:text-slate-600 font-body focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-600">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-2 text-xs text-slate-200 placeholder:text-slate-600 font-body focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-end">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 font-body"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
              <th className="px-5 py-3 font-medium">Request</th>
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Method</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Action</th>
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
                            setConfirm({ row: w, action: "approved" })
                          }
                          className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
                        >
                          Approve
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
                  className="rounded-md border border-slate-700 bg-slate-900 p-1.5 text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="rounded-md border border-slate-700 bg-slate-900 p-1.5 text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
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
                      className={`min-w-7 h-7 rounded-md border px-2 text-xs font-medium ${
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
                  className="rounded-md border border-slate-700 bg-slate-900 p-1.5 text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safePage === totalPages}
                  className="rounded-md border border-slate-700 bg-slate-900 p-1.5 text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={!!confirm} onClose={() => setConfirm(null)}>
        {confirm && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  confirm.action === "approved"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-rose-500/15 text-rose-400"
                }`}
              >
                {confirm.action === "approved" ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <X className="h-5 w-5" />
                )}
              </span>
              <div>
                <h3 className="font-display text-base font-semibold text-slate-100">
                  {confirm.action === "approved"
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
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Reason</span>
                <input
                  className="text-slate-200 border border-slate-500 rounded-sm p-1.5 text-xs font-medium capitalize font-body transition-colors"
                  placeholder="Enter reason..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
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
                  confirm.action === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {actionLoadingId === confirm.row.id && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Confirm{" "}
                {confirm.action === "approved" ? "Approval" : "Rejection"}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
