"use client";

import React, { useState } from "react";
import { 
  Bell, 
  Check, 
  Trash2, 
  Wallet, 
  AlertCircle, 
  UserPlus, 
  Zap 
} from "lucide-react";

export default function NotificationDropdown({ setShowNotifications }) {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "withdrawal",
      title: "High-Value Withdrawal Requested",
      description: "Fatima Sheikh requested a withdrawal of ₹39,083.",
      time: "Just now",
      isUnread: true,
      icon: Wallet,
      iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      id: 2,
      type: "issue",
      title: "Critical Ticket Submitted",
      description: "KYC Failure reported by Marcus Vance requiring urgent override.",
      time: "12m ago",
      isUnread: true,
      icon: AlertCircle,
      iconColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
    {
      id: 3,
      type: "user",
      title: "New Fundraiser Code Active",
      description: "Rohan Kulkarni joined the platform using a custom promotional code.",
      time: "1h ago",
      isUnread: false,
      icon: UserPlus,
      iconColor: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    },
  ]);

  const [filterUnread, setFilterUnread] = useState(false);

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isUnread: false } : n))
    );
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const displayedNotifications = filterUnread
    ? notifications.filter(n => n.isUnread)
    : notifications;

  const unreadCount = notifications.filter(n => n.isUnread).length;

  return (
    <div className="absolute right-0 mt-2 w-96 rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-black/80 backdrop-blur-xl transition-all duration-300 z-50 overflow-hidden">
      {/* Header Area */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="font-bold text-white text-sm tracking-wide">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-slate-950">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllRead}
            className="text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs / Filter Controls */}
      <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/60 flex gap-2">
        <button
          onClick={() => setFilterUnread(false)}
          className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
            !filterUnread 
              ? "bg-slate-800 text-white border border-slate-700 shadow-sm" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setFilterUnread(true)}
          className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
            filterUnread 
              ? "bg-slate-800 text-white border border-slate-700 shadow-sm" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Unread Only
        </button>
      </div>

      {/* Notification Body Container */}
      <div className="max-h-90 overflow-y-auto divide-y divide-slate-900">
        {displayedNotifications.length > 0 ? (
          displayedNotifications.map((n) => {
            const IconComponent = n.icon;
            return (
              <div 
                key={n.id} 
                className={`p-4 flex items-start gap-3 transition-colors duration-200 relative group ${
                  n.isUnread ? "bg-slate-900/30" : "hover:bg-slate-900/20"
                }`}
              >
                {/* Active Indicator Bar */}
                {n.isUnread && (
                  <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500 rounded-r" />
                )}

                {/* Categorized Icon Wrapper */}
                <div className={`p-2 rounded-xl border shrink-0 ${n.iconColor}`}>
                  <IconComponent className="h-4 w-4" />
                </div>

                {/* Notification Content Texts */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="text-xs font-semibold text-slate-100 truncate tracking-wide">
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-slate-500 shrink-0 whitespace-nowrap">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal line-clamp-2">
                    {n.description}
                  </p>
                </div>

                {/* Interactive Action Node */}
                {n.isUnread && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all text-slate-500 hover:text-emerald-400 hover:bg-slate-800 shrink-0 self-center"
                    title="Mark as read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
            <Zap className="h-6 w-6 text-slate-700 mb-2 stroke-[1.5]" />
            <p className="text-xs text-slate-400 font-medium">All caught up!</p>
            <p className="text-[11px] text-slate-600 mt-0.5">No actionable alerts found.</p>
          </div>
        )}
      </div>

      {/* Footer Utility Actions */}
      {notifications.length > 0 && (
        <div className="p-3 bg-slate-950 border-t border-slate-900 flex justify-center">
          <button 
            onClick={clearAll}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-400 transition-colors py-1 px-3 rounded-lg hover:bg-rose-500/5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear active feed
          </button>
        </div>
      )}
    </div>
  );
}