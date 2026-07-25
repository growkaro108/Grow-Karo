"use client";

import React from "react";
import { useLoader } from "@/context/LoaderContext";

export default function GlobalLoader() {
  const { isLoading, message } = useLoader();
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-opacity duration-300">
      <div className="flex flex-col items-center gap-5 rounded-2xl bg-white/90 p-8 shadow-2xl shadow-blue-900/10 border border-white/40 ring-1 ring-slate-900/5 min-w-[280px]">
        {/* Modern Financial Growth Pulse Animation */}
        <div className="relative flex items-end justify-center gap-1.5 h-12 w-16 px-2 py-1">
          {/* Pulsing bars mimicking stock chart trends */}
          <span className="w-2 bg-blue-600 rounded-full animate-[bounce_1s_infinite_100ms] h-1/2"></span>
          <span className="w-2 bg-blue-500 rounded-full animate-[bounce_1s_infinite_200ms] h-3/4"></span>
          <span className="w-2 bg-indigo-600 rounded-full animate-[bounce_1s_infinite_300ms] h-full"></span>
          <span className="w-2 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_400ms] h-2/3"></span>
        </div>

        {/* Dynamic Custom Message */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-semibold tracking-wide text-slate-800 animate-pulse text-center">
            {message}
          </p>
          <span className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">
            Groww Karo
          </span>
        </div>
      </div>
    </div>
  );
}
