"use client";
import { createContext, useCallback, useMemo, useState } from "react";
import {
  confirmMessage,
  errorMessage,
  infoMessage,
  successMessage,
} from "@/components/Message";
import { useRouter } from "next/navigation";
import { deleteSecureCookie, getSecureCookie } from "./cookiesManagement";
import { logoutApi } from "../../services/grahakService";

export const userContext = createContext({});
export const UserProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const logout = useCallback(async () => {
    if (!(authUser?.id && authUser?.name)) {
      infoMessage("No user logged in...");
      router.push("/");
      return;
    }

    const confirmed = await confirmMessage(
      "you want to logout",
      "Are you sure?",
    );
    if (!confirmed) {
      infoMessage("Logout cancelled...");
      return;
    }

    !isLoading && setIsLoading(true);
    try {
      const response = await logoutApi(authUser?.id, authUser?.name);

      if (response.status !== "success") {
        errorMessage("Logout failed", "Logout");
        return;
      }

      const status = await deleteSecureCookie("authUser");
      if (!status.success) {
        errorMessage("Logout failed", "Logout");
        return;
      }

      setAuthUser(null);
      router.push("/auth");
      router.refresh();
      successMessage("Logout successfully", "Logout");
    } catch (error) {
      console.error("logout error:", error);
      errorMessage("Something went wrong during logout", "Logout");
    } finally {
      setIsLoading(false);
    }
  }, [authUser, isLoading, router]);

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
    }),
    [authUser, getUserDataFromContext, isLoading, logout],
  );
  return (
    <userContext.Provider value={contexValue}>{children}</userContext.Provider>
  );
};
