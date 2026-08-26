import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Wallet,
  Settings,
  Circle,
  Check,
} from "lucide-react";

const TYPE_CONFIG = {
  SUCCESS: { icon: CheckCircle2, color: "#16a34a", bg: "#f0fdf4" },
  WARNING: { icon: AlertTriangle, color: "#d97706", bg: "#fffbeb" },
  PAYMENT: { icon: Wallet, color: "#4f46e5", bg: "#eef2ff" },
  SYSTEM: { icon: Settings, color: "#64748b", bg: "#f8fafc" },
  INFO: { icon: Info, color: "#0891b2", bg: "#ecfeff" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Invalid date";

  const diffMs = Date.now() - date.getTime();

  if (diffMs < 60000) return "Just now";

  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function NotificationItem({
  notification,
  onMarkRead,
  onClick,
}) {
  const [expanded, setExpanded] = useState(false);

  const {
    icon: Icon,
    color,
    bg,
  } = TYPE_CONFIG[notification.type] || TYPE_CONFIG.INFO;
  const isUnread = !notification.read;

  const handleClick = () => {
    // console.log("clicked");
    setExpanded((prev) => !prev);
    // if (isUnread) onMarkRead(notification.id);
    onClick?.(notification);
  };

  const handleMarkReadClick = (e) => {
    e.stopPropagation();
    onMarkRead(notification.id);
  };

  return (
    <button
      type="button"
      onClick={() => handleClick()}
      className="w-full text-left flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50 relative"
      style={{ backgroundColor: isUnread ? "#fafafe" : "transparent" }}
    >
      {isUnread && (
        <span
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "#4f46e5" }}
        />
      )}

      <div
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ backgroundColor: bg, color }}
      >
        <Icon size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-sm truncate"
            style={{ color: "#1e293b", fontWeight: isUnread ? 600 : 500 }}
          >
            {notification.title}
          </p>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
              {timeAgo(notification.createdAt)}
            </span>

            {isUnread && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleMarkReadClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleMarkReadClick(e);
                  }
                }}
                title="Mark as read"
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center border transition-colors hover:bg-indigo-50"
                style={{ borderColor: "#c7d2fe", color: "#4f46e5" }}
              >
                <Check size={12} />
              </span>
            )}
          </div>
        </div>

        <p
          className={`text-xs mt-0.5 ${expanded ? "" : "line-clamp-1"}`}
          style={{ color: "#64748b" }}
        >
          {notification.message}
        </p>
      </div>
    </button>
  );
}
