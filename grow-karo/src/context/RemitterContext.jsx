"use client";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { deleteSecureCookie, getSecureCookie } from "./cookiesManagement";
import { getPaymentTimeLine, getRemittersAllTransactions, RemRequestsCounts } from "../../services/remitterService";
import { useLoader } from "./LoaderContext";
import { confirmMessage, errorMessage, successMessage } from "@/components/Message";
import { logoutRemitterApi } from "@/api/remitterApi";

export const remitterContext = createContext({});

export const RemitterProvider = ({ children }) => {
  const [authRemitter, setAuthRemitter] = useState(null);
  const [requestsCounts, setRequestsCounts] = useState([]);
  const [remLoading, setRemLoading] = useState(true);
  const { showLoader, hideLoader } = useLoader();
  //from txn
  const [currentPage, setCurrentPage] = useState(1); // 1-based for UI
  const [transactions, setTransactions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [paymentTimeline, setPaymentTimeline] = useState([]);
  const [error, setError] = useState("");
  const PAGE_SIZE = 5;
  const fetchRequestsCounts = useCallback(async () => {
    if (!authRemitter?.id) return;
    try {
      // console.log("called");
      setRemLoading(true)
      const res = await RemRequestsCounts(authRemitter.id);
      // console.log(res);
      setRequestsCounts(res ?? []);
    } catch (error) {
      console.log(error);
      return;
    } finally {
      setRemLoading(false);
    }
  }, [authRemitter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setRemLoading(true);
        const remitter = await getSecureCookie("authRemitter");
        if (!cancelled) {
          setAuthRemitter(remitter?.data ?? null);
        }
      } catch (err) {
        console.log(err);
      } finally {
        if (!cancelled) setRemLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!authRemitter?.id) return;
    setRemLoading(true);
    setError("");
    try {
      const offset = (currentPage - 1) * PAGE_SIZE;
      const response = await getRemittersAllTransactions(
        authRemitter.id,
        offset,
        PAGE_SIZE,
      );
      if (response) {
        setTransactions(response.content ?? []);
        setTotalPages(response.totalPages ?? 1);
        setTotalElements(response.totalElements ?? 0);
      }
    } catch (err) {
      errorMessage(err.message);
      console.error("Failed to fetch transactions:", err);
      setError("Could not load transactions.");
    } finally {
      setRemLoading(false);
    }
  }, [authRemitter, currentPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions();
  }, [currentPage, fetchTransactions])

  const goToPage = useCallback((page) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  }, [totalPages]);

  const logoutRemitter = useCallback(async () => {
    if (!authRemitter) return;
    try {
      const confirm = await confirmMessage("Are you sure you want to logout?");
      if (!confirm) {
        return;
      }
      showLoader("Logout in progress...");
      const res = await logoutRemitterApi(
        authRemitter.id,
        authRemitter.remitterCode,
      );
      if (!res) {
        errorMessage("Failed to logout..");
        return;
      }
      await deleteSecureCookie("authToken");
      const status = await deleteSecureCookie("authRemitter");
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
      if (status.success) {
        setAuthRemitter(null);
        successMessage("Logout successfully");
      } else {
        errorMessage(status.message);
      }
    } catch (error) {
      console.log(error);
      errorMessage(error.message || "Failed to logout");
    } finally {
      hideLoader();
    }
  }, [authRemitter, hideLoader, showLoader]);

  const fetchPaymentTimeline = useCallback(async () => {
    if (!authRemitter?.id) return;
    setRemLoading(true);
    setError("");
    try {
      const response = await getPaymentTimeLine(authRemitter.id);
      if (response) {
        setPaymentTimeline(response);
      }
    } catch (err) {
      errorMessage(err.message);
      console.error("Failed to fetch payment timeline:", err);
      setError("Could not load payment timeline.");
    } finally {
      setRemLoading(false);
    }
  }, [authRemitter]);

  const contextValue = useMemo(
    () => ({
      authRemitter,
      setAuthRemitter,
      remLoading,
      logoutRemitter,
      fetchRequestsCounts,
      requestsCounts, currentPage, goToPage, transactions, totalPages, totalElements, error, fetchTransactions, PAGE_SIZE, paymentTimeline, fetchPaymentTimeline
    }),
    [authRemitter, remLoading, logoutRemitter, fetchRequestsCounts, requestsCounts, currentPage, goToPage, transactions, totalPages, totalElements, error, fetchTransactions, paymentTimeline, fetchPaymentTimeline],
  );

  return (
    <remitterContext.Provider value={contextValue}>
      {children}
    </remitterContext.Provider>
  );
};
