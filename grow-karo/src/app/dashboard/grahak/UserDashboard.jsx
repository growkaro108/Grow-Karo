"use client";

import { useState, useEffect, use } from "react";
import Sidebar from "./Sidebar";
import dynamic from "next/dynamic";
import {
  fetchGrahakDashboardData,
} from "../../../../services/grahakService";
import { userContext } from "@/context/UserContext";
import TabLoader from "../../../loader/TabLoader";
import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";
import NotificationPanel from "./Notification/NotificationPanel";

const Overview = dynamic(() => import("./Overview"), {
  loading: () => <TabLoader message={"Loading overview..."} />,
  ssr: false,
});
const WithDrawFormComponent = dynamic(() => import("./WithDrawFormComponent"), {
  loading: () => <TabLoader message={"Loading withdrawal form..."} />,
  ssr: false,
});
const Portfolio = dynamic(() => import("./Portfolio/index"), {
  loading: () => <TabLoader message={"Loading portfolio..."} />,
  ssr: false,
});
const Transactions = dynamic(() => import("./Transaction"), {
  loading: () => <TabLoader message={"Loading transactions..."} />,
  ssr: false,
});
const Settings = dynamic(() => import("./Settings"), {
  loading: () => <TabLoader message={"Loading settings..."} />,
  ssr: false,
});

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const [withdrawType, setWithdrawType] = useState("general");
  const { authUser, fetchPortfolio, isLoading } = use(userContext);
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState({
    holdings: [],
    transactions: [],
    graphDataMap: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    // setLoading(true);

    fetchGrahakDashboardData("me")
      .then((data) => {
        if (!active) return;
        setDashboardData({
          holdings: Array.isArray(data.holdings) ? data.holdings : [],
          transactions: Array.isArray(data.transactions)
            ? data.transactions
            : [],
          graphDataMap: data.graphDataMap ?? {},
        });
      })
      .catch((fetchError) => {
        if (!active) return;
        console.error(fetchError);
        setError(fetchError?.message ?? "Unable to load Grahak data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function openGeneralWithdrawModal() {
    // setWithdrawData(authUser);
    setWithdrawType("general");
    setActiveTab("withdraw");
  }

  const { transactions } = dashboardData;
  useEffect(() => {
    if (!authUser) {
      router.replace("/auth");
    }
    fetchPortfolio();
  }, [authUser, fetchPortfolio, router]);

  const handleRefresh = () => {
    setLoading(true);
    fetchPortfolio();
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col lg:flex-row">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userEmail={authUser?.email}
        name={authUser?.name}
      />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:pt-8 flex flex-col gap-7 grow">
        {(activeTab === "overview" || activeTab === "portfolio") && (
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
            <div>
              <h1 className="text-xl sm:text-[29px] font-bold tracking-tight text-slate-900 flex gap-3">
                Welcome Back, Investor
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Here is a summary of your financial portfolio.
              </p>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              {/* <button
                onClick={() => openAggressiveWithdrawal()}
                className="flex-1 sm:flex-none text-center bg-red-600 text-white hover:bg-red-700 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm cursor-pointer"
              >
                Agresive Withdraw
              </button> */}
              <button
              type="button"
                onClick={() => openGeneralWithdrawModal()}
                className="flex-1 sm:flex-none text-center bg-green-500 text-white hover:bg-green-600 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm cursor-pointer focus:cursor-wait"
              >
                Withdraw
              </button>
              {/* refresh dashboard button */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="flex-1 sm:flex-none text-center bg-blue-500 text-white hover:bg-blue-600 px-4 py-2.5 rounded-lg font-light text-sm transition-colors shadow-sm cursor-pointer focus:cursor-wait flex gap-2 items-center"
              >
                <RefreshCcw
                  size={15}
                  color="white"
                  className={loading ? "animate-spin" : "backdrop-opacity-80"}
                />{" "}
                {loading ? "Refreshing..." : "Refresh"}
              </button>
              <NotificationPanel />
            </div>
          </header>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 flex items-center justify-center min-h-[60vh]">
            <TabLoader message="Fetching details..." />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 p-4 text-sm">
            {error}
          </div>
        ) : (
          <>
            {activeTab === "overview" && <Overview userData={authUser} />}
            {activeTab === "withdraw" && (
              <WithDrawFormComponent
                onCancel={() => setActiveTab("overview")}
                userData={authUser}
                withdrawType={withdrawType}
              />
            )}
            {activeTab === "portfolio" && (
              <Portfolio refresh={() => fetchPortfolio()} loading={loading} />
            )}
            {activeTab === "transactions" && (
              <Transactions transactions={transactions} />
            )}
            {/* {activeTab === "notification" && <NotificationPanel />} */}
            {activeTab === "settings" && <Settings />}
          </>
        )}
      </div>
    </div>
  );
}
