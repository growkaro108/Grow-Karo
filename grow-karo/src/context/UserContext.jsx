'use client'
import react, { createContext, useCallback, useMemo, useState } from "react";
import { confirmMessage, errorMessage, infoMessage, successMessage } from "@/components/Message";
import { useRouter } from "next/navigation";
import { deleteSecureCookie, getSecureCookie } from "./cookiesManagement";



export const userContext = createContext({});
export const UserProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter();


    const logout = useCallback(async () => {
        try {
            if (authUser) {
                let response = await confirmMessage("you want to logout", "Are you sure?");
                if (response) {
                    // const response=await logoutUser(authUser.name);
                    // if(!response.success){
                    //     errorMessage("Logout failed", "Logout");
                    //     return;
                    // }
                    const status = await deleteSecureCookie("authUser")
                    if (status.success) {
                        setAuthUser(null);
                        router.push("/auth");
                        router.refresh();
                        // console.log(authUser)
                        successMessage("Logout successfully", "Logout")
                    } else {
                        errorMessage("Logout failed", "Logout")
                    }
                } else {
                    infoMessage("Logout cancelled...")
                }
            } else {
                infoMessage("No user logged in...")
                router.push("/")
            }
        } catch (error) {
            console.error("logout error:", error)
        }
    }, [authUser, router])

    const getUserDataFromContext = useCallback(async () => {
        if (authUser !== null) return authUser;
        try {
            const user = await getSecureCookie("authUser");
            setAuthUser(user?.data);
        } catch (error) {
            console.error("Failed to get data", error)
            return null;
        }
    }, [authUser]);

    const contexValue = useMemo(() => ({
        authUser,
        setAuthUser,
        isLoading,
        setIsLoading,
        logout,
        getUserDataFromContext
    }), [authUser, getUserDataFromContext, logout]);
    return <userContext.Provider value={contexValue}>
        {children}
    </userContext.Provider>
}