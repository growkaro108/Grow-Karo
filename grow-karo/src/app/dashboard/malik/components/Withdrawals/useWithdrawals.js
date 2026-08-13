import { useState, useEffect, useCallback, useMemo, use } from "react";
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
      if (res.status !== "success") {
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
      if (action === "processed") {
        // Option to check if a remitter was selected or just proceed
        // If there's extra logic for associating the selected remitter, you can include it here.
        res = await approveUserTranactions(row.id, selectedRemitter?.id);
      } else {
        //sanitize reason
        const sanitizedReason = reason.trim();
        if (sanitizedReason.length < 5 || sanitizedReason.length > 100) {
          infoMessage(
            "Reason must be at least 5 characters and at most 100 characters long.",
          );
          setActionLoadingId(null);
          return;
        }
        res = await rejectUserTranactions(row.id, sanitizedReason);
      }
      if (!res) {
        return;
      }
      const updated = res.data;

      // Reflect the change locally instead of refetching the whole list
      setRows((prev) =>
        filter === "all"
          ? prev.map((r) => (r.id === updated.id ? updated : r))
          : prev.filter((r) => r.id !== updated?.id),
      );

      onDecision?.(row.id, action);
    } catch (err) {
      setError(err.message || "Could not complete this action.");
      console.error(err);
    } finally {
      allRounderMessage(res);
      setActionLoadingId(null);
      setConfirm(null);
      setSelectedRemitter(null); // reset selected remitter
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
