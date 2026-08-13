"use client";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getAllRemitter } from "../../services/malikService";

export const adminContext = createContext({});
export const AdminContextProvider = ({ children }) => {
  const [malikNotification, setMalikNotification] = useState([]);
  const [isLoading, setIsloading] = useState(true);
  const [codes, setCodes] = useState([]);

  const LoadCodes = useCallback(async () => {
    try {
      const data = await getAllRemitter();
      if (data) {
        setCodes(data.content);
      }
    } catch (error) {
      console.log("error while loading remitters", error);
    } finally {
      setIsloading(false);
    }
  }, []);

  //malik notification provider
  const contextValue = useMemo(
    () => ({
      malikNotification,
      setMalikNotification,
      codes,
      setCodes,
      isLoading,
      LoadCodes,
    }),
    [malikNotification, codes, isLoading, LoadCodes],
  );

  return (
    <adminContext.Provider value={contextValue}>
      {children}
    </adminContext.Provider>
  );
};
