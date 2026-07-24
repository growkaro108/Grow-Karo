import React, { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import TabLoader from "../../../loader/TabLoader";

//dynamic import for Overview component to avoid SSR issues with Chart.js
const StockGraph = dynamic(() => import("./StockGraph"), {
  loading: () => <TabLoader />,
  ssr: false,
});

const Overview = ({ userData }) => {
  if (!userData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <div className="w-14 h-14 bg-slate-100 rounded-xl animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  const cardsData = [
    {
      id: "net-worth",
      title: "Total Net Worth",
      value: `₹ ${userData?.totalInvestmentAmount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      badge: "This is pending",
      isPositiveBadge: true,
      imageSrc: "/muscle.png", // Unique decorative asset
    },
    {
      id: "invested-stocks",
      title: "Invested in Stocks",
      value: `₹ ${userData?.totalInvestmentAmount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      badge: `Allocated across ${userData?.investedSchemeCount} schemes`,
      isPositiveBadge: true,
      imageSrc: "/money.png", // Unique decorative asset
    },
    // {
    //   id: "cash-balance",
    //   title: "Cash Balance",
    //   value: `₹ ${balance.toLocaleString("en-IN", {
    //     minimumFractionDigits: 2,
    //     maximumFractionDigits: 2,
    //   })}`,
    //   badge: "⚠️ Available Limited withdrawal",
    //   isPositiveBadge: true,
    //   imageSrc: "/wallet.png", // Unique decorative asset
    // },
    {
      id: "Pending payments",
      title: "Pending payments",
      value: `₹ ${userData?.remainingPayments.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      badge: "Pending payment",
      // isPositiveBadge: true,
      imageSrc: "/pending.png", // Unique decorative asset
    },
  ];
  return (
    <>
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
