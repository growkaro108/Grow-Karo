"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Clock,
  Users,
  Percent,
  Calendar,
  IndianRupee,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Pencil,
  ArrowLeft,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import {
  getAllSchemAuditHistory,
  getSelectedHistory,
} from "../../../../../services/malikService";

/**
 * SchemeAuditHistory
 * -------------------------------------------------------------------------
 * Search across schemes, then drill into a scheme's Envers revision history
 * with per-field diff highlighting against the previous revision.
 * Supports light/dark mode, either self-managed or controlled by a parent.
 *
 * Props
 * -----
 * schemes?:        Array<{ schemeId, revisions: [...] }>  (falls back to mock data)
 * theme?:          "light" | "dark"   — pass this to control the theme yourself
 * defaultTheme?:   "light" | "dark"   — initial theme when uncontrolled (default "light")
 * onThemeChange?:  (theme: "light" | "dark") => void   — fired when the toggle is used
 * showThemeToggle?: boolean — hide the built-in sun/moon button if you drive theme externally
 *
 * Expected shape of each item in `revisions`:
 * {
 *   revisionId: number,
 *   revisionType: "ADD" | "MOD" | "DEL",
 *   revisedBy?: string,
 *   updatedAt: string (ISO),
 *   data: {
 *     schemeId, schemeName, schemeCategory, schemeDetails,
 *     payoutFrequency, tenure, startDate, endDate, status,
 *     minimumAmount, profitPercentage, maxInvestorsAllowed,
 *     riskLevel, joinedUsers: string[]
 *   }
 * }
 */

const FIELD_META = [
  { key: "schemeName", label: "Scheme name", type: "text" },
  { key: "schemeCategory", label: "Category", type: "text" },
  { key: "schemeDetails", label: "Details", type: "text" },
  { key: "payoutFrequency", label: "Payout frequency", type: "text" },
  { key: "tenure", label: "Tenure (months)", type: "number" },
  { key: "startDate", label: "Start date", type: "date" },
  { key: "endDate", label: "End date", type: "date" },
  { key: "status", label: "Status", type: "boolean" },
  { key: "minimumAmount", label: "Minimum amount", type: "currency" },
  { key: "profitPercentage", label: "Profit %", type: "percent" },
  { key: "maxInvestorsAllowed", label: "Max investors", type: "number" },
  { key: "riskLevel", label: "Risk level", type: "risk" },
  { key: "joinedUsers", label: "Joined users", type: "list" },
];

// ---------------------------------------------------------------------------
// Theme tokens
// ---------------------------------------------------------------------------
function getTokens(isDark) {
  return isDark
    ? {
        page: "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950",
        heading: "text-slate-100",
        subheading: "text-slate-400",
        panel: "bg-slate-900 border-slate-700",
        panelHeader: "bg-slate-800/60 border-slate-700",
        hairline: "divide-slate-800",
        railLine: "border-slate-700",
        railItem: "hover:bg-slate-800/60",
        railItemSelected: "bg-slate-800 ring-1 ring-slate-600 shadow-md",
        text: "text-slate-100",
        muted: "text-slate-400",
        mutedStrike: "text-slate-500",
        inputBg:
          "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-indigo-500/40 focus:border-indigo-500",
        cardBg: "bg-slate-900 border-slate-700",
        cardHover: "hover:shadow-lg hover:shadow-black/30",
        badgeNeutral: "bg-slate-800 text-slate-300",
        highlightBg: "bg-amber-400/10",
        highlightBar: "bg-amber-400",
        highlightBadge: "bg-amber-400/15 text-amber-300",
        highlightText: "text-amber-300",
        toggleBg: "bg-slate-800 border-slate-700 text-amber-300",
      }
    : {
        page: "bg-gradient-to-br from-indigo-50 via-white to-teal-50",
        heading: "text-slate-900",
        subheading: "text-slate-500",
        panel: "bg-white border-slate-200",
        panelHeader: "bg-gradient-to-r from-slate-50 to-white border-slate-200",
        hairline: "divide-slate-100",
        railLine: "border-slate-200",
        railItem: "hover:bg-white/70",
        railItemSelected: "bg-white shadow-md ring-1 ring-slate-200",
        text: "text-slate-800",
        muted: "text-slate-500",
        mutedStrike: "text-slate-400",
        inputBg:
          "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:ring-indigo-300 focus:border-indigo-300",
        cardBg: "bg-white border-slate-200",
        cardHover: "hover:shadow-md",
        badgeNeutral: "bg-slate-100 text-slate-600",
        highlightBg: "bg-amber-50",
        highlightBar: "bg-amber-400",
        highlightBadge: "bg-amber-100 text-amber-700",
        highlightText: "text-amber-800",
        toggleBg: "bg-white border-slate-200 text-indigo-600",
      };
}

