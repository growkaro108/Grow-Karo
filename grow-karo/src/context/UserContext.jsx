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
import { deleteSecureCookie, getSecureCookie } from "./cookiesManagement";
import { getAllUsersScheme, logoutApi } from "../../services/grahakService";
import { useLoader } from "./LoaderContext";

export const userContext = createContext({});
export const UserProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [portfolio, setPortfolio] = useState([]);

  const { showLoader, hideLoader } = useLoader();

  const router = useRouter();

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
      setAuthUser,
      isLoading,
      setIsLoading,
      logout,
      getUserDataFromContext,
      portfolio,
      setPortfolio,
      fetchPortfolio,
    }),
    [
      authUser,
      fetchPortfolio,
      getUserDataFromContext,
      portfolio,
      isLoading,
      logout,
    ],
  );
  return (
    <userContext.Provider value={contexValue}>{children}</userContext.Provider>
  );
};
