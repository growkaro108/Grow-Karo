export function currency(n) {
  if (typeof n !== "number") {
    return "₹0";
  }
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
export const COMPOUNDS_PER_YEAR = {
    "21 Days": 365 / 21,
    Monthly: 12,
    Quarterly: 4,
    "Half-Yearly": 2,
    Yearly: 1,
};

export function calcMaturityValue(amount, percent, tenureDays, frequency) {
    const principal = Number(amount);
    const rate = Number(percent);
    const days = Number(tenureDays);
    if (!principal || !rate || !days) return "";

    const n = COMPOUNDS_PER_YEAR[frequency] ?? 1;
    const years = days / 365;
    const value = principal * Math.pow(1 + rate / 100 / n, n * years);
    return value.toFixed(2);
}
