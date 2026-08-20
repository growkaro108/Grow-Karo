import React from "react";

export default function NotificationItemSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3 animate-pulse">
      <div className="shrink-0 w-9 h-9 rounded-full bg-slate-200" />
      <div className="flex-1 space-y-2 py-0.5">
        <div className="h-3.5 w-2/3 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-200" />
      </div>
    </div>
  );
}
