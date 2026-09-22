export const currency = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export const dateFmt = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const initials = (name) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

// payout string into number of days
function resolvePeriodDays(payoutFrequency, tenure) {
  if (!payoutFrequency) {
    throw new Error("Payout frequency is required");
  }

  const key = payoutFrequency.trim().toLowerCase();

  switch (key) {
    case "21 days":
      return 21;
    case "monthly":
      return 30;
    case "quarterly":
      return 90;
    case "half-yearly":
    case "half yearly":
      return 182;
    case "yearly":
      return 365;
    case "tenure-complete":
    case "tenure complete":
      return tenure;
    default:
      throw new Error(`Unknown payout frequency: ${payoutFrequency}`);
  }
}

export const calculateMaturityAmount = (bond) => {
  if (bond.payoutCycle === "tenure-complete")
    return bond.paidAmount * (1 + bond.profitPercentage / 100);
  else {
    let times = Math.floor(
      bond.tenure / resolvePeriodDays(bond.payoutCycle, bond.tenure),
    );
    let interest = (bond.paidAmount * bond.profitPercentage) / 100;
    return bond.paidAmount + interest * times;
  }
};
