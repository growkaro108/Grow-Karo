import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export const PAGE_SIZE = 20;
export const MAX_REPORT_PAGES = 100;
export const ACCOUNT_FILTERS = ["All", "Active", "Inactive"];
export const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
export const EXPORT_OPTIONS = [
  { value: "all", label: "All matching rows" },
  { value: "page", label: "Current page only" },
  { value: "50", label: "First 50 investors" },
  { value: "100", label: "First 100 investors" },
  { value: "500", label: "First 500 investors" },
];
const AVATAR_GRADIENTS = [
  "from-amber-300/90 to-orange-500/80",
  "from-emerald-300/90 to-teal-500/80",
  "from-sky-300/90 to-indigo-500/80",
  "from-fuchsia-300/90 to-purple-500/80",
  "from-rose-300/90 to-pink-500/80",
  "from-lime-300/90 to-emerald-500/80",
];
function initials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}
export function pageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("…");
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push("…");
  items.push(total);
  return items;
}

function amount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeUser(user) {
  if (!user?.name) return null;
  const schemes = (user?.enrolledSchemes ?? []).map((scheme) => {
    const investedAmount = amount(scheme.paidAmount);
    const currentValue =
      investedAmount + amount(scheme.profit) - amount(scheme.profitRedeemed);
    return {
      id: scheme.userSchemeId || "",
      bondNumber: scheme.bondNumber || "-",
      investedAmount: investedAmount || 0,
      currentValue: currentValue || 0,
      maturityAmount: scheme.maturityAmount || 0,
      name: scheme.schemeName || "Unnamed scheme",
      tenure: scheme.tenure || "-",
      profitPercentage: scheme.profitPercentage || 0,
      enrolledOn: scheme.enrollmentDate || scheme.requestDate || "",
      maturityDate: scheme.maturityDate || "-",
      status: String(scheme.status || "pending").toLowerCase(),
      nomineeName: scheme.nominee.name || "",
      nomineeRelation: scheme.nominee.relation || "",
      nomineePhone: scheme.nominee.mobileNo || "",
      nomineeAadhar: scheme.nominee.aadharNo || "",
      bankName: user?.bankDetails?.bankName || "",
      bankAccount: user?.bankDetails?.accountNumber || "",
      bankIfsc: user?.bankDetails?.ifscCode || "",
      bankAccountHolder: user?.bankDetails?.accountHolderName || "",
    };
  });

  return {
    id: String(user?.userId ?? ""),
    customerId: String(user?.customerId ?? ""),
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    joinedDate: user?.joined || "",
    bankName: user?.bankDetails?.bankName || "",
    bankAccount: user?.bankDetails?.accountNumber || "",
    bankIfsc: user?.bankDetails?.ifscCode || "",
    bankAccountHolder: user?.bankDetails?.accountHolderName || "",
    status: user?.isActive ? "Active" : "Inactive",
    totalInvested: schemes.reduce(
      (total, scheme) => total + scheme.investedAmount,
      0,
    ),
    currentValue: schemes.reduce(
      (total, scheme) => total + scheme.currentValue,
      0,
    ),
    schemes,
  };
}

export function displayStatus(status) {
  return status
    ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    : "Unknown";
}

export function formatPercent(value) {
  const n = amount(value);
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}
export function avatarGradient(seed) {
  let hash = 0;
  for (const character of String(seed))
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}
export function Avatar({ name, seed, size = "md" }) {
  const dims = size === "lg" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs";
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl bg-gradient-to-br font-semibold text-slate-900 shadow-sm ring-1 ring-white/20 ${dims} ${avatarGradient(seed)}`}
    >
      {initials(name)}
    </span>
  );
}
export function StatusPill({ status, label }) {
  const tone = statusTone(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${tone.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {label ?? status}
    </span>
  );
}

function statusTone(status) {
  const normalized = String(status).toLowerCase();
  if (["active", "approved", "matured", "completed"].includes(normalized)) {
    return {
      pill: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25",
      dot: "bg-emerald-400",
    };
  }
  if (["pending", "processing"].includes(normalized)) {
    return {
      pill: "bg-amber-400/10 text-amber-300 ring-amber-400/25",
      dot: "bg-amber-400",
    };
  }
  if (["rejected", "inactive", "cancelled", "failed"].includes(normalized)) {
    return {
      pill: "bg-rose-400/10 text-rose-300 ring-rose-400/25",
      dot: "bg-rose-400",
    };
  }
  return {
    pill: "bg-slate-700/60 text-slate-300 ring-slate-600/50",
    dot: "bg-slate-400",
  };
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  dashed = false,
  bare = false,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-14 text-center ${
        bare
          ? ""
          : `mt-6 rounded-2xl border bg-white/[0.02] ${dashed ? "border-dashed border-white/15" : "border-white/10"}`
      }`}
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#C9A66B]/10 ring-1 ring-[#C9A66B]/25">
        <Icon size={22} className="text-[#D8BC82]" />
      </span>
      <p className="mt-4 text-sm font-semibold text-slate-100">{title}</p>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
        {text}
      </p>
    </div>
  );
}
export function ReturnBadge({ value, large = false }) {
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold tabular-nums ring-1 ${
        large ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-[11px]"
      } ${up ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25" : "bg-rose-400/10 text-rose-300 ring-rose-400/25"}`}
    >
      {up ? (
        <ArrowUpRight size={large ? 15 : 12} />
      ) : (
        <ArrowDownRight size={large ? 15 : 12} />
      )}
      {formatPercent(value)}
    </span>
  );
}
