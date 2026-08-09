import React from "react";
import { STATUS_META } from "./mockData";

export default function StatusPill({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.active;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}
