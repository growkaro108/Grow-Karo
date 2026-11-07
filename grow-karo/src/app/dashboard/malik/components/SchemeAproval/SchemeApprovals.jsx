import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  use,
} from "react";
import { allRounderMessage, infoMessage } from "@/components/Message";
import { ListFilterPlus } from "lucide-react";
import {
  approveUserScheme,
  getAllUserRequests,
  rejectUserScheme,
} from "../../../../../../services/malikService";
import "./SchemeApprovals.css";
import FilterTabs from "./components/FilterTabs";
import SchemeTable from "./components/SchemeTable";
// import ApprovalModal from "./components/ApprovalModal";
// import RejectModal from "./components/RejectModal";
import Toast from "./components/Toast";
import dynamic from "next/dynamic";
import TabLoader from "@/loader/TabLoader";
import { userContext } from "@/context/UserContext";
// import AddBondModal from "./components/AddBondModal";
const AddBondModal = dynamic(() => import("./components/AddBondModal"), {
  loading: TabLoader,
  ssr: false,
});
const ApprovalModal = dynamic(() => import("./components/ApprovalModal"), {
  loading: TabLoader,
  ssr: false,
});
const RejectModal = dynamic(() => import("./components/RejectModal"), {
  loading: TabLoader,
  ssr: false,
});

const getToday = () => new Date().toISOString().split("T")[0];

