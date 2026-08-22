"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bell, Check, Inbox, Wallet } from "lucide-react";
import {
  fetchRemitterNotifications,
  markRemitterNotificationsAsRead,
} from "@/api/remitterApi";
import { buildSseUrl } from "@/api/apiClient";

export default function RemitterNotificationDropdown({ remitterId }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!remitterId) return;
    setLoading(true);
    try {
      const res = await fetchRemitterNotifications(remitterId, 1, 10);
      const data = res?.data || res || {};
      // console.log(data);
      const rawList = data.items || data.notifications || [];
      const count = Number(
        data.unreadCount ?? rawList.filter((n) => !n.read).length,
      );

      const mapped = rawList.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type || n.notificationType,
        actionType: n.actionType,
        time: n.createdAt
          ? new Date(n.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Just now",
        isUnread: !n.read,
      }));

      setNotifications(mapped);
      setUnreadCount(count);
    } catch (e) {
      console.error("Error fetching remitter notifications:", e);
    } finally {
      setLoading(false);
    }
  }, [remitterId]);

  useEffect(() => {
    if (remitterId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadNotifications();
    }
  }, [remitterId, open, loadNotifications]);

  // Subscribe to Remitter SSE stream
  useEffect(() => {
    if (!remitterId) return;

    const sseUrl = buildSseUrl(`remitter/${remitterId}/notifications/stream`);

    let eventSource;
    try {
      eventSource = new EventSource(sseUrl);

      eventSource.addEventListener("notification", (event) => {
        try {
          const raw = JSON.parse(event.data);
          const newNotif = {
            id: raw.id,
            title: raw.title,
            message: raw.message,
            type: raw.notificationType,
            actionType: raw.actionType,
            time: "Just now",
            isUnread: !raw.read,
          };

          setNotifications((prev) => {
            if (prev.some((x) => x.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
          setUnreadCount((prev) => prev + 1);
        } catch (err) {
          console.error("Error parsing remitter notification SSE:", err);
        }
      });
    } catch (err) {
      console.error("Failed to connect remitter notification SSE stream:", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [remitterId]);

  // Outside click close
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!e.target.closest("[data-remitter-notif]")) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleMarkRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      if (remitterId) {
        await markRemitterNotificationsAsRead(remitterId, [id]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
    setUnreadCount(0);
    try {
      if (remitterId) {
        await markRemitterNotificationsAsRead(remitterId, []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative" data-remitter-notif>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
        aria-label="Remitter Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-88 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h4 className="font-bold text-gray-900 text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {loading && (
              <div className="p-6 text-center text-xs text-gray-400">
                Loading alerts...
              </div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="py-8 px-4 text-center">
                <Inbox className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No notifications found.</p>
              </div>
            )}
            {!loading &&
              notifications.length > 0 &&
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 flex items-start gap-3 transition-colors ${
                    n.isUnread ? "bg-emerald-50/40" : "hover:bg-gray-50/60"
                  }`}
                >
                  <div className="p-2 rounded-lg bg-emerald-100/60 text-emerald-700 shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <h5 className="text-xs font-semibold text-gray-900 truncate">
                        {n.title}
                      </h5>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                  {n.isUnread && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n.id)}
                      className="p-1 text-gray-400 hover:text-emerald-600 shrink-0 cursor-pointer"
                      title="Mark read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
