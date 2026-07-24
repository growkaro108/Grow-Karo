"use client";

import { useState, useEffect, use } from "react";
import Sidebar from "./Sidebar";
import dynamic from "next/dynamic";
import { fetchGrahakDashboardData } from "../../../../services/grahakService";
import { userContext } from "@/context/UserContext";
import TabLoader from "../../../loader/TabLoader";

const Overview = dynamic(() => import("./Overview"), {
  loading: () => <TabLoader />,
  ssr: false,
});
const WithDrawFormComponent = dynamic(() => import("./WithDrawFormComponent"), {
  loading: () => <TabLoader />,
  ssr: false,
});
const Portfolio = dynamic(() => import("./Portfolio"), {
  loading: () => <TabLoader />,
  ssr: false,
});
const Transactions = dynamic(() => import("./Transaction"), {
  loading: () => <TabLoader />,
  ssr: false,
});
const Settings = dynamic(() => import("./Settings"), {
  loading: () => <TabLoader />,
  ssr: false,
});

export default function DashboardPage() {
  const [balance, setBalance] = useState(0);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const { authUser } = use(userContext);
  const [dashboardData, setDashboardData] = useState({
    holdings: [],
    transactions: [],
    graphDataMap: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const SAMPLE_HOLDINGS = [
    {
      bondimage:
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80", // Financial Document / Ledger
      bondnumber: "US912828NJ53",
      plan: "Fixed Income Growth",
      investamount: "5000.00",
      tenure: "5 Years",
      investementdate: "2023-01-15",
      maturitydate: "2028-01-15",
      profitdate: "2024-01-15",
      profitpercentage: "4.5",
      perannum: "225.00",
      payoutcycle: "Monthly",
    },
    {
      bondimage:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80", // Corporate Strategy / Business Contract
      bondnumber: "APPLE2026X",
      plan: "Corporate Premium",
      investamount: "10000.00",
      tenure: "3 Years",
      investementdate: "2024-05-10",
      maturitydate: "2027-05-10",
      profitdate: "2025-05-10",
      profitpercentage: "5.2",
      perannum: "520.00",
      payoutcycle: "Monthly",
    },
    {
      bondimage:
        "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80", // Municipal / Government Office Building
      bondnumber: "NYMUNI882",
      plan: "Tax-Free Municipal",
      investamount: "2500.00",
      tenure: "10 Years",
      investementdate: "2020-09-22",
      maturitydate: "2030-09-22",
      profitdate: "2021-09-22",
      profitpercentage: "3.8",
      perannum: "95.00",
      payoutcycle: "Monthly",
    },
    {
      bondimage:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80", // Green Mountains / Sustainability
      bondnumber: "GREEN-SUST-09",
      plan: "Eco-Sustainability Plan",
      investamount: "7500.00",
      tenure: "7 Years",
      investementdate: "2025-02-18",
      maturitydate: "2032-02-18",
      profitdate: "2026-02-18",
      profitpercentage: "6.1",
      perannum: "457.50",
      payoutcycle: "quaterly",
    },
    {
      bondimage:
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80", // Currency / Financial Security
      bondnumber: "UKGILTS-2030",
      plan: "Treasury Gilts",
      investamount: "12000.00",
      tenure: "4 Years",
      investementdate: "2026-03-01",
      maturitydate: "2030-03-01",
      profitdate: "2027-03-01",
      profitpercentage: "4.2",
      perannum: "504.00",
      payoutcycle: "yearly",
    },
    {
      bondimage:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80", // Technology Charts & Screens
      bondnumber: "MSFT-BND-77",
      plan: "Tech Leaders Capital",
      investamount: "15000.00",
      tenure: "2 Years",
      investementdate: "2025-11-12",
      maturitydate: "2027-11-12",
      profitdate: "2026-11-12",
      profitpercentage: "4.8",
      perannum: "720.00",
      payoutcycle: "21 days",
    },
    {
      bondimage:
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80", // Infrastructure Construction / Bridges
      bondnumber: "CAMUNI-991",
      plan: "Infrastructure Yield",
      investamount: "3000.00",
      tenure: "15 Years",
      investementdate: "2018-04-05",
      maturitydate: "2033-04-05",
      profitdate: "2019-04-05",
      profitpercentage: "4.0",
      perannum: "120.00",
      payoutcycle: "7 months",
    },
    {
      bondimage:
        "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80", // Stock Market Dashboard / Inflation Protection
      bondnumber: "US-TIPS-I5",
      plan: "Inflation-Protected",
      investamount: "6000.00",
      tenure: "5 Years",
      investementdate: "2022-07-19",
      maturitydate: "2027-07-19",
      profitdate: "2023-07-19",
      profitpercentage: "5.5",
      perannum: "330.00",
      payoutcycle: "70 days",
    },
    {
      bondimage:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80", // Logistics Warehouse / Supply Chain
      bondnumber: "AMZN-HQ-99",
      plan: "Retail Logistics Bond",
      investamount: "8500.00",
      tenure: "6 Years",
      investementdate: "2023-10-30",
      maturitydate: "2029-10-30",
      profitdate: "2024-10-30",
      profitpercentage: "5.0",
      perannum: "425.00",
      payoutcycle: "monthly",
    },
    {
      bondimage:
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80", // Premium Corporate Executive Setting
      bondnumber: "JP-JGB-342",
      plan: "Sovereign Safe Haven",
      investamount: "20000.00",
      tenure: "10 Years",
      investementdate: "2021-06-14",
      maturitydate: "2031-06-14",
      profitdate: "2022-06-14",
      profitpercentage: "2.5",
      perannum: "500.00",
      payoutcycle: "yearly",
    },
  ];

  useEffect(() => {
    let active = true;
    // setLoading(true);

    fetchGrahakDashboardData("me")
      .then((data) => {
        if (!active) return;
        setBalance(Number(data.balance ?? 0));
        setPortfolioValue(Number(data.portfolioValue ?? 0));
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

  const handleDeposit = () => {
    const amount = prompt("Enter deposit amount:");
    if (amount && !isNaN(amount))
      setBalance((prev) => prev + parseFloat(amount));
  };

  const { holdings, transactions, graphDataMap } = dashboardData;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col lg:flex-row">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userEmail={authUser?.email}
        name={authUser?.name}
      />
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
            <TabLoader />
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
                CURRENT_BALANCE={balance}
                onCancel={() => setActiveTab("overview")}
              />
            )}
            {activeTab === "portfolio" && (
              <Portfolio
                holdings={SAMPLE_HOLDINGS}
                graphDataMap={graphDataMap}
              />
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
