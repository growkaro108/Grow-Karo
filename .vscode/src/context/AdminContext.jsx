'use client'
import { createContext, useMemo, useState } from "react"

export const adminContext = createContext({});
export const AdminContextProvider = ({ children }) => {

    const [malikNotification, setMalikNotification] = useState([]);

    const updateMalikNotification = (notifications) => {
        setMalikNotification(notifications);
    };

    //malik notification provider 
    const contextValue = useMemo(() => ({
        malikNotification,
        setMalikNotification,
        updateMalikNotification
    }), [malikNotification]);

    return (
        <adminContext.Provider value={contextValue}>
            {children}
        </adminContext.Provider>
    )
}