const CATEGORY_PALETTE = {
  light: [
    { bg: "bg-indigo-100", text: "text-indigo-700", bar: "bg-indigo-500" },
    { bg: "bg-teal-100", text: "text-teal-700", bar: "bg-teal-500" },
    { bg: "bg-rose-100", text: "text-rose-700", bar: "bg-rose-500" },
    { bg: "bg-amber-100", text: "text-amber-700", bar: "bg-amber-500" },
    { bg: "bg-violet-100", text: "text-violet-700", bar: "bg-violet-500" },
    { bg: "bg-cyan-100", text: "text-cyan-700", bar: "bg-cyan-500" },
  ],
  dark: [
    { bg: "bg-indigo-500/15", text: "text-indigo-300", bar: "bg-indigo-400" },
    { bg: "bg-teal-500/15", text: "text-teal-300", bar: "bg-teal-400" },
    { bg: "bg-rose-500/15", text: "text-rose-300", bar: "bg-rose-400" },
    { bg: "bg-amber-500/15", text: "text-amber-300", bar: "bg-amber-400" },
    { bg: "bg-violet-500/15", text: "text-violet-300", bar: "bg-violet-400" },
    { bg: "bg-cyan-500/15", text: "text-cyan-300", bar: "bg-cyan-400" },
  ],
};

const RISK_SCALE = {
  light: {
    1: { label: "Low", cls: "bg-emerald-100 text-emerald-700" },
    2: { label: "Moderate", cls: "bg-lime-100 text-lime-700" },
    3: { label: "Elevated", cls: "bg-amber-100 text-amber-700" },
    4: { label: "High", cls: "bg-orange-100 text-orange-700" },
    5: { label: "Severe", cls: "bg-rose-100 text-rose-700" },
  },
  dark: {
    1: { label: "Low", cls: "bg-emerald-500/15 text-emerald-300" },
    2: { label: "Moderate", cls: "bg-lime-500/15 text-lime-300" },
    3: { label: "Elevated", cls: "bg-amber-500/15 text-amber-300" },
    4: { label: "High", cls: "bg-orange-500/15 text-orange-300" },
    5: { label: "Severe", cls: "bg-rose-500/15 text-rose-300" },
  },
};

const REV_BADGE = {
  light: {
    ADD: {
      label: "Created",
      cls: "bg-emerald-100 text-emerald-700",
      dot: "bg-emerald-500",
      Icon: Plus,
    },
    MOD: {
      label: "Updated",
      cls: "bg-violet-100 text-violet-700",
      dot: "bg-violet-500",
      Icon: Pencil,
    },
    DEL: {
      label: "Deleted",
      cls: "bg-rose-100 text-rose-700",
      dot: "bg-rose-500",
      Icon: Minus,
    },
  },
  dark: {
    ADD: {
      label: "Created",
      cls: "bg-emerald-500/15 text-emerald-300",
      dot: "bg-emerald-400",
      Icon: Plus,
    },
    MOD: {
      label: "Updated",
      cls: "bg-violet-500/15 text-violet-300",
      dot: "bg-violet-400",
      Icon: Pencil,
    },
    DEL: {
      label: "Deleted",
      cls: "bg-rose-500/15 text-rose-300",
      dot: "bg-rose-400",
      Icon: Minus,
    },
  },
};

const STATUS_PILL = {
  light: {
    on: "bg-emerald-100 text-emerald-700",
    off: "bg-rose-100 text-rose-700",
  },
  dark: {
    on: "bg-emerald-500/15 text-emerald-300",
    off: "bg-rose-500/15 text-rose-300",
  },
};

function categoryStyle(category, mode) {
  let hash = 0;
  for (let i = 0; i < category.length; i++)
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  const palette = CATEGORY_PALETTE[mode];
  return palette[hash % palette.length];
}

