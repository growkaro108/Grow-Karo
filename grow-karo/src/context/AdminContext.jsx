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
    }),
    [malikNotification, codes, isLoading, LoadCodes, issuesData, loadIssues],
  );

  return (
    <adminContext.Provider value={contextValue}>
      {children}
    </adminContext.Provider>
  );
};
