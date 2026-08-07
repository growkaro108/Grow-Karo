import React, { useState, useMemo, useEffect, use } from "react";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowRightLeft,
} from "lucide-react";
import { errorMessage } from "@/components/Message";
import { userContext } from "@/context/UserContext";
import { getAllUserTransaction } from "../../../../services/grahakService";
import { formatDateTime } from "@/app/plan/utils/planUtils";

// --- demo data (used only when no transactions prop is supplied) ---
const DEMO_TYPES = ["Credit", "Debit"];
const DEMO_STATUSES = ["Completed", "Pending", "Failed"];
const DEMO_DESCRIPTIONS = [
  "Client invoice payment",
  "Cloud hosting subscription",
  "Payroll disbursement",
  "Vendor settlement",
  "Refund issued",
  "Software license renewal",
  "Marketing spend",
  "Office supplies",
  "Contractor payout",
  "Equipment purchase",
];

function generateDemoTransactions(count = 87) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 120);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    out.push({
      id: `TXN-${(100000 + i).toString()}`,
      date: date.toISOString().split("T")[0],
      description:
        DEMO_DESCRIPTIONS[Math.floor(Math.random() * DEMO_DESCRIPTIONS.length)],
      type: DEMO_TYPES[Math.floor(Math.random() * DEMO_TYPES.length)],
      amount: Math.round(Math.random() * 480000) / 100 + 10,
      status: DEMO_STATUSES[Math.floor(Math.random() * DEMO_STATUSES.length)],
    });
  }
  return out;
}

const STATUS_STYLES = {
  Completed: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  Pending: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  Failed: {
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  },
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function StatusBadge({ status }) {
  const cfg = STATUS_STYLES[status] || STATUS_STYLES.Completed;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.badge}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
}

function SortIcon({ active, direction }) {
  if (!active) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />;
  return direction === "asc" ? (
    <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
  ) : (
    <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
  );
}