function formatValue(type, value) {
  if (value === null || value === undefined) return "—";
  switch (type) {
    case "currency":
      return `₹${Number(value).toLocaleString("en-IN")}`;
    case "percent":
      return `${value}%`;
    case "boolean":
      return value ? "Active" : "Inactive";
    case "date":
      return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    case "risk":
      return `${RISK_SCALE.light[value]?.label ?? value} (${value}/5)`;
    case "list":
      return Array.isArray(value) ? value.length : "—";
    default:
      return String(value);
  }
}

function diffJoinedUsers(prev = [], curr = []) {
  const prevSet = new Set(prev);
  const currSet = new Set(curr);
  return {
    added: curr.filter((u) => !prevSet.has(u)),
    removed: prev.filter((u) => !currSet.has(u)),
  };
}

function computeChangedKeys(prevData, currData) {
  if (!prevData) return new Set(FIELD_META.map((f) => f.key));
  const changed = new Set();
  for (const { key, type } of FIELD_META) {
    if (type === "list") {
      const { added, removed } = diffJoinedUsers(prevData[key], currData[key]);
      if (added.length || removed.length) changed.add(key);
      continue;
    }
    if (JSON.stringify(prevData[key]) !== JSON.stringify(currData[key])) {
      changed.add(key);
    }
  }
  return changed;
}

function normalizeFetchedRevision(rev) {
  const entity = rev?.scheme ?? rev?.data ?? {};
  const data = entity && typeof entity === "object" ? entity : {};

  return {
    revisionId: rev?.revNumber ?? rev?.revisionId ?? 0,
    revisionType: rev?.type ?? rev?.revisionType ?? "MOD",
    revisedBy: rev?.revisedBy ?? "",
    updatedAt: rev?.changeDate
      ? new Date(rev.changeDate).toISOString()
      : (rev?.updatedAt ?? new Date().toISOString()),
    data: {
      schemeId: data.schemeId ?? rev?.schemeId ?? "",
      schemeName: data.schemeName ?? "",
      schemeCategory: data.schemeCategory ?? "",
      schemeDetails: data.schemeDetails ?? "",
      payoutFrequency: data.payoutFrequency ?? "",
      tenure: data.tenure ?? 0,
      startDate: data.startDate ?? "",
      endDate: data.endDate ?? "",
      status: Boolean(data.status),
      minimumAmount: Number(data.minimumAmount ?? 0),
      profitPercentage: Number(data.profitPercentage ?? 0),
      maxInvestorsAllowed: Number(data.maxInvestorsAllowed ?? 0),
      riskLevel: Number(data.riskLevel ?? 0),
      joinedUsers: Array.isArray(data.joinedUsers) ? data.joinedUsers : [],
    },
  };
}

