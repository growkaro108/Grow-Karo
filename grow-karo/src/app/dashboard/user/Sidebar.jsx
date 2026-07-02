"use client";

import { useState } from "react";

export default function Sidebar({ activeTab, setActiveTab }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const menuItems = [
    { id: "overview", label: "Overview" },
    { id: "request", label: "Request" },
    { id: "history", label: "History" },
    { id: "accounts", label: "Accounts" },
    { id: "settings", label: "Settings" }
  ];

  return (
    <>
      {/* Mobile Sidebar Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-slate-950 text-white p-3 rounded-full shadow-lg font-medium text-xs tracking-wider uppercase"
      >
        {isOpen ? "Close Menu" : "Menu"}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-auto
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex items-center gap-2 px-2">
          <div className="w-6 h-6 rounded-md bg-slate-950 flex items-center justify-center text-white text-xs font-bold">G</div>
          <span className="font-bold tracking-tight text-slate-900">Grow-Karo</span>
        </div>

        <nav className="flex flex-col gap-1.5 grow">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false);
              }}
              className={`
                w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${activeTab === item.id 
                  ? "bg-slate-950 text-white" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }
              `}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-100 pt-4 px-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">User Account</p>
          <p className="text-sm font-medium text-slate-700 mt-1 truncate">investor@growkaro.com</p>
        </div>
      </aside>
    </>
  );
}