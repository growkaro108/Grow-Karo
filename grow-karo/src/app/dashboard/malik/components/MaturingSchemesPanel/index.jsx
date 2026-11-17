"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Coins, Timer } from "lucide-react";
import PanelLoadingSkeleton from "./PanelSkeleton";

const WithdrawalPaymentsPanel = dynamic(
  () => import("./WithdrawalPaymentsPanel"),
  {
    loading: () => <PanelLoadingSkeleton kind="withdrawal" />,
    ssr: false,
  },
);

const ProfitDuePanel = dynamic(() => import("./ProfitDuePanel"), {
  loading: () => <PanelLoadingSkeleton kind="profitDue" />,
  ssr: false,
});

export default function MaturingSchemesAdminDark() {
  const [activePanelTab, setActivePanelTab] = useState("maturity");
  const [profitDueTotal, setProfitDueTotal] = useState(0);
  const handleProfitDueTotalChange = useCallback((total) => {
    setProfitDueTotal(total);
  }, []);

  return (
    <div className="-m-7 mx-auto min-h-screen w-full max-w-7xl bg-slate-950 p-4 text-slate-100 sm:p-6 lg:p-8">
      <div
        className="mb-5 flex gap-2 border-b border-slate-800"
        role="tablist"
        aria-label="Maturity payments"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activePanelTab === "maturity"}
          onClick={() => setActivePanelTab("maturity")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activePanelTab === "maturity"
              ? "border-indigo-400 text-indigo-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Timer className="h-4 w-4" />
          Withdrawal Payment
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activePanelTab === "profitDue"}
          onClick={() => setActivePanelTab("profitDue")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activePanelTab === "profitDue"
              ? "border-indigo-400 text-indigo-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Coins className="h-4 w-4" />
          Profit Due
          {profitDueTotal > 0 && (
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              {profitDueTotal}
            </span>
          )}
        </button>
      </div>

      <div
        role="tabpanel"
        aria-label={
          activePanelTab === "maturity" ? "Withdrawal Payment" : "Profit Due"
        }
      >
        {activePanelTab === "maturity" ? (
          <WithdrawalPaymentsPanel />
        ) : (
          <ProfitDuePanel onTotalChange={handleProfitDueTotalChange} />
        )}
      </div>
    </div>
  );
}
