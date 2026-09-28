import React from "react";
import { ArrowLeftIcon } from "./Icons";
import { Tab } from "./Tab";
import { RiskBadge, StatusBadge, EnrolledBadge } from "./Badges";
import { currency, formatDate, formatDateTime } from "../utils/planUtils";

const THEMES = {
  day: {
    card: "#ffffff",
    border: "#f1f5f9",
    heading: "#0f172a",
    text: "#475569",
    muted: "#94a3b8",
    panel: "#f8fafc",
    accent: "#4f46e5",
    accentHover: "#4338ca",
    link: "#4f46e5",
  },
  dark: {
    card: "#0f172a",
    border: "#1e293b",
    heading: "#f1f5f9",
    text: "#cbd5e1",
    muted: "#64748b",
    panel: "#111c33",
    accent: "#6366f1",
    accentHover: "#818cf8",
    link: "#818cf8",
  },
};

/**
 * mode: "day" | "dark"  (default "day")
 * `mode` is also passed to Tab and the badges so they can theme themselves.
 */
export default function PlanDetailsPage({
  plan,
  isEnrolled,
  onBack,
  onRequestEnroll,
  mode = "day",
}) {
  const t = THEMES[mode] || THEMES.day;

  const joinedCount = plan.joinedUsers?.length ?? 0;
  const slotsLeft = Math.max(0, (plan.maxInvestorsAllowed ?? 0) - joinedCount);
  const isFull = plan.maxInvestorsAllowed != null && slotsLeft <= 0;

  const terms = Array.isArray(plan.terms)
    ? plan.terms.map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];

  return (
    <div
      className="p-6 rounded-xl shadow-sm border transition-colors"
      style={{ backgroundColor: t.card, borderColor: t.border }}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium mb-5 hover:underline"
        style={{ color: t.link }}
      >
        <ArrowLeftIcon size={16} />
        Back to plans
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <Tab
          data={plan.schemeName}
          title={plan.schemeCategory}
          margin={"0.5"}
          mode={mode}
        />
        <div className="flex items-center gap-2">
          <RiskBadge riskLevel={plan.riskLevel} mode={mode} />
          <StatusBadge status={plan.status} mode={mode} />
        </div>
      </div>

      <p
        className="text-sm leading-relaxed mt-4 max-w-2xl"
        style={{ color: t.text }}
      >
        {plan.schemeDetails}
      </p>

      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-5 mt-6 p-5 rounded-xl"
        style={{ backgroundColor: t.panel }}
      >
        <Tab
          title={"Profit Rate"}
          data={plan.profitPercentage + "% "}
          margin={"1"}
          mode={mode}
        />
        <Tab
          title={"Min. Investment"}
          data={currency(plan.minimumAmount)}
          margin={"1"}
          mode={mode}
        />
        <Tab
          title={"Max. Investment"}
          data={currency(plan.maximumAmount)}
          margin={"1"}
          mode={mode}
        />
        <Tab
          title={"Payout"}
          data={plan.payoutFrequency}
          margin={"1"}
          mode={mode}
        />
        <Tab title={"Tenure"} data={plan.tenure} margin={"1"} mode={mode} />
        <Tab
          title={"Start Date"}
          data={formatDate(plan.startDate)}
          margin={"1"}
          mode={mode}
        />
        <Tab
          title={"End Date"}
          data={formatDate(plan.endDate)}
          margin={"1"}
          mode={mode}
        />
        <Tab
          title={"Investors"}
          data={joinedCount + " / " + (plan.maxInvestorsAllowed ?? "∞")}
          margin={"1"}
          mode={mode}
        />
      </div>

      {terms.length > 0 && (
        <section
          aria-labelledby="plan-terms-heading"
          className="mt-6 p-5 rounded-xl border"
          style={{ borderColor: t.border }}
        >
          <h3
            id="plan-terms-heading"
            className="text-sm font-semibold"
            style={{ color: t.heading }}
          >
            Terms of Scheme
          </h3>
          <ul className="mt-3 space-y-2">
            {terms.map((term, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm leading-relaxed"
                style={{ color: t.text }}
              >
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: t.accent }}
                />
                <span>{term}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs mt-4" style={{ color: t.muted }}>
        Last updated:- {formatDateTime(plan.updatedAt)}
      </p>

      <div className="mt-7 flex items-center gap-3 justify-end">
        {isEnrolled ? (
          <EnrolledBadge mode={mode} />
        ) : (
          <button
            onClick={() => onRequestEnroll(plan)}
            disabled={isFull || !plan.status}
            className="px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: t.accent }}
            onMouseEnter={(e) =>
              !e.currentTarget.disabled &&
              (e.currentTarget.style.backgroundColor = t.accentHover)
            }
            onMouseLeave={(e) =>
              !e.currentTarget.disabled &&
              (e.currentTarget.style.backgroundColor = t.accent)
            }
          >
            {isFull
              ? "Fully subscribed"
              : !plan.status
                ? "Enrollment closed"
                : "Enroll in this plan"}
          </button>
        )}
      </div>
    </div>
  );
}