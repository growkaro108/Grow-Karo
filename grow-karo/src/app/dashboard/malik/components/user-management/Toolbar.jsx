import React, { useState } from "react";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import SelectFilter from "./SelectFilter";
import { SCHEMES } from "./mockData";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
];

const SCHEME_OPTIONS = [
  { value: "all", label: "All schemes" },
  ...SCHEMES.map((s) => ({ value: s, label: s })),
];

export default function Toolbar({
  query,
  onQueryChange,
  statusFilter,
  onStatusChange,
  schemeFilter,
  onSchemeChange,
  sortDesc,
  onToggleSort,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) + (schemeFilter !== "all" ? 1 : 0);

  const resetFilters = () => {
    onStatusChange("all");
    onSchemeChange("all");
  };

  return (
    <div className="mb-4 rounded-2xl border border-slate-800 bg-[#111827] p-4 shadow-lg shadow-black/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by name, email, or user ID..."
            className="w-full rounded-lg border border-slate-800 bg-[#0F172A] py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
          />
        </div>

        {/* Filter toggle (mobile) */}
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 sm:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[11px] text-slate-950">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Filters (desktop inline) */}
        <div className="hidden items-center gap-7 sm:flex">
          {/* <SelectFilter
            value={statusFilter}
            onChange={onStatusChange}
            options={STATUS_OPTIONS}
          />
          <SelectFilter
            value={schemeFilter}
            onChange={onSchemeChange}
            options={SCHEME_OPTIONS}
          /> */}
          <button
            onClick={onToggleSort}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-800 px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5"
            title="Toggle sort order"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortDesc ? "Newest" : "Oldest"}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="whitespace-nowrap text-sm font-medium text-teal-400 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filters (mobile expanded) */}
      {filtersOpen && (
        <div className="mt-3 flex flex-col gap-2 sm:hidden">
          {/* <SelectFilter
            value={statusFilter}
            onChange={onStatusChange}
            options={STATUS_OPTIONS}
            full
          />
          <SelectFilter
            value={schemeFilter}
            onChange={onSchemeChange}
            options={SCHEME_OPTIONS}
            full
          /> */}
          <button
            onClick={onToggleSort}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 px-3 py-2.5 text-sm font-medium text-slate-300"
          >
            <ArrowUpDown className="h-4 w-4" />
            Sort: {sortDesc ? "Newest first" : "Oldest first"}
          </button>
        </div>
      )}
    </div>
  );
}