export default function SchemeApproval() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    notApproved: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRequests, setTotalRequests] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [bondTarget, setBondTarget] = useState(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [paidDate, setPaidDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showFilter, setShowFilter] = useState(true);
  const { authUser } = use(userContext);
  const inputRef = useRef(null);
  const toastTimer = useRef(null);
  const userId = authUser?.id || null;
  const showToast = useCallback((type, text) => {
    clearTimeout(toastTimer.current);
    setToast({ type, text });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const loadRequests = useCallback(async (signal) => {
    if (signal?.aborted) return;
    try {
      setLoading(true);
      const response = await getAllUserRequests(
        {
          page: currentPage,
          size: pageSize,
          status: statusFilter,
          query: debouncedQuery,
        },
        signal,
      );
      if (signal?.aborted) return;

      if (response.status !== "success") {
        allRounderMessage(response);
      } else {
        const pageData = response.data;
        if (!Array.isArray(pageData?.content) || !pageData.counts) {
          throw new Error("Enrollment response did not contain page data and counts.");
        }

        if (
          pageData.content.length === 0 &&
          pageData.totalElements > 0 &&
          currentPage > pageData.totalPages
        ) {
          setCurrentPage(Math.max(1, pageData.totalPages));
          return;
        }

        setRequests(pageData.content);
        setTotalRequests(pageData.totalElements);
        setStatusCounts(pageData.counts);
      }
    } catch (error) {
      if (
        signal?.aborted ||
        error?.name === "AbortError" ||
        error?.name === "CanceledError"
      ) {
        return;
      }
      console.error("Error loading enrollment requests:", error);
      showToast("error", "Couldn't load requests. Try again.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    statusFilter,
    debouncedQuery,
    showToast,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => loadRequests(controller.signal));
    return () => controller.abort();
  }, [loadRequests]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);
  // Autofocus the amount field on open.
  // (Escape-to-close is handled inside ApprovalModal itself, which also
  // guards against closing mid-submission — no need to duplicate it here.)
  useEffect(() => {
    if (!selectedRequest) return;
    inputRef.current?.focus();
  }, [selectedRequest]);

  const handleOpenApproval = (request) => {
    setSelectedRequest(request);
    setPaidAmount(request.paidAmount);
    setPaidDate(getToday());
  };

  const handleOpenAddBond = (request) => {
    setBondTarget(request);
  };

  const handleCloseAddBond = () => {
    setBondTarget(null);
  };

  const mergeRequestInState = useCallback((updatedRequest) => {
    if (!updatedRequest?.userSchemeId) return;

    setRequests((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.userSchemeId === updatedRequest.userSchemeId,
      );

      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          ...updatedRequest,
        };
        return next;
      }

      return [...prev, updatedRequest];
    });
  }, []);

  const handleBondSuccess = (updatedData) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.userSchemeId === bondTarget?.userSchemeId
          ? { ...r, ...updatedData }
          : r,
      ),
    );
  };

  const numericPaid = Number(paidAmount) || 0;
  const isDailyDeposit = selectedRequest?.planType === "DAILY_DEPOSIT";
  const isLessPaid = selectedRequest
    ? isDailyDeposit
      ? numericPaid < Number(selectedRequest.minimumAmount)
      : numericPaid < selectedRequest.paidAmount
    : false;
  const isValidAmount =
    paidAmount !== "" &&
    numericPaid >= 0 &&
    (!isDailyDeposit || numericPaid <= 2000);

  // Guarded against selectedRequest being null (e.g. right after the modal
  // closes but paidDate/paidAmount haven't been cleared yet).
  const reqDate = selectedRequest?.requestDate?.split("T")[0];
  const isValidDate =
    !!selectedRequest &&
    !!paidDate &&
    paidDate >= reqDate &&
    paidDate <= getToday();

  const handleConfirmApproval = useCallback(async (
    submitTo,
    amountFrom,
    totalInterestPercentage,
    tenureMonths,
  ) => {
    // console.log(submitTo, amountFrom);
    if (!selectedRequest || !isValidAmount) {
      // console.log(paidAmount);
      showToast("error", "Enter a valid paid amount first.");
      return;
    }
    if (!selectedRequest.userSchemeId) {
      showToast("error", "User scheme ID not found.");
      allRounderMessage({
        status: "error",
        message: "User scheme ID not found.",
      });
      return;
    }
    if (isLessPaid) {
      showToast("error", "Amount cannot be less than minimum amount.");
      allRounderMessage({
        status: "error",
        message: "Amount cannot be less than minimum amount.",
      });
      return;
    }
    if (!isValidDate) {
      showToast(
        "error",
        `Paid date must be between ${selectedRequest.requestDate} and ${getToday()}.`,
      );
      infoMessage(
        `Enrollment date: ${selectedRequest.requestDate} | Today : ${getToday()}`,
        "Invalid Date",
      );
      return; // previously fell through and approved anyway
    }

    const payload = {
      userId: userId,
      userSchemeId: selectedRequest.userSchemeId,
      paidAmount: numericPaid,
      paidDate: paidDate,
      amountFrom: amountFrom,
      submitTo: submitTo,
      totalInterestPercentage: selectedRequest.planType === "PENSION"
        ? Number(totalInterestPercentage)
        : null,
      tenureMonths: selectedRequest.planType === "PENSION"
        ? Number(tenureMonths)
        : null,
    };
    // console.log(payload);
    let response = null;
    try {
      setSubmitting(true);
      response = await approveUserScheme(payload);
      if (response?.status !== "success") {
        allRounderMessage(response);
        showToast("error", response?.message || "Approval failed.");
        return;
      }

      // const updatedRequest = response?.data;
      // if (updatedRequest?.userSchemeId) {
      //   mergeRequestInState(updatedRequest);
      // } else {
      await loadRequests();
      // }

      const isExistingCustomer =
        selectedRequest?.isApproved ||
        selectedRequest?.status?.toLowerCase() === "active";

      showToast(
        "success",
        isExistingCustomer
          ? `${selectedRequest.name}'s amount was updated.`
          : `${selectedRequest.name}'s enrollment was approved.`,
      );
      setSelectedRequest(null);
    } catch (error) {
      console.error("Approval action failed:", error);
      showToast("error", "Approval failed. Please try again.");
    } finally {
      if (response) allRounderMessage(response);
      setSubmitting(false);
    }
  }, [
    userId,
    selectedRequest,
    isValidAmount,
    isLessPaid,
    isValidDate,
    numericPaid,
    paidDate,
    showToast,
    loadRequests,
  ]);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectTarget) return;
    if (!rejectTarget.userSchemeId) {
      showToast("error", "User scheme ID not found.");
      return;
    }

    let response = null;
    try {
      response = await rejectUserScheme(rejectTarget.userSchemeId);
      if (response?.status !== "success") {
        // console.log(response);
        showToast("error", response?.message || "Rejection failed.");
        return;
      }
      loadRequests();
      showToast(
        "success",
        `Request from ${rejectTarget.schemeName} was rejected.`,
      );
    } catch (error) {
      console.error("Rejection failed:", error);
      showToast("error", "Rejection failed. Please try again.");
    } finally {
      if (response) allRounderMessage(response);
      setRejectTarget(null);
    }
  }, [rejectTarget, showToast, loadRequests]);

  const pendingCount = statusCounts.pending;
  const handleStatusFilterChange = (nextStatus) => {
    setStatusFilter(nextStatus);
    setCurrentPage(1);
  };
  const handlePageSizeChange = (nextPageSize) => {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  };

  return (
    <div className="sea-root">
      <div className="sea-header">
        <div>
          <h2 className="sea-title">Scheme Enrollment Ledger</h2>
          <p className="sea-subtitle">
            Review capital commitments and confirm enrollments.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {pendingCount > 0 && (
            <span className="sea-pill-count">
              {pendingCount} awaiting
            </span>
          )}
          <button
            className="flex items-center gap-2 sea-btn sea-btn-success hover:scale-105 transition-all duration-200 ease-in-out cursor-pointer"
            title="Filter By Statuses"
            onClick={() => setShowFilter(!showFilter)}
          >
            <ListFilterPlus size={17} />{" "}
            <span className="text-[10px]">{showFilter ? "Hide" : "Show"}</span>
          </button>
          <input
            className="sea-search"
            placeholder="Search name or scheme..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search requests"
          />
        </div>
      </div>

      <FilterTabs
        statusFilter={statusFilter}
        setStatusFilter={handleStatusFilterChange}
        statusCounts={statusCounts}
        showFilter={showFilter}
      />

      <SchemeTable
        loading={loading}
        filteredRequests={requests}
        query={query}
        statusFilter={statusFilter}
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalRequests}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
        handleOpenApproval={handleOpenApproval}
        setRejectTarget={setRejectTarget}
        handleOpenAddBond={handleOpenAddBond}
      />

      <ApprovalModal
        key={selectedRequest?.userSchemeId || "closed"}
        selectedRequest={selectedRequest}
        setSelectedRequest={setSelectedRequest}
        paidAmount={paidAmount}
        setPaidAmount={setPaidAmount}
        paidDate={paidDate}
        setPaidDate={setPaidDate}
        submitting={submitting}
        handleConfirmApproval={handleConfirmApproval}
        inputRef={inputRef}
        refresh={loadRequests}
      />

      <RejectModal
        rejectTarget={rejectTarget}
        setRejectTarget={setRejectTarget}
        handleConfirmReject={handleConfirmReject}
      />

      <AddBondModal
        selectedRequest={bondTarget}
        onClose={handleCloseAddBond}
        onSuccess={handleBondSuccess}
        showToast={showToast}
      />

      <Toast toast={toast} />
    </div>
  );
}
