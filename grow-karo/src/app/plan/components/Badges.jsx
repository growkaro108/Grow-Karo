import React from "react";
import { ShieldIcon, CheckIcon } from "./Icons";
import { riskColors, riskLabel } from "../utils/planUtils";

export function RiskBadge({ riskLevel }) {
  const c = riskColors[riskLevel] ?? 1;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <ShieldIcon size={11} />
      {riskLabel[riskLevel]}
    </span>
  );
}

export function StatusBadge({ status }) {
  return status ? (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: "#ecfdf5", color: "#059669" }}
    >
      Active
    </span>
  ) : (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: "#f1f5f9", color: "#64748b" }}
    >
      Closed
    </span>
  );
}

export function EnrolledBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: "#eef2ff", color: "#4f46e5" }}
    >
      <CheckIcon size={12} />
      Enrolled
    </span>
  );
}
