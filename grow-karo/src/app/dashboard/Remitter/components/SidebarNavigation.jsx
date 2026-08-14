"use client";

import React from "react";

import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  FileText,
  Settings,
  Send,
  X,
} from "lucide-react";

export default function SidebarNavigation({
  activeTab,
  isSidebarOpen,
  onTabChange,
  onToggleSidebar,
}) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "requests", label: "Payment Requests", icon: FileText },
    { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
    { id: "recipients", label: "Recipients", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col justify-between lg:translate-x-0 lg:static lg:inset-0 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Send className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Remit<span className="text-blue-500">Pro</span>
            </span>
          </div>
          <button
            onClick={onToggleSidebar}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <nav className="px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3 p-2 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">
            JD
          </div>
          <div>
            <p className="text-sm font-semibold">John Doe</p>
            <p className="text-xs text-gray-400">Verified Remitter</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