export default function SchemeAuditHistory({
  schemes: schemesProp,
  theme,
  defaultTheme = "dark",
  onThemeChange,
  showThemeToggle = true,
}) {
  const [allSchemes, setAllSchemes] = useState([]);
  const [detailScheme, setDetailScheme] = useState(null);
  const isControlled = theme === "light" || theme === "dark";
  const [internalTheme, setInternalTheme] = useState(defaultTheme);
  const activeTheme = isControlled ? theme : internalTheme;
  const mode = activeTheme === "dark" ? "dark" : "light";
  const isDark = mode === "dark";
  const T = getTokens(isDark);
  const [selectedSchemeId, setSelectedSchemeId] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function fetchAllSchemeHistory() {
      try {
        const data = await getAllSchemAuditHistory();
        setAllSchemes(Array.isArray(data?.content) ? data.content : []);
      } catch (error) {
        console.error("Failed to load audit history:", error?.message || error);
        setAllSchemes([]);
      }
    }

    fetchAllSchemeHistory();
  }, []);

  useEffect(() => {
    async function fetchSelectedSchemeHistory() {
      if (!selectedSchemeId) {
        setDetailScheme(null);
        return;
      }

      try {
        const res = await getSelectedHistory(selectedSchemeId);
        const revisions = Array.isArray(res?.content)
          ? res.content.map(normalizeFetchedRevision)
          : [];
        setDetailScheme({
          schemeId: selectedSchemeId,
          schemeName: revisions[0]?.data?.schemeName ?? "",
          revisions: [...revisions].sort(
            (a, b) => Number(a.revisionId) - Number(b.revisionId),
          ),
        });
      } catch (error) {
        console.error(
          "Failed to load selected scheme history:",
          error?.message || error,
        );
        setDetailScheme({ schemeId: selectedSchemeId, revisions: [] });
      }
    }

    fetchSelectedSchemeHistory();
  }, [selectedSchemeId]);

  const toggleTheme = () => {
    const next = mode === "dark" ? "light" : "dark";
    if (!isControlled) setInternalTheme(next);
    onThemeChange?.(next);
  };

  const schemeCards = useMemo(() => {
    const source =
      Array.isArray(allSchemes) && allSchemes.length > 0
        ? allSchemes
        : (schemesProp ?? MOCK_SCHEMES);

    return source.map((s) => {
      const item = s?.data
        ? s
        : { schemeId: s.schemeId, revisions: s.revisions ?? [] };
      const revisions =
        Array.isArray(item.revisions) && item.revisions.length > 0
          ? [...item.revisions].sort(
              (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
            )
          : [];

      const latest = revisions.at(-1) ?? {
        data: {
          schemeId: item.schemeId ?? item.scheme?.schemeId ?? "",
          schemeName: item.schemeName ?? item.scheme?.schemeName ?? "",
          schemeCategory:
            item.schemeCategory ?? item.scheme?.schemeCategory ?? "",
          status: item.status ?? item.scheme?.status ?? true,
          riskLevel: item.riskLevel ?? item.scheme?.riskLevel ?? 1,
        },
      };

      return {
        schemeId: item.schemeId ?? item.scheme?.schemeId ?? "",
        revisions,
        latest,
      };
    });
  }, [allSchemes, schemesProp]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // if (!q) return schemeCards;
    if (!q) return allSchemes;

    return allSchemes.filter((s) => {
      const name = s.schemeName ?? "";
      return (
        name.toLowerCase().includes(q) || s.schemeId.toLowerCase().includes(q)
      );
    });
  }, [query, allSchemes]);

  const selected = selectedSchemeId
    ? (detailScheme ??
      schemeCards.find((s) => s.schemeId === selectedSchemeId) ??
      null)
    : null;

  return (
    <div
      className={`min-h-full w-full ${T.page} -m-7 p-6 md:p-10 transition-colors`}
    >
      <div className="max-w-5xl mx-auto">
        {/* <header className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center shadow-sm shrink-0">
              <Sparkles size={17} className="text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-semibold tracking-tight ${T.heading}`}>
                Scheme audit trail
              </h1>
              <p className={`text-sm ${T.subheading}`}>
                Search a scheme, then review every revision and what changed.
              </p>
            </div>
          </div>

          {showThemeToggle && (
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={`h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${T.toggleBg}`}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
        </header> */}

        {!selected ? (
          <>
            <div className="relative mb-5">
              <Search
                size={17}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${T.muted}`}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by scheme name..."
                className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 transition ${T.inputBg}`}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {filtered.map((s) => {
                const cat = categoryStyle(s.schemeCategory, mode);
                const risk = RISK_SCALE[mode][s.riskLevel + 1];
                const statusPill = STATUS_PILL[mode];
                return (
                  <button
                    key={s.schemeId}
                    onClick={() => setSelectedSchemeId(s.schemeId)}
                    className={`text-left rounded-xl border shadow-sm transition-all overflow-hidden group hover:-translate-y-0.5 ${T.cardBg} ${T.cardHover}`}
                  >
                    <div className={`h-1.5 w-full ${cat.bar}`} />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className={`text-xs ${T.muted}`}>
                            {s.schemeId}
                          </div>
                          <div
                            className={`font-medium group-hover:text-indigo-500 transition-colors ${T.text}`}
                          >
                            {s.schemeName}
                          </div>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            s.status ? statusPill.on : statusPill.off
                          }`}
                        >
                          {s.status ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.bg} ${cat.text}`}
                        >
                          {s.schemeCategory}
                        </span>
                        {risk && (
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${risk.cls}`}
                          >
                            {risk.label} risk
                          </span>
                        )}
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${T.badgeNeutral}`}
                        >
                          {s.countOfRevisions ? s.countOfRevisions : 0} revision
                          {s.countOfRevisions?.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p
                  className={`text-sm col-span-full text-center py-10 ${T.muted}`}
                >
                  {query
                    ? `No schemes found for "${query}". Try a different search term.`
                    : "No schemes available."}
                </p>
              )}
            </div>
          </>
        ) : (
          <SchemeDetail
            scheme={selected}
            onBack={() => setSelectedSchemeId(null)}
            mode={mode}
            T={T}
          />
        )}
      </div>
    </div>
  );
}

