export function currency(n) {
  if (typeof n !== "number") {
    return "₹0";
  }
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
