"use client";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getAllIssues, getAllRemitter } from "../../services/malikService";

export const adminContext = createContext({});
export const AdminContextProvider = ({ children }) => {
  const [malikNotification, setMalikNotification] = useState([]);
  const [isLoading, setIsloading] = useState(true);
  const [codes, setCodes] = useState([]);
  const [issuesData, setIssuesData] = useState([]);
  const [toast, setToast] = useState(null);
  
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const LoadCodes = useCallback(async () => {
    try {
      const data = await getAllRemitter();
      if (data) {
        setCodes(data.content);
      }
    } catch (error) {
      console.warn("error while loading remitters", error);
    } finally {
      setIsloading(false);
    }
  }, []);

  const loadIssues = useCallback(async (status, page, size) => {
    try {
      const data = await getAllIssues(status, page, size);
      // console.log(status + " " + page + " " + size);
      // console.log("issues data", data);
      if (data) {
        setIssuesData(data);
        return data;
      }
      return false;
    } catch (error) {
      console.log("error while loading issues", error);
      return false;
    }
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2600);
  };

  //malik notification provider
  const contextValue = useMemo(
    () => ({
      malikNotification,
      setMalikNotification,
      codes,
      setCodes,
      isLoading,
      LoadCodes,
      issuesData,
      loadIssues,
      adminEmails,
      toast,
      showToast,
    }),
    [
      malikNotification,
      codes,
      isLoading,
      LoadCodes,
      issuesData,
      loadIssues,
      adminEmails,
    ],
  );

  return (
    <adminContext.Provider value={contextValue}>
      {children}
    </adminContext.Provider>
  );
};