function SchemeDetail({ scheme, onBack, mode, T }) {
  const revisions = Array.isArray(scheme?.revisions) ? scheme.revisions : [];
  const [selectedIdx, setSelectedIdx] = useState(0);

  const safeIdx =
    revisions.length === 0
      ? 0
      : Math.min(Math.max(selectedIdx, 0), revisions.length - 1);
  const current = revisions[safeIdx] ?? null;
  const previous = current
    ? safeIdx > 0
      ? revisions[safeIdx - 1]
      : null
    : null;

  const changedKeys = useMemo(
    () => computeChangedKeys(previous?.data, current?.data),
    [previous, current],
  );
  const isFirstRevision = previous === null;
  const cat = categoryStyle(current?.data?.schemeCategory ?? "", mode);
  const revBadges = REV_BADGE[mode];

  if (!scheme || !Array.isArray(revisions) || revisions.length === 0) {
    return (
      <div className={`rounded-xl border ${T.panel} p-6 text-sm ${T.muted}`}>
        <div className={`mb-3 font-medium text-base ${T.text}`}>
          No audit data available
        </div>
        Loading revision history for this scheme...
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-600 font-medium mb-4"
      >
        <ArrowLeft size={15} /> All schemes
      </button>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${cat.bg} ${cat.text}`}
        >
          {current.data.schemeCategory}
        </span>
        <h2 className={`text-lg font-semibold ${T.heading}`}>
          {current.data.schemeName}
        </h2>
        <span className={`text-xs ${T.muted}`}>{scheme.schemeId}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
        <ol className={`relative border-l-2 pl-6 space-y-6 ${T.railLine}`}>
          {revisions.map((rev, idx) => {
            const badge = revBadges[rev.revisionType] ?? revBadges.MOD;
            const isSelected = idx === safeIdx;
            return (
              <li key={rev.revisionId} className="relative">
                <span
                  className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 shadow ${
                    mode === "dark" ? "border-slate-950" : "border-white"
                  } ${isSelected ? badge.dot : "bg-slate-400"}`}
                />
                <button
                  onClick={() => setSelectedIdx(idx)}
                  className={`text-left w-full rounded-lg px-3 py-2 transition-all ${
                    isSelected ? T.railItemSelected : T.railItem
                  }`}
                >
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}
                  >
                    <badge.Icon size={12} />
                    {badge.label}
                  </span>
                  <div className={`mt-1.5 text-sm font-medium ${T.text}`}>
                    Rev #{rev.revisionId}
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs mt-0.5 ${T.muted}`}
                  >
                    <Clock size={12} />
                    {new Date(rev.updatedAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {rev.revisedBy && (
                    <div className={`text-xs mt-0.5 ${T.muted}`}>
                      by {rev.revisedBy}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ol>

        <div
          className={`rounded-xl overflow-hidden shadow-sm border ${T.panel}`}
        >
          <div
            className={`flex items-center justify-between px-5 py-4 border-b ${T.panelHeader}`}
          >
            <div>
              <div className={`text-sm font-medium ${T.text}`}>
                Revision #{current.revisionId}
              </div>
              <div className={`text-xs ${T.muted}`}>
                {isFirstRevision
                  ? "Initial record — no prior revision to compare"
                  : `Compared with revision #${previous.revisionId}`}
              </div>
            </div>
            {!isFirstRevision && (
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${T.highlightBadge}`}
              >
                {changedKeys.size} field{changedKeys.size === 1 ? "" : "s"}{" "}
                changed
              </span>
            )}
          </div>

          <dl className={`divide-y ${T.hairline}`}>
            {FIELD_META.map(({ key, label, type }) => {
              const isChanged = !isFirstRevision && changedKeys.has(key);
              const currVal = current.data[key];
              const prevVal = previous?.data[key];

              return (
                <div
                  key={key}
                  className={`px-5 py-3 grid grid-cols-[160px_1fr] gap-4 items-start relative ${
                    isChanged ? T.highlightBg : ""
                  }`}
                >
                  {isChanged && (
                    <span
                      className={`absolute left-0 top-0 bottom-0 w-1 ${T.highlightBar}`}
                    />
                  )}
                  <dt
                    className={`text-sm pt-0.5 flex items-center gap-1.5 ${T.muted}`}
                  >
                    <FieldIcon type={type} muted={T.muted} />
                    {label}
                  </dt>
                  <dd className="text-sm">
                    {type === "list" ? (
                      <UserListDiff
                        isChanged={isChanged}
                        prev={prevVal}
                        curr={currVal}
                        T={T}
                      />
                    ) : type === "boolean" ? (
                      <StatusDiff
                        isChanged={isChanged}
                        prev={prevVal}
                        curr={currVal}
                        mode={mode}
                        T={T}
                      />
                    ) : type === "risk" ? (
                      <RiskDiff
                        isChanged={isChanged}
                        prev={prevVal}
                        curr={currVal}
                        mode={mode}
                        T={T}
                      />
                    ) : (
                      <ScalarDiff
                        isChanged={isChanged}
                        type={type}
                        prev={prevVal}
                        curr={currVal}
                        T={T}
                      />
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </div>
  );
}

function FieldIcon({ type, muted }) {
  const cls = muted;
  if (type === "currency") return <IndianRupee size={13} className={cls} />;
  if (type === "percent") return <Percent size={13} className={cls} />;
  if (type === "date") return <Calendar size={13} className={cls} />;
  if (type === "risk") return <ShieldAlert size={13} className={cls} />;
  if (type === "list") return <Users size={13} className={cls} />;
  return null;
}

function ScalarDiff({ isChanged, type, prev, curr, T }) {
  const numeric = ["currency", "percent", "number"].includes(type);
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      {isChanged && (
        <span
          className={`line-through ${T.mutedStrike} ${numeric ? "font-mono" : ""}`}
        >
          {formatValue(type, prev)}
        </span>
      )}
      <span
        className={`${isChanged ? `font-semibold ${T.highlightText}` : T.text} ${numeric ? "font-mono" : ""}`}
      >
        {formatValue(type, curr)}
      </span>
    </div>
  );
}

function StatusDiff({ isChanged, prev, curr, mode, T }) {
  const pill = STATUS_PILL[mode];
  return (
    <div className="flex items-center gap-2">
      {isChanged && (
        <>
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${prev ? pill.on : pill.off}`}
          >
            {prev ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {prev ? "Active" : "Inactive"}
          </span>
          <span className={T.muted}>→</span>
        </>
      )}
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${curr ? pill.on : pill.off}`}
      >
        {curr ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
        {curr ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

function RiskDiff({ isChanged, prev, curr, mode, T }) {
  const scale = RISK_SCALE[mode];
  const renderPill = (level) => {
    const r = scale[level];
    return (
      <span
        key={level}
        className={`text-xs font-medium px-2 py-0.5 rounded-full ${r?.cls ?? T.badgeNeutral}`}
      >
        {r?.label ?? level} ({level}/5)
      </span>
    );
  };
  return (
    <div className="flex items-center gap-2">
      {isChanged && (
        <>
          {renderPill(prev)}
          <span className={T.muted}>→</span>
        </>
      )}
      {renderPill(curr)}
    </div>
  );
}

function UserListDiff({ isChanged, prev, curr, T }) {
  if (!isChanged) {
    return (
      <span className={`font-mono ${T.text}`}>{curr?.length ?? 0} users</span>
    );
  }
  const { added, removed } = diffJoinedUsers(prev, curr);
  return (
    <div className="space-y-1">
      <span className={`font-mono ${T.text}`}>{curr?.length ?? 0} users</span>
      {added.length > 0 && (
        <div className="text-xs text-emerald-500 flex flex-wrap gap-1 items-center">
          <Plus size={12} /> {added.join(", ")}
        </div>
      )}
      {removed.length > 0 && (
        <div className="text-xs text-rose-500 flex flex-wrap gap-1 items-center">
          <Minus size={12} /> {removed.join(", ")}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mock data — replace with your Envers audit query result across schemes
// ---------------------------------------------------------------------------
const MOCK_SCHEMES = [
  {
    schemeId: "SCH-2024-088",
    revisions: [
      {
        revisionId: 101,
        revisionType: "ADD",
        revisedBy: "priya.sharma",
        updatedAt: "2026-06-01T10:15:00",
        data: {
          schemeId: "SCH-2024-088",
          schemeName: "Growth Plus Deposit",
          schemeCategory: "Fixed Deposit",
          schemeDetails: "Quarterly payout scheme for retail investors.",
          payoutFrequency: "Quarterly",
          tenure: 24,
          startDate: "2026-06-01",
          endDate: "2028-06-01",
          status: true,
          minimumAmount: 25000,
          profitPercentage: 7.5,
          maxInvestorsAllowed: 500,
          riskLevel: 2,
          joinedUsers: ["Amit K.", "Rina D."],
        },
      },
      {
        revisionId: 108,
        revisionType: "MOD",
        revisedBy: "priya.sharma",
        updatedAt: "2026-07-14T09:32:00",
        data: {
          schemeId: "SCH-2024-088",
          schemeName: "Growth Plus Deposit",
          schemeCategory: "Fixed Deposit",
          schemeDetails: "Quarterly payout scheme for retail investors.",
          payoutFrequency: "Quarterly",
          tenure: 24,
          startDate: "2026-06-01",
          endDate: "2028-06-01",
          status: true,
          minimumAmount: 25000,
          profitPercentage: 8.25,
          maxInvestorsAllowed: 750,
          riskLevel: 3,
          joinedUsers: ["Amit K.", "Rina D.", "Sanjay P."],
        },
      },
      {
        revisionId: 119,
        revisionType: "MOD",
        revisedBy: "arvind.rao",
        updatedAt: "2026-08-30T16:04:00",
        data: {
          schemeId: "SCH-2024-088",
          schemeName: "Growth Plus Deposit — Premium",
          schemeCategory: "Fixed Deposit",
          schemeDetails:
            "Quarterly payout scheme for high-value retail investors.",
          payoutFrequency: "Monthly",
          tenure: 24,
          startDate: "2026-06-01",
          endDate: "2028-06-01",
          status: false,
          minimumAmount: 50000,
          profitPercentage: 8.25,
          maxInvestorsAllowed: 750,
          riskLevel: 3,
          joinedUsers: ["Amit K.", "Sanjay P."],
        },
      },
    ],
  },
  {
    schemeId: "SCH-2024-091",
    revisions: [
      {
        revisionId: 55,
        revisionType: "ADD",
        revisedBy: "arvind.rao",
        updatedAt: "2026-04-10T11:00:00",
        data: {
          schemeId: "SCH-2024-091",
          schemeName: "Recurring Saver Lite",
          schemeCategory: "Recurring Deposit",
          schemeDetails:
            "Monthly SIP-style recurring deposit for new investors.",
          payoutFrequency: "Monthly",
          tenure: 12,
          startDate: "2026-04-15",
          endDate: "2027-04-15",
          status: true,
          minimumAmount: 1000,
          profitPercentage: 6.0,
          maxInvestorsAllowed: 2000,
          riskLevel: 1,
          joinedUsers: ["Neha S."],
        },
      },
      {
        revisionId: 62,
        revisionType: "MOD",
        revisedBy: "priya.sharma",
        updatedAt: "2026-05-20T14:22:00",
        data: {
          schemeId: "SCH-2024-091",
          schemeName: "Recurring Saver Lite",
          schemeCategory: "Recurring Deposit",
          schemeDetails:
            "Monthly SIP-style recurring deposit for new investors.",
          payoutFrequency: "Monthly",
          tenure: 12,
          startDate: "2026-04-15",
          endDate: "2027-04-15",
          status: true,
          minimumAmount: 1000,
          profitPercentage: 6.5,
          maxInvestorsAllowed: 2500,
          riskLevel: 1,
          joinedUsers: ["Neha S.", "Vikram T."],
        },
      },
    ],
  },
  {
    schemeId: "SCH-2024-076",
    revisions: [
      {
        revisionId: 30,
        revisionType: "ADD",
        revisedBy: "arvind.rao",
        updatedAt: "2026-02-01T09:00:00",
        data: {
          schemeId: "SCH-2024-076",
          schemeName: "High Yield Bond Pool",
          schemeCategory: "Bond",
          schemeDetails: "High-yield pooled bond scheme, higher risk appetite.",
          payoutFrequency: "Half-Yearly",
          tenure: 36,
          startDate: "2026-02-05",
          endDate: "2029-02-05",
          status: true,
          minimumAmount: 100000,
          profitPercentage: 11.0,
          maxInvestorsAllowed: 150,
          riskLevel: 4,
          joinedUsers: ["Karan M.", "Divya R."],
        },
      },
    ],
  },
];
