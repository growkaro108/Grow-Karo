import React, { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import NotificationItem from "./NotificationItem";
import NotificationItemSkeleton from "./NotificationItemSkeleton";
import Pagination from "./Pagination";
import {
  fetchMockNotifications,
  mockMarkAllRead,
  mockMarkRead,
} from "./mockNotifications";

const PAGE_SIZE = 6;
const TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
];

/**
 * NotificationPanel
 *
 * Self-contained dropdown: bell trigger with unread badge + panel with
 * All/Unread tabs, pagination, and mark-as-read.
 *
 * Props:
 * - fetchNotifications({ page, pageSize, unreadOnly }) => Promise<{ items, totalCount, unreadCount }>
 * - onMarkRead(id) => Promise<void>
 * - onMarkAllRead() => Promise<void>
 * - onItemClick(notification)  optional, e.g. navigate to actionUrl
 */
const dummyNotifications = [
  {
    id: 1,
    type: "transaction",
    message: "Your SIP investment of ₹10,000 has been processed successfully.",
    date: "2023-01-15T10:30:00Z",
    read: false,
  },
  {
    id: 2,
    type: "scheme",
    message: "New high-yield scheme 'Bond X' launched with 12% returns.",
    date: "2023-01-14T15:20:00Z",
    read: false,
  },
  {
    id: 3,
    type: "account",
    message:
      "Your KYC documents require re-verification. Please upload updated documents.",
    date: "2023-01-13T09:00:00Z",
    read: true,
  },
  {
    id: 4,
    type: "transaction",
    message: "Redemption request of ₹50,000 has been approved.",
    date: "2023-01-12T11:45:00Z",
    read: true,
  },
];

export default function NotificationPanel({
  // fetchNotifications,
  onMarkRead,
  onMarkAllRead,
  onItemClick,
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    items: dummyNotifications,
    totalCount: dummyNotifications.length,
    unreadCount: 2,
  });

  const totalPages = Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE));

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMockNotifications({
        page,
        pageSize: PAGE_SIZE,
        unreadOnly: tab === "unread",
      });
      setData(result);
    } catch (e) {
      setError("Couldn't load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page, tab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [tab]);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!e.target.closest("[data-notification-panel]")) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleMarkRead = async (id) => {
    setData((d) => ({
      ...d,
      items: d.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, d.unreadCount - 1),
    }));
    try {
      await mockMarkRead(id);
    } catch {
      load(); // reconcile with server on failure
    }
  };

  const handleMarkAllRead = async () => {
    setData((d) => ({
      ...d,
      items: d.items.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
    try {
      await mockMarkAllRead();
    } catch {
      load();
    }
  };

  const badgeCount = useMemo(
    () => (data.unreadCount > 99 ? "99+" : data.unreadCount || null),
    [data.unreadCount],
  );

  return (
    <div className="relative" data-notification-panel>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      >
        <Bell size={20} />
        {badgeCount && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full text-[10px] font-semibold text-white flex items-center justify-center"
            style={{ backgroundColor: "#ef4444" }}
          >
            {badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-90 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold" style={{ color: "#1e293b" }}>
              Notifications
            </p>
            {data.unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: "#4f46e5" }}
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-3 pt-2.5">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                style={
                  tab === t.key
                    ? { backgroundColor: "#eef2ff", color: "#4338ca" }
                    : { color: "#64748b" }
                }
              >
                {t.label}
                {t.key === "unread" && data.unreadCount > 0 && (
                  <span
                    className="ml-1"
                    style={{ color: tab === t.key ? "#4338ca" : "#94a3b8" }}
                  >
                    ({data.unreadCount})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="mt-2 max-h-95 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <NotificationItemSkeleton key={i} />
              ))
            ) : error ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-red-500">{error}</p>
                <button
                  type="button"
                  onClick={load}
                  className="mt-2 text-xs font-medium underline"
                  style={{ color: "#4f46e5" }}
                >
                  Try again
                </button>
              </div>
            ) : data.items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Inbox
                  size={28}
                  className="mx-auto mb-2"
                  style={{ color: "#cbd5e1" }}
                />
                <p className="text-sm" style={{ color: "#94a3b8" }}>
                  {tab === "unread"
                    ? "You're all caught up."
                    : "No notifications yet."}
                </p>
              </div>
            ) : (
              data.items.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={handleMarkRead}
                  onClick={onItemClick}
                />
              ))
            )}
          </div>

          {!loading && !error && data.items.length > 0 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
