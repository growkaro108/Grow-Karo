import React from "react";
import PropTypes from "prop-types";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function PaginationFooter({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 15, 20],
  maxVisiblePages = 5,
  darkMode = false,
}) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const rangeStart = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, totalItems);

  const getPageButtons = () => {
    const pages = [];

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const leftBoundary = Math.max(1, safePage - 1);
      const rightBoundary = Math.min(totalPages, safePage + 1);

      if (leftBoundary > 2) {
        pages.push(1, "…");
      } else {
        for (let i = 1; i < leftBoundary; i++) pages.push(i);
      }

      for (let i = leftBoundary; i <= rightBoundary; i++) {
        pages.push(i);
      }

      if (rightBoundary < totalPages - 1) {
        pages.push("…", totalPages);
      } else {
        for (let i = rightBoundary + 1; i <= totalPages; i++) pages.push(i);
      }
    }

    return pages;
  };

  const pageButtons = getPageButtons();

  // Dynamic Tailwind theme classes based on darkMode prop
  const theme = {
    container: darkMode
      ? "border-slate-800 bg-slate-900 text-slate-400"
      : "border-slate-200 bg-slate-50 text-slate-500",
    boldText: darkMode ? "text-slate-200" : "text-slate-700",
    select: darkMode
      ? "bg-slate-800 border-slate-700 text-slate-200 focus:ring-indigo-400"
      : "bg-white border-slate-300 text-slate-700 focus:ring-indigo-500",
    navButton: darkMode
      ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
      : "border-slate-300 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40",
    pageBtnActive: darkMode
      ? "bg-indigo-600 border-indigo-600 text-white"
      : "bg-indigo-600 border-indigo-600 text-white",
    pageBtnInactive: darkMode
      ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
      : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100",
    ellipsis: darkMode ? "text-slate-600" : "text-slate-400",
  };
  // console.log(totalPages);
  // console.log(totalItems);
  // console.log(pageSize);
  // console.log(currentPage);

  return (
    <div
      className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${theme.container}`}
    >
      {/* Dynamic item counters & page size picker */}
      <div className="flex items-center gap-4">
        <span>
          Showing <b className={theme.boldText}>{rangeStart}</b>–
          <b className={theme.boldText}>{rangeEnd}</b> of{" "}
          <b className={theme.boldText}>{totalItems}</b> entries
        </span>
        <div className="flex items-center gap-1.5">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className={`px-2 py-1 text-xs border rounded-md focus:outline-none focus:ring-2 ${theme.select}`}
            disabled={totalPages === 1}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={safePage === 1}
            aria-label="First Page"
            className={`p-1.5 rounded-md border disabled:cursor-not-allowed ${theme.navButton}`}
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={safePage === 1}
            aria-label="Previous Page"
            className={`p-1.5 rounded-md border disabled:cursor-not-allowed ${theme.navButton}`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {pageButtons.map((p, idx) =>
            p === "…" ? (
              <span
                key={`ellipsis-${idx}`}
                className={`px-2 ${theme.ellipsis}`}
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-7 h-7 px-2 rounded-md text-xs font-medium border ${
                  p === safePage ? theme.pageBtnActive : theme.pageBtnInactive
                }`}
              >
                {p}
              </button>
            ),
          )}

          <button
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            disabled={safePage === totalPages}
            aria-label="Next Page"
            className={`p-1.5 rounded-md border disabled:cursor-not-allowed ${theme.navButton}`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={safePage === totalPages}
            aria-label="Last Page"
            className={`p-1.5 rounded-md border disabled:cursor-not-allowed ${theme.navButton}`}
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

PaginationFooter.propTypes = {
  currentPage: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  maxVisiblePages: PropTypes.number,
  darkMode: PropTypes.bool,
};
