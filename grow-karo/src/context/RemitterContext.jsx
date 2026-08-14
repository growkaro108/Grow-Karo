"use client";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSecureCookie } from "./cookiesManagement";
import { RemRequestsCounts } from "../../services/remitterService";

export const remitterContext = createContext({});

export const RemitterProvider = ({ children }) => {
  const [authRemitter, setAuthRemitter] = useState(null);
  const [requestsCounts, setRequestsCounts] = useState([]);
  const [remLoading, setRemLoading] = useState(true);

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
    try {
      // const res = await logoutUserApi();
      // if (!res) {
      //   throw new Error("Failed to logout");
      // }
      setAuthRemitter(null);
    } catch (error) {
      throw error;
    }
  }, []);

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
