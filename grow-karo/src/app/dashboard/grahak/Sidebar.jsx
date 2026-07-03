"use client";

import Image from "next/image";
import { useState } from "react";

export default function Sidebar({ activeTab, setActiveTab }) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "portfolio", label: "Portfolio", icon: "💼" },
    { id: "transactions", label: "Transactions", icon: "💳" },
    // { id: "history", label: "History", icon: "⏱️" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <>
      {/* Mobile Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="sidebar-navigation"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        className="lg:hidden fixed top-4 left-4 z-50 flex items-center justify-center bg-slate-900 text-white p-3 rounded-xl shadow-xl transition-all duration-300 active:scale-95 hover:bg-slate-800"
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        )}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300 dynamic-fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="sidebar-navigation"
        className={`
          fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-slate-50 border-r border-slate-200/80 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:max-h-[87vh]
          ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        `}
      >
        {/* Top Branding & Nav Link area */}
        <div className="flex flex-col gap-8">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-slate-950 to-slate-800 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-slate-950/20">
              <Image
                src="/shriram.jpg"
                alt="Logo"
                width={40}
                height={40}
                className="object-cover h-full w-full rounded-full shadow"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-slate-900 leading-none text-base">
                Shri Ram
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">
                Premium Invester
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1" role="tablist">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`
          group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 relative 
          active:scale-[0.98] outline-none
          /* Visual states: Active tab stays anchored even when main content is focused */
          ${
            isActive
              ? "bg-blue-700 text-white shadow-sm shadow-slate-900/10 pointer-events-none"
              : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
          }
        `}
                >
                  <span
                    className={`text-base transition-transform group-hover:scale-110 ${isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>

                  {/* Persistent anchor indicator */}
                  {isActive && (
                    <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Account Section Footer */}
        <div className="border-t border-slate-200/60 pt-4 px-2 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs select-none border border-slate-300/40">
            IN
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
              Investor Account
            </p>
            <p
              className="text-sm font-semibold text-slate-700 mt-1 truncate max-w-37.5"
              title="investor@growkaro.com"
            >
              investor@growkaro.com
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
