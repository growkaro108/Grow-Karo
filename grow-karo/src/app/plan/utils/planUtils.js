export const currency = (val) => {
  const n = parseFloat(val);
  return Number.isFinite(n)
    ? `₹${n.toLocaleString(undefined, { minimumFractionDigits: 0 })}`
    : "—";
};

export const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

export const formatDateTime = (val) => {
  if (!val) return "—";

  // Truncate microseconds to 3 decimal places (milliseconds)
  const normalizedVal = val.replace(/(\.\d{3})\d+/, "$1");
  const d = new Date(normalizedVal);

  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

export const riskColors = {
  0: { bg: "#ecfdf5", text: "#059669" },
  1: { bg: "#fffbeb", text: "#d97706" },
  2: { bg: "#fef2f2", text: "#dc2626" },
  3: { bg: "#fef2f2", text: "#dc2626" },
};

export const riskLabel = {
  0: "Low",
  1: "Medium",
  2: "High",
  3: "Very_high",
};
