"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import dynamic from "next/dynamic";
import Loader from "@/components/Loader";
import { fetchGrahakDashboardData } from "./grahakService";

const Overview = dynamic(() => import("./Overview"), {
  loading: () => <Loader />,
  ssr: false,
});
const WithDrawFormComponent = dynamic(() => import("./WithDrawFormComponent"), {
  loading: () => <Loader />,
  ssr: false,
});
const Portfolio = dynamic(() => import("./Portfolio"), {
  loading: () => <Loader />,
  ssr: false,
});
const Transactions = dynamic(() => import("./Transaction"), {
  loading: () => <Loader />,
  ssr: false,
});
const Settings = dynamic(() => import("./Settings"), {
  loading: () => <Loader />,
  ssr: false,
});

export default function DashboardPage() {
  const [balance, setBalance] = useState(0);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState({
    holdings: [],
    transactions: [],
    graphDataMap: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetchGrahakDashboardData("me")
      .then((data) => {
        if (!active) return;
        setBalance(Number(data.balance ?? 0));
        setPortfolioValue(Number(data.portfolioValue ?? 0));
        setDashboardData({
          holdings: Array.isArray(data.holdings) ? data.holdings : [],
          transactions: Array.isArray(data.transactions) ? data.transactions : [],
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

  const handleDeposit = () => {
    const amount = prompt("Enter deposit amount:");
    if (amount && !isNaN(amount)) setBalance((prev) => prev + parseFloat(amount));
  };

  const { holdings, transactions, graphDataMap } = dashboardData;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col lg:flex-row">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8 grow">
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
              <button
                onClick={handleDeposit}
                className="flex-1 sm:flex-none text-center bg-slate-950 text-white hover:bg-slate-800 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
              >
                Deposit Funds
              </button>
              <button
                onClick={() => setActiveTab("withdraw")}
                className="flex-1 sm:flex-none text-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
              >
                Withdraw
              </button>
            </div>
          </header>
        )}

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 flex items-center justify-center min-h-[60vh]">
            <Loader />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 p-4 text-sm">
            {error}
          </div>
        ) : (
          <> 
            {activeTab === "overview" && (
              <Overview
                balance={balance}
                portfolioValue={portfolioValue}
                holdings={holdings}
              />
            )}
            {activeTab === "withdraw" && (
              <WithDrawFormComponent
                CURRENT_BALANCE={balance}
                onCancel={() => setActiveTab("overview")}
              />
            )}
            {activeTab === "portfolio" && (
              <Portfolio holdings={holdings} graphDataMap={graphDataMap} />
            )}
            {activeTab === "transactions" && (
              <Transactions transactions={transactions} />
            )}
            {activeTab === "settings" && <Settings />}
          </>
        )}
      </div>
    </div>
  );
}
