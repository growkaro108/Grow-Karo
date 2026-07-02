"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

// Mock data simulating user portfolio
const MOCK_STOCKS = [
  { id: 1, ticker: "AAPL", name: "Apple Inc.", shares: 12, value: 2160.50, change: "+1.2%" },
  { id: 2, ticker: "TSLA", name: "Tesla Inc.", shares: 8, value: 1440.00, change: "-0.8%" },
  { id: 3, ticker: "MSFT", name: "Microsoft Corp.", shares: 5, value: 2100.25, change: "+2.4%" },
];

const MOCK_TRANSACTIONS = [
  { id: 1, type: "Deposit", amount: 5000.00, date: "2026-06-28", status: "Success" },
  { id: 2, type: "Withdrawal", amount: 1200.00, date: "2026-06-15", status: "Success" },
  { id: 3, type: "Buy AAPL", amount: 432.10, date: "2026-06-10", status: "Success" },
];

export default function DashboardPage() {
  const [balance, setBalance] = useState(12450.75);
  const [portfolioValue, setPortfolioValue] = useState(5700.75);
  const [activeTab, setActiveTab] = useState("stocks"); // stocks | payments

  // Simple handler placeholders for actions
  const handleDeposit = () => {
    const amount = prompt("Enter deposit amount:");
    if (amount && !isNaN(amount)) setBalance(prev => prev + parseFloat(amount));
  };

  const handleWithdraw = () => {
    const amount = prompt("Enter withdrawal amount:");
    if (amount && !isNaN(amount) && parseFloat(amount) <= balance) {
      setBalance(prev => prev - parseFloat(amount));
    } else if (parseFloat(amount) > balance) {
      alert("Insufficient funds!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col">
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8 grow">
        
        {/* Reused App Navbar */}
        <Navbar />

        {/* Dashboard Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Welcome Back, Investor</h1>
            <p className="text-sm text-slate-500">Here is a summary of your financial portfolio.</p>
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
              onClick={handleWithdraw}
              className="flex-1 sm:flex-none text-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              Withdraw
            </button>
          </div>
        </header>

        {/* Financial Overview Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Net Worth</p>
            <p className="text-2xl sm:text-3xl font-bold mt-2 text-slate-900">${(balance + portfolioValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-2">+4.2% this week</span>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Cash Balance</p>
            <p className="text-2xl sm:text-3xl font-bold mt-2 text-slate-900">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <span className="text-xs text-slate-400 inline-block mt-2">Available instantly for withdrawal</span>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Invested in Stocks</p>
            <p className="text-2xl sm:text-3xl font-bold mt-2 text-slate-900">${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <span className="text-xs text-slate-500 inline-block mt-2">Allocated across {MOCK_STOCKS.length} assets</span>
          </div>
        </section>

        {/* Management Interface Tabs */}
        <main className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden grow flex flex-col">
          <div className="border-b border-slate-200 px-6 pt-4 flex gap-6">
            <button
              onClick={() => setActiveTab("stocks")}
              className={`pb-3 font-semibold text-sm transition-colors relative ${activeTab === "stocks" ? "text-slate-950" : "text-slate-400 hover:text-slate-600"}`}
            >
              Stock Holdings
              {activeTab === "stocks" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950" />}
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`pb-3 font-semibold text-sm transition-colors relative ${activeTab === "payments" ? "text-slate-950" : "text-slate-400 hover:text-slate-600"}`}
            >
              Payment & Withdrawal History
              {activeTab === "payments" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950" />}
            </button>
          </div>

          <div className="p-6 grow overflow-x-auto">
            {activeTab === "stocks" ? (
              /* STOCKS TABLE */
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3">Asset</th>
                    <th className="pb-3">Shares Owned</th>
                    <th className="pb-3">Market Value</th>
                    <th className="pb-3 text-right">Day Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {MOCK_STOCKS.map((stock) => (
                    <tr key={stock.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4">
                        <div className="font-bold text-slate-900">{stock.ticker}</div>
                        <div className="text-xs text-slate-400">{stock.name}</div>
                      </td>
                      <td className="py-4 text-slate-600 font-medium">{stock.shares}</td>
                      <td className="py-4 text-slate-900 font-semibold">${stock.value.toFixed(2)}</td>
                      <td className={`py-4 text-right font-bold ${stock.change.startsWith("+") ? "text-emerald-600" : "text-rose-600"}`}>
                        {stock.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* TRANSACTIONS TABLE */
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {MOCK_TRANSACTIONS.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 font-semibold text-slate-900">{tx.type}</td>
                      <td className="py-4 text-slate-500">{tx.date}</td>
                      <td className="py-4">
                        <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-1 rounded-md">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 text-right font-bold text-slate-900">
                        ${tx.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}