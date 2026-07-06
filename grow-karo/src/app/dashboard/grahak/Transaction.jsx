import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  FunnelPlus,
} from "lucide-react";
import Image from "next/image";

export default function Transaction({ transactions = [] }) {
  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleExportCSV = () => {
  // 1. Define the headers
  const headers = ['Transaction ID', 'Date', 'Description', 'Type', 'Amount ($)', 'Status'];
  
  // 2. Map the filtered data into rows
  const rows = filteredTransactions.map(txn => [
    txn.id,
    txn.date,
    `"${txn.description.replace(/"/g, '""')}"`, // Wrap description in quotes to handle commas safely
    txn.type,
    txn.amount.toFixed(2),
    txn.status
  ]);

  // 3. Combine headers and rows with newlines
  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  
  // 4. Create a Blob and trigger the download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  alert("CSV export initiated! Check your downloads folder.");
};

  // Sorting State
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  // Handle Sorting
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filter and Sort Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      // Search term filter
      const matchesSearch =
        txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.id.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "All" || txn.status === statusFilter;

      // Date filter
      const matchesDate =
        (!startDate || txn.date >= startDate) &&
        (!endDate || txn.date <= endDate);

      // Amount filter
      const matchesAmount =
        (!minAmount || txn.amount >= parseFloat(minAmount)) &&
        (!maxAmount || txn.amount <= parseFloat(maxAmount));

      return matchesSearch && matchesStatus && matchesDate && matchesAmount;
    }).sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key])
        return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
        return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [
    searchTerm,
    statusFilter,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortConfig,
  ]);

  // Helper component for Status Badges
  const StatusBadge = ({ status }) => {
    const styles = {
      Completed: "bg-green-50 text-green-700 border-green-200 central",
      Pending: "bg-amber-50 text-amber-700 border-amber-200",
      Failed: "bg-red-50 text-red-700 border-red-200",
    };
    const icons = {
      Completed: <CheckCircle className="w-3.5 h-3.5 mr-1" />,
      Pending: <Clock className="w-3.5 h-3.5 mr-1" />,
      Failed: <XCircle className="w-3.5 h-3.5 mr-1" />,
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}
      >
        {icons[status]}
        {status}
      </span>
    );
  };

  return (
    <div className="p-1 bg-slate-50 max-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl flex gap-3 font-bold text-slate-900">
              Transaction History{" "}
              <Image
                src="/transaction.png"
                alt="Transaction Icon"
                width={30}
                height={20}
              />
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Monitor, search, and filter your platform transactions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-indigo-50 border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition"
            >
              <FunnelPlus className="w-5 h-5 text-slate-500" />(
              {showFilters ? "Hide Filters" : "Show Filters"})
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-indigo-50 border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition"
            >
              <Download className="w-4 h-4 mr-2 text-slate-500" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filter Controls Panel */}

        <div
          className={`grid grid-cols-1 md:grid-cols-2 mb-1 gap-4 border-slate-200 bg-slate-50/50 transition-all duration-500 ease-in-out overflow-hidden ${
            showFilters
              ? "max-h-125 opacity-100 p-6 border-b"
              : "max-h-0 opacity-0 p-0 border-b-0"
          }`}
        >
          {/* Search Input */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="ID or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          {/* Date Range Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Date Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          {/* Amount Range Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Amount Range ($)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="number"
                placeholder="Max"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th
                  className="hidden md:block p-4 text-xs font-semibold text-slate-600 uppercase cursor-pointer hover:bg-slate-100"
                  onClick={() => requestSort("id")}
                >
                  <div className="flex items-center gap-1">
                    Txn ID <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="p-4 text-xs font-semibold text-slate-600 uppercase cursor-pointer hover:bg-slate-100"
                  onClick={() => requestSort("date")}
                >
                  <div className="flex items-center gap-1">
                    Date <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase">
                  Description
                </th>
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase">
                  Status
                </th>
                <th
                  className="p-4 text-xs font-semibold text-slate-600 uppercase cursor-pointer text-right hover:bg-slate-100"
                  onClick={() => requestSort("amount")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="p-4 text-sm font-mono text-slate-600 hidden md:table-cell">
                      {txn.id}
                    </td>
                    <td className="p-4 text-sm text-slate-600">{txn.date}</td>
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
                      className={`p-4 text-sm font-semibold text-right ${txn.type === "Credit" ? "text-green-600" : "text-slate-900"}`}
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

        {/* Footer / Pagination Indicator */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <b>{filteredTransactions.length}</b> of{" "}
            <b>{transactions.length}</b> entries
          </div>
        </div>
      </div>
    </div>
  );
}
