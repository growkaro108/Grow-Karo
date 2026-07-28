import React from "react";
import { ShieldIcon, CheckIcon } from "./Icons";
import { riskColors, riskLabel } from "../utils/planUtils";
import { FilePenLine } from "lucide-react";

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

export function EnrolledBadge({ count = 1 }) {
  return (
    <div
      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full w-fit"
      style={{ backgroundColor: "#eef2ff", color: "#4338ca" }}
      aria-label={`Enrolled${count > 1 ? ` ${count} times` : ""} in this scheme`}
    >
      <FilePenLine size={13} />
      Enrolled{count > 1 && ` ×${count}`}
    </div>
  );
}
