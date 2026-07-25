"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

const LoaderContext = createContext(undefined);

export function LoaderProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Tracks how many concurrent things are asking for the loader,
  // so nested/parallel calls don't hide it too early.
  const activeCount = useRef(0);

  const showLoader = useCallback((msg) => {
    activeCount.current += 1;
    if (msg) setMessage(msg);
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    activeCount.current = Math.max(0, activeCount.current - 1);
    if (activeCount.current === 0) {
      setIsLoading(false);
      setMessage(null);
    }
  }, []);

  const withLoader = useCallback(
    async (fn, msg) => {
      showLoader(msg);
      try {
        return await fn();
      } finally {
        hideLoader();
      }
    },
    [showLoader, hideLoader]
  );

  return (
    <LoaderContext.Provider
      value={{ isLoading, message, showLoader, hideLoader, withLoader }}
    >
      {children}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  const ctx = useContext(LoaderContext);
  if (!ctx) {
    throw new Error("useLoader must be used within a <LoaderProvider>");
  }
  return ctx;
}