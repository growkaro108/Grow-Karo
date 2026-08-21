import React, {
  useEffect,
  useMemo,
  useState,
  useContext,
  useCallback,
} from "react";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import NotificationItem from "./NotificationItem";
import NotificationItemSkeleton from "./NotificationItemSkeleton";
import Pagination from "./Pagination";
import {
  fetchUserNotifications,
  markUserNotificationsAsRead,
} from "@/api/userApi";
import { userContext } from "@/context/UserContext";

const PAGE_SIZE = 6;
const TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
];

export default function NotificationPanel({ onItemClick }) {
  const { authUser } = useContext(userContext) || {};
  const userId = authUser?.id;

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    items: [],
    totalCount: 0,
    unreadCount: 0,
  });

  const totalPages = Math.max(1, Math.ceil((data.totalCount || 0) / PAGE_SIZE));

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUserNotifications(userId, page);
      const resData = res?.data || res || {};
      const rawItems = resData.items || resData.notifications || [];
      const unreadCount = Number(resData.unreadCount ?? 0);
      const totalCount = Number(
        resData.totalItems ?? resData.totalElements ?? rawItems.length,
      );

      const items = rawItems.map((n) => ({
        id: n.id,
        type: n.actionType || n.type || "INFO",
        title: n.title,
        message: n.message,
        date: n.createdAt || new Date().toISOString(),
        read: Boolean(n.read),
        actionUrl: n.actionUrl,
      }));

      setData({
        items: tab === "unread" ? items.filter((n) => !n.read) : items,
        totalCount,
        unreadCount,
      });
    } catch (e) {
      console.error("Error fetching notifications:", e);
      setError("Couldn't load notifications.");
    } finally {
      setLoading(false);
    }
  }, [userId, page, tab]);

  // Initial load & when tab/page/open changes
  useEffect(() => {
    if (userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      load();
    }
  }, [open, load, userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [tab]);

  // Connect to SSE stream for live notifications
  useEffect(() => {
    if (!userId) return;

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
      "http://localhost:9090/api";
    const sseUrl = `${apiBaseUrl}/user/${userId}/notifications/stream`;

    let eventSource;
    try {
      eventSource = new EventSource(sseUrl);

      eventSource.addEventListener("notification", (event) => {
        try {
          const raw = JSON.parse(event.data);
          const newNotif = {
            id: raw.id,
            type: raw.actionType || raw.notificationType || "INFO",
            title: raw.title,
            message: raw.message,
            date: raw.createdAt || new Date().toISOString(),
            read: Boolean(raw.read),
            actionUrl: raw.actionUrl,
          };

          setData((prev) => {
            const exists = prev.items.some((item) => item.id === newNotif.id);
            if (exists) return prev;
            return {
              ...prev,
              items: [newNotif, ...prev.items],
              totalCount: prev.totalCount + 1,
              unreadCount: prev.unreadCount + 1,
            };
          });
        } catch (err) {
          console.error("Error parsing live notification SSE event:", err);
        }
      });
    } catch (err) {
      console.error("Failed to connect to notification SSE stream:", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [userId]);

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
      if (userId) {
        await markUserNotificationsAsRead(userId, [id]);
      }
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
      if (userId) {
        await markUserNotificationsAsRead(userId, []);
      }
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
        className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
      >
        <Bell size={20} />
        {badgeCount && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full text-[10px] font-semibold text-white flex items-center justify-center animate-pulse"
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
            <p className="text-sm font-semibold text-slate-800">
              Notifications
            </p>
            {data.unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline cursor-pointer"
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
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  tab === t.key
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {t.label}
                {t.key === "unread" && data.unreadCount > 0 && (
                  <span className="ml-1 text-emerald-600">
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
                  className="mt-2 text-xs font-medium underline text-emerald-600 cursor-pointer"
                >
                  Try again
                </button>
              </div>
            ) : data.items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Inbox size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-400">
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
