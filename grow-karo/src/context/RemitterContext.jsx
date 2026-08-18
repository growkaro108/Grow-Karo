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
import { RemRequestsCounts } from "../../services/remitterService";
import { useLoader } from "./LoaderContext";
import { errorMessage, successMessage } from "@/components/Message";
import { logoutRemitterApi } from "@/api/remitterApi";

export const remitterContext = createContext({});

export const RemitterProvider = ({ children }) => {
  const [authRemitter, setAuthRemitter] = useState(null);
  const [requestsCounts, setRequestsCounts] = useState([]);
  const [remLoading, setRemLoading] = useState(true);
  const { showLoader, hideLoader } = useLoader();
  const fetchRequestsCounts = useCallback(async () => {
    if (!authRemitter?.id) return;
    try {
      // console.log("called");
      const res = await RemRequestsCounts(authRemitter.id);
      // console.log(res);
      setRequestsCounts(res ?? []);
    } catch (error) {
      console.log(error);
      return;
    }
  }, [authRemitter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setRemLoading(true);
        const remitter = await getSecureCookie("authRemitter");
        if (!cancelled) setAuthRemitter(remitter?.data ?? null);
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

  const logoutRemitter = useCallback(async () => {
    if (!authRemitter) return;
    try {
      showLoader("Logout in progress...");
      const res = await logoutRemitterApi(
        authRemitter.id,
        authRemitter.remitterCode,
      );
      if (!res) {
        errorMessage("Failed to logout..");
        return;
      }
      const status = await deleteSecureCookie("authRemitter");
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

  const contextValue = useMemo(
    () => ({
      authRemitter,
      setAuthRemitter,
      remLoading,
      logoutRemitter,
      fetchRequestsCounts,
      requestsCounts,
    }),
    [
      authRemitter,
      remLoading,
      logoutRemitter,
      fetchRequestsCounts,
      requestsCounts,
    ],
  );

  return (
    <remitterContext.Provider value={contextValue}>
      {children}
    </remitterContext.Provider>
  );
};
