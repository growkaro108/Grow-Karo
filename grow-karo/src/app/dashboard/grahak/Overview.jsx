import React, { use, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import TabLoader from "../../../loader/TabLoader";
import { userContext } from "@/context/UserContext";

//dynamic import for Overview component to avoid SSR issues with Chart.js
const StockGraph = dynamic(() => import("./StockGraph"), {
  loading: () => <TabLoader message="Loading stock graph..." />,
  ssr: false,
});

const Overview = () => {
  const { authUser, portfolio } = use(userContext);
  const holding = portfolio?.holdings;
  // console.log(authUser);
  if (!authUser || !holding) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((card) => (
          <div
            key={card}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-end justify-between gap-4 min-h-40"
          >
            <div className="flex flex-col items-start justify-between h-full flex-1 min-w-0">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate w-full">
                  Net Worth
                </p>
                <p className="text-xl sm:text-[27px] font-medium mt-2 text-slate-900 tracking-tight truncate w-full">
                  ₹ 0.00
                </p>
              </div>

              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md inline-block mt-3 wrap-break-word max-w-full text-slate-500 bg-slate-50">
                This is pending
              </span>
            </div>

            <div className="shrink-0 select-none pointer-events-none mb-1">
              <div className="w-14 h-14 bg-slate-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const approvedSchemes = holding?.filter((scheme) => scheme.isApproved);

  const totalInvestment = approvedSchemes?.reduce(
    (sum, scheme) => sum + (scheme.paidAmount || 0),
    0,
  );
  const totalProfit = approvedSchemes?.reduce(
    (sum, scheme) => sum + (scheme.profit || 0),
    0,
  );
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  );

  const profitFromMonthStartToToday = holding
    .filter((scheme) => scheme.isApproved)
    .reduce((total, scheme) => {
      const paidDate = new Date(scheme.paidDate || scheme.enrollmentDate);

      // Checks if paidDate falls between the 1st of the current month and today
      if (paidDate >= startOfMonth && paidDate <= today) {
        return total + (scheme.profit || 0);
      }
      return total;
    }, 0);
  const totalNetWorth =
    totalInvestment +
    totalProfit -
    portfolio?.pendingSum -
    portfolio?.successSum;
  const investmentSchemeCount = approvedSchemes?.length;

  const cardsData = [
    {
      id: "net-worth",
      title: "Total Net Worth",
      value: `₹ ${(totalNetWorth ?? 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      badge: `+₹ ${profitFromMonthStartToToday} this month`,
      isPositiveBadge: true,
      imageSrc: "/muscle.png", // Unique decorative asset
    },
    {
      id: "invested-stocks",
      title: "Invested in Stocks",
      value: `₹ ${(totalInvestment ?? 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      badge: `Allocated across ${investmentSchemeCount ?? 0} schemes`,
      isPositiveBadge: true,
      imageSrc: "/money.png", // Unique decorative asset
    },

    {
      id: "total-profit",
      title: "Available Balance",
      value: `₹ ${(totalProfit - portfolio?.pendingSum ?? 0).toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      )}`,
      badge: `Total redeemed : -₹ ${portfolio?.successSum || 0}`,
      // isPositiveBadge: true,
      imageSrc: "/profit.png", // Unique decorative asset
    },
    {
      id: "cash-balance",
      title: "Pending Withdrawals",
      value: `₹ ${portfolio?.pendingSum || "-"}`,
      badge: `submit for approval`,
      isPositiveBadge: true,
      imageSrc: "/pending.png", // Unique decorative asset
    },
  ];

  return (
    <>
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardsData.map((card) => (
          <div
            key={card.id}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-end justify-between gap-4 min-h-40"
          >
            {/* Left Side: Text Metric Area (flex-1 ensures it dynamically takes remaining space) */}
            <div className="flex flex-col items-start justify-between h-full flex-1 min-w-0">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate w-full">
                  {card.title}
                </p>
                <p className="text-xl sm:text-[27px] font-medium mt-2 text-slate-900 tracking-tight truncate w-full">
                  {card.value}
                </p>
              </div>

              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md inline-block mt-3 wrap-break-word max-w-full ${
                  card.isPositiveBadge
                    ? "text-emerald-600 bg-emerald-50"
                    : "text-slate-500 bg-slate-50"
                }`}
              >
                {card.badge}
              </span>
            </div>

            {/* Right Side: Visual Asset Container (flex-shrink-0 keeps it from getting squished) */}
            {card.imageSrc && (
              <div className="shrink-0 select-none pointer-events-none mb-1">
                <Image
                  src={card.imageSrc}
                  alt={`${card.title} Indicator`}
                  width={56}
                  height={56}
                  className="object-contain"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <StockGraph />
    </>
  );
};

export default Overview;