export default function Transaction() {
  const [transactions, setTransactions] = useState([]);
  const { authUser } = use(userContext);
  useEffect(() => {
    const LoadTransactions = async () => {
      const res = await getAllUserTransaction(authUser?.id);
      if (res.status === "success") {
        setTransactions(res.data);
      } else {
        errorMessage(res.message);
        console.table(res);
      }
    };
    LoadTransactions();
  }, []);

  const data = useMemo(
    () =>
      transactions && transactions.length
        ? transactions
        : generateDemoTransactions(),
    [transactions],
  );

  // Filter & search state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Sorting
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Export toast
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const requestSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const filteredTransactions = useMemo(() => {
    return data
      .filter((txn) => {
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !q ||
          txn.description.toLowerCase().includes(q) ||
          txn.id.toLowerCase().includes(q);
        const matchesStatus =
          statusFilter === "All" || txn.status === statusFilter;
        const matchesType = typeFilter === "All" || txn.type === typeFilter;
        const matchesDate =
          (!startDate || txn.date >= startDate) &&
          (!endDate || txn.date <= endDate);
        const matchesAmount =
          (!minAmount || txn.amount >= parseFloat(minAmount)) &&
          (!maxAmount || txn.amount <= parseFloat(maxAmount));
        return (
          matchesSearch &&
          matchesStatus &&
          matchesType &&
          matchesDate &&
          matchesAmount
        );
      })
      .sort((a, b) => {
        const { key, direction } = sortConfig;
        if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
        if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [
    data,
    searchTerm,
    statusFilter,
    typeFilter,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortConfig,
  ]);

  // Reset to page 1 whenever the filtered set or page size changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    typeFilter,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    pageSize,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / pageSize),
  );
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(
    startIdx,
    startIdx + pageSize,
  );

  const activeFilterCount =
    (statusFilter !== "All" ? 1 : 0) +
    (typeFilter !== "All" ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0) +
    (minAmount ? 1 : 0) +
    (maxAmount ? 1 : 0);

  const clearAllFilters = () => {
    setStatusFilter("All");
    setTypeFilter("All");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
  };

  const handleExportCSV = () => {
    const headers = [
      "Transaction ID",
      "Date",
      "Description",
      "Type",
      "Amount ($)",
      "Status",
    ];
    const rows = filteredTransactions.map((txn) => [
      txn.id,
      txn.date,
      `"${txn.description.replace(/"/g, '""')}"`,
      txn.type,
      txn.amount.toFixed(2),
      txn.status,
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `transactions_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast(`Exported ${filteredTransactions.length} transactions`);
  };

  const rangeStart = filteredTransactions.length === 0 ? 0 : startIdx + 1;
  const rangeEnd = Math.min(startIdx + pageSize, filteredTransactions.length);

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

  return (
    <div className="p-1 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        {/* Toast */}
        {toast && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Transaction history
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Monitor, search, and filter your platform transactions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border shadow-sm transition ${
                showFilters || activeFilterCount > 0
                  ? "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full text-[11px] font-semibold ${
                    showFilters || activeFilterCount > 0
                      ? "bg-white text-indigo-600"
                      : "bg-indigo-600 text-white"
                  }`}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Control Bar: Search + Quick Date Range */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-7">
          {/* Search input */}
          <div className="relative flex-1 min-w-60 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500  transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Date Range Controls (Beside Search Bar) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Date:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs text-slate-400 hover:text-slate-600 ml-1"
                title="Clear dates"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {/* Filter panel */}
        <div
          className={`bg-slate-50 border-slate-200 transition-all duration-300 ease-in-out overflow-hidden ${
            showFilters ? "max-h-100 opacity-100 border-b" : "max-h-0 opacity-0"
          }`}
        >
          <div className="p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="All">All statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="All">All types</option>
                  <option value="Credit">Credit</option>
                  <option value="Debit">Debit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Amount range ($)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-full px-2 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="text-slate-400 text-xs flex-shrink-0">
                    to
                  </span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-full px-2 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <span className="text-xs text-slate-500">
                  {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}{" "}
                  active
                </span>
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Data table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th
                  className="hidden md:table-cell p-4 text-xs font-semibold text-slate-600 uppercase cursor-pointer hover:bg-slate-100 select-none"
                  onClick={() => requestSort("id")}
                >
                  <div className="flex items-center gap-1.5">
                    Txn ID
                    <SortIcon
                      active={sortConfig.key === "id"}
                      direction={sortConfig.direction}
                    />
                  </div>
                </th>
                <th
                  className="p-4 text-xs font-semibold text-slate-600 uppercase cursor-pointer hover:bg-slate-100 select-none"
                  onClick={() => requestSort("date")}
                >
                  <div className="flex items-center gap-1.5">
                    Date
                    <SortIcon
                      active={sortConfig.key === "date"}
                      direction={sortConfig.direction}
                    />
                  </div>
                </th>
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase">
                  Description
                </th>
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase">
                  Status
                </th>
                <th
                  className="p-4 text-xs font-semibold text-slate-600 uppercase cursor-pointer text-right hover:bg-slate-100 select-none"
                  onClick={() => requestSort("amount")}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Amount
                    <SortIcon
                      active={sortConfig.key === "amount"}
                      direction={sortConfig.direction}
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="p-4 text-sm font-mono text-slate-600 hidden md:table-cell">
                      {txn.id}
                    </td>
                    <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                      {formatDateTime(txn.date)}
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-slate-900">
                        {txn.description}
                      </p>
                      <p className="text-xs text-slate-400">{txn.type}</p>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={txn.status} />
                    </td>
                    <td
                      className={`p-4 text-sm font-semibold text-right whitespace-nowrap ${
                        txn.type === "Credit"
                          ? "text-emerald-600"
                          : "text-slate-900"
                      }`}
                    >
                      {txn.type === "Credit" ? "+" : "-"}$
                      {txn.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="p-12 text-center text-sm text-slate-400"
                  >
                    No transactions found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / pagination */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>
              Showing <b className="text-slate-700">{rangeStart}</b>–
              <b className="text-slate-700">{rangeEnd}</b> of{" "}
              <b className="text-slate-700">{filteredTransactions.length}</b>{" "}
              entries
            </span>
            <div className="flex items-center gap-1.5">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {pageButtons.map((p, idx) =>
                p === "…" ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`min-w-7 h-7 px-2 rounded-md text-xs font-medium border ${
                      p === safePage
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
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
                className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
