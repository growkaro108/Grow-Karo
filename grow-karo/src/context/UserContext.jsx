"use client";
import react, { createContext, useCallback, useMemo, useState } from "react";
import {
  allRounderMessage,
  confirmMessage,
  errorMessage,
  infoMessage,
  successMessage,
} from "@/components/Message";
import { useRouter } from "next/navigation";
import {
  deleteSecureCookie,
  getSecureCookie,
  setSecureCookie,
} from "./cookiesManagement";
import {
  getAllUsersScheme,
  getAllUserTransaction,
  logoutApi,
} from "../../services/grahakService";
import { useLoader } from "./LoaderContext";

export const userContext = createContext({});
export const UserProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [portfolio, setPortfolio] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const { showLoader, hideLoader } = useLoader();

  const router = useRouter();

  const updateAuthUser = useCallback(async (user) => {
    if (!user) return;
    const status = await deleteSecureCookie("authUser");
    if (status.success) {
      const status = await setSecureCookie("authUser", user);
      if (status.success) {
        setAuthUser(user);
      }
    }
  }, []);

  const fetchPortfolio = useCallback(async () => {
    const userId = authUser?.id;
    if (!userId) return;
    try {
      const response = await getAllUsersScheme(authUser?.id);
      // console.log(response.data);
      if (response.status === "success" && response.data) {
        setPortfolio(response.data);
      } else {
        allRounderMessage(response);
        setPortfolio([]);
      }
    } catch (error) {
      errorMessage("something went wrong");
      setPortfolio([]);
      console.error("Error fetching holdings:", error);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  }, [authUser]);

  const FetchTransactions = useCallback(async () => {
    const userId = authUser?.id;
    if (!userId) return;
    try {
      setIsLoading(true);
      const res = await getAllUserTransaction(userId);
      if (res.status === "success") {
        setTransactions(res.data);
      } else {
        errorMessage(res.message);
        console.table(res);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  }, [authUser]);

  const logout = useCallback(async () => {
    try {
      if (authUser && authUser?.id && authUser?.name) {
        let response = await confirmMessage(
          "you want to logout",
          "Are you sure?",
        );
        if (response) {
          showLoader("Logging out...");
          const response = await logoutApi(authUser?.id, authUser?.name);
          // console.log("logout response", response)
          if (response.status !== "success") {
            errorMessage("Logout failed", "Logout");
            return;
          }
          const status = await deleteSecureCookie("authUser");
          if (status.success) {
            setAuthUser(null);
            router.push("/auth");
            router.refresh();
            // console.log(authUser)
            successMessage("Logout successfully", "Logout");
          } else {
            errorMessage("Logout failed", "Logout");
          }
        } else {
          infoMessage("Logout cancelled...");
        }
      } else {
        infoMessage("No user logged in...");
        router.push("/");
      }
    } catch (error) {
      console.error("logout error:", error);
    } finally {
      hideLoader();
    }
  }, [authUser, hideLoader, router, showLoader]);

  const getUserDataFromContext = useCallback(async () => {
    if (authUser !== null) return authUser;
    try {
      const user = await getSecureCookie("authUser");
      setAuthUser(user?.data);
    } catch (error) {
      console.error("Failed to get data", error);
      return null;
    }
  }, [authUser]);

  const contexValue = useMemo(
    () => ({
      authUser,
      isLoading,
      setIsLoading,
      logout,
      getUserDataFromContext,
      portfolio,
      fetchPortfolio,
      transactions,
      FetchTransactions,
      updateAuthUser,
    }),
    [
      authUser,
      isLoading,
      logout,
      getUserDataFromContext,
      portfolio,
      fetchPortfolio,
      transactions,
      FetchTransactions,
      updateAuthUser,
    ],
  );
  return (
    <userContext.Provider value={contexValue}>{children}</userContext.Provider>
  );
};
