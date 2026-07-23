export const STATUS_STYLES = {
  pending: {
    label: "Pending",
    color: "var(--pending)",
    bg: "var(--pending-soft)",
  },
  active: {
    label: "Approved",
    color: "var(--success)",
    bg: "var(--success-soft)",
  },
  rejected: {
    label: "Rejected",
    color: "var(--danger)",
    bg: "var(--danger-soft)",
  },
  withdrawn: {
    label: "Withdrawn",
    color: "var(--text-muted)",
    bg: "rgba(140,150,172,0.14)",
  },
};

export const FILTER_TABS = [
  { key: "pending", label: "Pending", ...STATUS_STYLES.pending },
  { key: "active", label: "Approved", ...STATUS_STYLES.active },
  { key: "rejected", label: "Rejected", ...STATUS_STYLES.rejected },
  { key: "withdrawn", label: "Withdraw request", ...STATUS_STYLES.withdrawn },
  { key: "all", label: "All", color: "var(--gold)", bg: "var(--gold-soft)" },
];

export const currency = (n) => `\u20b9${Number(n || 0).toLocaleString("en-IN")}`;

export const initials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};
