import { useState, useEffect, useCallback, useMemo, use, useRef } from "react";
import {
  approveUserTranactions,
  getAllTransaction,
  rejectUserTranactions,
} from "../../../../../../services/malikService";
import { allRounderMessage, infoMessage } from "@/components/Message";
import { adminContext } from "@/context/AdminContext";

export function useWithdrawals(onDecision) {
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

  // Pagination (server-driven)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [reason, setReason] = useState("Rejected by Admin");
  const latestLoadId = useRef(0);

  // Selected remitter state for approval modal
  const [selectedRemitter, setSelectedRemitter] = useState(null);

  // Get remitters from AdminContext
  const { codes: remitters } = use(adminContext);

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

  const loadWithdrawals = useCallback(async ({ silent = false } = {}) => {
    const requestId = ++latestLoadId.current;
    if (!silent) setLoading(true);
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
      if (requestId !== latestLoadId.current) return;
      if (res.status !== "success") {
        allRounderMessage(res.message);
        setError(res.message);
        if (!silent) setRows([]);
      } else {
        const data = res.data;
        setRows(data?.content ?? []);
        setTotalElements(data?.totalElements ?? 0);
        setTotalPages(data?.totalPages ?? 1);
      }
    } catch (err) {
      if (requestId === latestLoadId.current) {
        setError(err.message || "Could not load withdrawal requests.");
      }
    } finally {
      if (!silent && requestId === latestLoadId.current) setLoading(false);
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
    if (action === "processed") {
      const allocationLimit = Number(selectedRemitter?.allocationLimit);
      const totalPaid = Number(selectedRemitter?.totalPaid);
      const withdrawalAmount = Number(row.amount);

      if ([allocationLimit, totalPaid, withdrawalAmount].some(Number.isNaN)) {
        infoMessage("Invalid remitter or withdrawal amount data");
        return;
      }

      const remitterRemainingAmount = Math.round((allocationLimit - totalPaid) * 100) / 100;

      if (remitterRemainingAmount < withdrawalAmount) {
        infoMessage(
          `Remaining Amount : ₹${remitterRemainingAmount.toFixed(2)} | ` +
              `Withdrawal Amount : ₹${withdrawalAmount.toFixed(2)}.`,
            "Choose another remitter.",
        );
        return;
      }
      } else {
        const sanitizedReason = reason.trim();
        if (sanitizedReason.length < 5 || sanitizedReason.length > 100) {
          infoMessage(
            "Reason must be at least 5 characters and at most 100 characters long.",
          );
          return;
        }
      }

      const previousRows = rows;
      const previousTotalElements = totalElements;
      const previousTotalPages = totalPages;
      const previousPage = currentPage;
      const nextStatus = action === "processed" ? "processed" : "rejected";
      const nextRedemptionStatus =
        action === "processed" ? "in_progress" : "rejected";
      const isPendingView = filter === "pending";

      setActionLoadingId(row.id);
      setRows((prev) =>
        isPendingView
          ? prev.filter((current) => current.id !== row.id)
          : prev.map((current) =>
              current.id === row.id
                ? {
                    ...current,
                    status: nextStatus,
                    redemptionStatus: nextRedemptionStatus,
                  }
                : current,
            ),
      );
      if (isPendingView) {
        const nextTotal = Math.max(0, totalElements - 1);
        const nextPages = Math.max(1, Math.ceil(nextTotal / pageSize));
        setTotalElements(nextTotal);
        setTotalPages(nextPages);
        if (currentPage > nextPages) setCurrentPage(nextPages);
      }

      try {
        const updated =
          action === "processed"
            ? await approveUserTranactions(row.id, selectedRemitter?.id)
            : await rejectUserTranactions(row.id, reason.trim());
        if (!updated?.id) {
          throw new Error("Could not complete the withdrawal action.");
        }

        setRows((prev) =>
          isPendingView
            ? prev
            : prev.map((current) =>
                current.id === row.id ? { ...current, ...updated } : current,
              ),
        );
        onDecision?.(row.id, action);
        setConfirm(null);
        setSelectedRemitter(null);
        if (isPendingView) void loadWithdrawals({ silent: true });
      } catch (err) {
        setRows(previousRows);
        setTotalElements(previousTotalElements);
        setTotalPages(previousTotalPages);
        setCurrentPage(previousPage);
        setError(err.message || "Could not complete this action.");
        console.error(err);
      } finally {
        setActionLoadingId(null);
      }
  };

  return {
    filter,
    setFilter,
    confirm,
    setConfirm,
    rows,
    loading,
    error,
    actionLoadingId,
    showFilters,
    setShowFilters,
    searchInput,
    setSearchInput,
    method,
    setMethod,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalElements,
    totalPages,
    reason,
    setReason,
    selectedRemitter,
    setSelectedRemitter,
    remitters,
    activeFilterCount,
    clearAllFilters,
    safePage,
    rangeStart,
    rangeEnd,
    pageButtons,
    handleConfirm,
    loadWithdrawals,
  };
}
