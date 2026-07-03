"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import dynamic from "next/dynamic";
import Loader from "@/components/Loader";

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
  const [balance, setBalance] = useState(12450.75);
  const [portfolioValue, setPortfolioValue] = useState(5700.75);
  const [activeTab, setActiveTab] = useState("overview");
// Mock data simulating user portfolio
    const MOCK_STOCKS = [
      { id: 1, ticker: "AAPL", name: "Apple Inc.", shares: 12, value: 2160.50, change: "+1.2%" },
      { id: 2, ticker: "TSLA", name: "Tesla Inc.", shares: 8, value: 1440.00, change: "-0.8%" },
      { id: 3, ticker: "MSFT", name: "Microsoft Corp.", shares: 5, value: 2100.25, change: "+2.4%" },
    ];
    const MOCK_TRANSACTIONS = [
      { id: 'TXN-1001', date: '2026-07-03', description: 'Dividend Payout - AAPL', type: 'Credit', amount: 125.50, status: 'Completed' },
      { id: 'TXN-1002', date: '2026-07-02', description: 'Deposit via Bank Transfer', type: 'Credit', amount: 5000.00, status: 'Completed' },
      { id: 'TXN-1003', date: '2026-06-28', description: 'Equity Purchase - TSLA', type: 'Debit', amount: 1200.00, status: 'Completed' },
      { id: 'TXN-1004', date: '2026-06-25', description: 'Withdrawal Request', type: 'Debit', amount: 450.00, status: 'Pending' },
      { id: 'TXN-1005', date: '2026-06-20', description: 'Mutual Fund Investment', type: 'Debit', amount: 3000.00, status: 'Failed' },
      { id: 'TXN-1006', date: '2026-06-15', description: 'Bonus Reward', type: 'Credit', amount: 50.00, status: 'Completed' },
    ];
  // Simple handler placeholders for actions
  const handleDeposit = () => {
    const amount = prompt("Enter deposit amount:");
    if (amount && !isNaN(amount))
      setBalance((prev) => prev + parseFloat(amount));
  };

 

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col lg:flex-row">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8 grow">
        {(activeTab === "overview" || activeTab === "portfolio" ) && (
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
            <div>
              <h1 className="text-xl sm:text-[29px] font-bold tracking-tight text-slate-900 flex gap-3">
                Welcome Back, Investor 
                {/* <Image src="/investmen.png" alt="investmen Icon" width={30} height={15} /> */}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
              Here is a summary of your financial portfolio.
            </p>
          </div>

          {/* Quick Action Controls */}
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
        </header>)}
        {/* Overview Cards */}
        {activeTab === "overview" && (
          <Overview balance={balance} portfolioValue={portfolioValue} MOCK_STOCKS={MOCK_STOCKS} />
        )}
        {/* Withdraw Form */}
        {activeTab === "withdraw" && (
          <WithDrawFormComponent
            CURRENT_BALANCE={balance}
            onCancel={() => setActiveTab("overview")}
            />
        )}
        {/* Portfolio Section */}
        {activeTab === "portfolio" && (
          <Portfolio  MOCK_STOCKS={MOCK_STOCKS} />
        )}
        {/* Transactions Section */}
        {activeTab === "transactions" && (
          <Transactions  MOCK_TRANSACTIONS={MOCK_TRANSACTIONS}/>
        )}
        {/* Settings Section */}
        {activeTab === "settings" && (
          <Settings />  
        )}
      </div>
    </div>
  );
}
