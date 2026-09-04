import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
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
  const [statusFilter, setStatusFilter] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [bondTarget, setBondTarget] = useState(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [paidDate, setPaidDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showFilter, setShowFilter] = useState(true);

  const inputRef = useRef(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((type, text) => {
    clearTimeout(toastTimer.current);
    setToast({ type, text });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllUserRequests();
      // console.log(response.data);
      if (response.status !== "success") {
        allRounderMessage(response);
        console.log(response);
      } else {
        setRequests(response.data);
      }
    } catch (error) {
      console.error("Error loading enrollment requests:", error);
      showToast("error", "Couldn't load requests. Try again.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadRequests();
    })();
    return () => {
      mounted = false;
      clearTimeout(toastTimer.current);
    };
  }, [loadRequests]);
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
  const isLessPaid = selectedRequest
    ? numericPaid < selectedRequest.paidAmount
    : false;
  const isValidAmount = paidAmount !== "" && numericPaid >= 0;

  // Guarded against selectedRequest being null (e.g. right after the modal
  // closes but paidDate/paidAmount haven't been cleared yet).
  const reqDate = selectedRequest?.requestDate?.split("T")[0];
  const isValidDate =
    !!selectedRequest &&
    !!paidDate &&
    paidDate >= reqDate &&
    paidDate <= getToday();

  const handleConfirmApproval = useCallback(async () => {
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
      userSchemeId: selectedRequest.userSchemeId,
      paidAmount: numericPaid,
      paidDate: paidDate,
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

      const updatedRequest = response?.data;
      if (updatedRequest?.userSchemeId) {
        mergeRequestInState(updatedRequest);
      } else {
        await loadRequests();
      }

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
    selectedRequest,
    isValidAmount,
    isLessPaid,
    isValidDate,
    numericPaid,
    paidDate,
    showToast,
    mergeRequestInState,
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
        console.log(response);
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

  const filteredRequests = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (requests.length === 0) return [];
    // first sort with whose bondImageURL is null first 
    const sortedRequests = [...requests].sort((a, b) => {
      if (a.bondImageURL === null && b.bondImageURL !== null) return -1;
      if (a.bondImageURL !== null && b.bondImageURL === null) return 1;
      return 0;
    });
    // sort 
    return sortedRequests.filter((r) => {
      const matchesStatus =
        statusFilter === "all" || r.isApproved === statusFilter;
      const matchesQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.schemeName.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [requests, query, statusFilter]);

  const pendingCount = requests.filter((r) => r.isApproved === false).length;

  const statusCounts = useMemo(() => {
    const counts = { all: requests.length };
    requests.forEach((r) => {
      counts[r.isApproved] = (counts[r.isApproved] || 0) + 1;
    });
    return counts;
  }, [requests]);

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
        setStatusFilter={setStatusFilter}
        statusCounts={statusCounts}
        showFilter={showFilter}
      />

      <SchemeTable
        loading={loading}
        filteredRequests={filteredRequests}
        query={query}
        statusFilter={statusFilter}
        handleOpenApproval={handleOpenApproval}
        setRejectTarget={setRejectTarget}
        handleOpenAddBond={handleOpenAddBond}
      />

      <ApprovalModal
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
