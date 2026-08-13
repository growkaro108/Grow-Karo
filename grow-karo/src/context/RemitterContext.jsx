"use client";
import { useRouter } from "next/router";
import { createContext, useEffect, useMemo, useState } from "react";
import { getSecureCookie } from "./cookiesManagement";

export const remitterContext = createContext({});
export const RemitterProvider = ({ children }) => {
  const [authRemitter, setAuthRemitter] = useState(null);
  useEffect(() => {
    let cancelled = false;
    if (authRemitter) return;

    (async () => {
      try {
        const remitter = await getSecureCookie("authRemitter");
        if (!cancelled) setAuthRemitter(remitter?.data);
      } catch (err) {
        console.log(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authRemitter]);

  const contexValue = useMemo(
    () => ({
      authRemitter,
      setAuthRemitter,
    }),
    [authRemitter],
  );
  return (
    <remitterContext.Provider value={contexValue}>
      {children}
    </remitterContext.Provider>
  );
};
