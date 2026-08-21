"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Check, 
  Trash2, 
  Wallet, 
  AlertCircle, 
  UserPlus, 
  Zap,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { fetchAdminNotifications, markAdminNotificationsAsRead } from "@/api/adminApi";

export default function NotificationDropdown({ setShowNotifications }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterUnread, setFilterUnread] = useState(false);
  const [loading, setLoading] = useState(false);

  const getIconAndStyle = (type, actionType) => {
    const act = (actionType || type || "").toUpperCase();
    if (act.includes("WITHDRAWAL")) {
      return {
        icon: Wallet,
        iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      };
    }
    if (act.includes("PAYMENT_FAILED") || act.includes("WARNING")) {
      return {
        icon: AlertCircle,
        iconColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      };
    }
    if (act.includes("KYC")) {
      return {
        icon: ShieldCheck,
        iconColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      };
    }
    if (act.includes("INVESTMENT") || act.includes("SCHEME")) {
      return {
        icon: TrendingUp,
        iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      };
    }
    if (act.includes("LIMIT")) {
      return {
        icon: RefreshCw,
        iconColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      };
    }
    return {
      icon: Zap,
      iconColor: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    };
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "Just now";
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString();
    } catch {
      return "Recent";
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminNotifications(1, 30);
      const data = res?.data || res || {};
      const rawList = data.items || data.notifications || [];
      const count = Number(data.unreadCount ?? rawList.filter(n => !n.read).length);

      const mapped = rawList.map(n => {
        const style = getIconAndStyle(n.type, n.actionType);
        return {
          id: n.id,
          type: n.type,
          actionType: n.actionType,
          title: n.title,
          description: n.message,
          time: formatTime(n.createdAt),
          isUnread: !n.read,
          actionUrl: n.actionUrl,
          icon: style.icon,
          iconColor: style.iconColor,
        };
      });

      setNotifications(mapped);
      setUnreadCount(count);
    } catch (e) {
      console.error("Error loading admin notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Subscribe to Admin SSE Stream
  useEffect(() => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:9090/api";
    const sseUrl = `${apiBaseUrl}/admin/notifications/stream`;

    let eventSource;
    try {
      eventSource = new EventSource(sseUrl);

      eventSource.addEventListener("notification", (event) => {
        try {
          const raw = JSON.parse(event.data);
          const style = getIconAndStyle(raw.notificationType, raw.actionType);
          const newNotif = {
            id: raw.id,
            type: raw.notificationType,
            actionType: raw.actionType,
            title: raw.title,
            description: raw.message,
            time: "Just now",
            isUnread: !raw.read,
            actionUrl: raw.actionUrl,
            icon: style.icon,
            iconColor: style.iconColor,
          };

          setNotifications(prev => {
            if (prev.some(x => x.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
          setUnreadCount(prev => prev + 1);
        } catch (err) {
          console.error("Failed to parse admin notification SSE:", err);
        }
      });
    } catch (err) {
      console.error("Failed to connect admin SSE stream:", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const markAsRead = async (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isUnread: false } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await markAdminNotificationsAsRead([id]);
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
    setUnreadCount(0);
    try {
      await markAdminNotificationsAsRead([]);
    } catch (e) {
      console.error(e);
    }
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const displayedNotifications = filterUnread
    ? notifications.filter(n => n.isUnread)
    : notifications;

  return (
    <div className="absolute right-0 mt-2 w-96 rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-black/80 backdrop-blur-xl transition-all duration-300 z-50 overflow-hidden">
      {/* Header Area */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="font-bold text-white text-sm tracking-wide">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-slate-950 animate-pulse">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllRead}
            className="text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs / Filter Controls */}
      <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/60 flex gap-2">
        <button
          onClick={() => setFilterUnread(false)}
          className={`px-3 py-1 text-xs rounded-full font-medium transition-all cursor-pointer ${
            !filterUnread 
              ? "bg-slate-800 text-white border border-slate-700 shadow-sm" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setFilterUnread(true)}
          className={`px-3 py-1 text-xs rounded-full font-medium transition-all cursor-pointer ${
            filterUnread 
              ? "bg-slate-800 text-white border border-slate-700 shadow-sm" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Unread Only {unreadCount > 0 ? `(${unreadCount})` : ""}
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
                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all text-slate-500 hover:text-emerald-400 hover:bg-slate-800 shrink-0 self-center cursor-pointer"
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
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-400 transition-colors py-1 px-3 rounded-lg hover:bg-rose-500/5 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear active feed
          </button>
        </div>
      )}
    </div>
  );
}