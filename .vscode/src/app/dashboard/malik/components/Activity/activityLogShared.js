/* ---------------------------------------------------- */
/* Shared constants + mapping helpers for activity logs  */
/* Used by both LiveLogsPanel and RecentLogsPanel so the */
/* two views stay visually + semantically in sync.       */
/* ---------------------------------------------------- */

export const PROCESS_FILTERS = [
  { id: "all", label: "All" },
  { id: "deposit", label: "Deposit" },
  { id: "withdrawal", label: "Withdrawal" },
  { id: "signup", label: "Signup" },
  { id: "kyc", label: "KYC" },
  // { id: "referral", label: "Referral" },
];

export const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "completed", label: "Completed" },
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
];

export const TYPE_DOT = {
  withdrawal: "bg-amber-500",
  deposit: "bg-emerald-500",
  signup: "bg-indigo-500",
  kyc: "bg-indigo-500",
  referral: "bg-indigo-500",
  login: "bg-green-500",
  logout: "bg-fuchia-500",
  password_changed: "bg-yellow-500",
  account_updated: "bg-orange-500",
  scheme_enrolled: "bg-blue-500",
  scheme_withdrawal: "bg-red-500",
  unknown: "bg-slate-500",
};

// Maps backend ActivityType enum -> the short "type" used by this UI
export const BACKEND_TYPE_TO_UI_TYPE = {
  ACCOUNT_CREATED: "signup",
  ACCOUNT_UPDATED: "account_updated",
  LOGIN: "login",
  LOGIN_FAILED: "login",
  LOGOUT: "logout",
  PASSWORD_CHANGED: "password_changed",
  SCHEME_ENROLLED: "scheme_enrolled",
  SCHEME_WITHDRAWAL: "scheme_withdrawal",
  DEPOSIT_REQUESTED: "deposit",
  DEPOSIT_COMPLETED: "deposit",
  WITHDRAWAL_REQUESTED: "withdrawal",
  WITHDRAWAL_APPROVED: "withdrawal",
  WITHDRAWAL_REJECTED: "withdrawal",
  KYC_SUBMITTED: "kyc",
  KYC_APPROVED: "kyc",
  KYC_REJECTED: "kyc",
  REFERRAL_CREATED: "referral",
};

// Maps whatever status string the backend metadata carries -> the UI's status vocabulary
export function normalizeStatus(rawStatus) {
  if (!rawStatus) return undefined;
  const s = rawStatus.toString().toLowerCase();
  if (["completed", "approved", "success", "successful"].includes(s)) return "completed";
  if (["pending", "requested"].includes(s)) return "pending";
  if (["processing", "in_progress"].includes(s)) return "processing";
  return s;
}

export function formatTime(isoString) {
  try {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function formatDate(isoString) {
  try {
    return new Date(isoString).toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// Converts a raw ActivityLog record (as sent by Spring Boot, over REST or SSE)
// into the flat shape this component's UI expects. Keeps `raw` and parsed
// `metadata` around too, so the details modal can show everything even if
// it's not surfaced in the summary row.
export function mapBackendLog(log) {
  let metadata = {};
  if (log.metadata) {
    try {
      metadata = typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata;
    } catch {
      metadata = {};
    }
  }

  return {
    id: log.id,
    name: log.actorName,
    text: log.description?.replace(log.actorName, "").trim() || log.description,
    type: BACKEND_TYPE_TO_UI_TYPE[log.type] ?? (log.type ? String(log.type).toLowerCase() : "unknown"),
    status: normalizeStatus(metadata.status),
    amount:
      metadata.amount !== undefined
        ? `₹${Number(metadata.amount).toLocaleString("en-IN")}`
        : undefined,
    time: formatTime(log.createdAt),
    createdAt: log.createdAt,
    metadata,
    raw: log,
  };
}
