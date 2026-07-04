"use client";

import React from "react";
import { 
  User, 
  Shield, 
  Settings, 
  LogOut, 
  Activity, 
  ExternalLink 
} from "lucide-react";

export default function ProfileDropdown() {
  // Mock data reflecting current session context
  const adminUser = {
    name: "Admin User",
    email: "superadmin@vantage.io",
    role: "Super Admin",
    initials: "AD"
  };

  return (
    <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-black/80 backdrop-blur-xl z-50 overflow-hidden transition-all duration-300">
      
      {/* Admin User Context Header */}
      <div className="p-4 bg-slate-900/40 border-b border-slate-800 flex items-center space-x-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md shadow-teal-500/10">
          {adminUser.initials}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-white truncate">{adminUser.name}</h4>
          <p className="text-xs text-slate-400 truncate mt-0.5">{adminUser.email}</p>
        </div>
      </div>

      {/* Role & Security Badging */}
      <div className="px-4 py-2 bg-slate-900/20 border-b border-slate-800/60 flex items-center justify-between text-[11px]">
        <span className="text-slate-500 font-medium uppercase tracking-wider">Access Level</span>
        <span className="px-2 py-0.5 font-bold rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center gap-1">
          <Shield className="h-3 w-3" /> {adminUser.role}
        </span>
      </div>

      {/* Menu Options Group */}
      <div className="p-2 space-y-0.5">
        <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition-all group">
          <User className="h-4 w-4 text-slate-500 group-hover:text-teal-400 transition-colors" />
          <span className="flex-1 text-left">My Profile</span>
        </button>

        {/* <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition-all group">
          <Settings className="h-4 w-4 text-slate-500 group-hover:text-teal-400 transition-colors" />
          <span className="flex-1 text-left">System Settings</span>
        </button>

        <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition-all group">
          <Activity className="h-4 w-4 text-slate-500 group-hover:text-teal-400 transition-colors" />
          <span className="flex-1 text-left">Security Audit Log</span>
        </button> */}
      </div>

      {/* Separator */}
      <div className="border-t border-slate-900" />

      {/* Auxiliary Link & Session Actions */}
      <div className="p-2 bg-slate-950/40">
        <a 
          href="/" 
          target="_blank"
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-300 transition-colors"
        >
          <span>View Public Platform</span>
          <ExternalLink className="h-3 w-3" />
        </a>

        <button 
          onClick={() => console.log("Terminating Admin Session...")}
          className="w-full flex items-center space-x-3 px-3 py-2.5 mt-1 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/5 transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span>Terminate Session</span>
        </button>
      </div>

    </div>
  );
}