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

export const toDateInputValue = (value) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
};

export const calculateMaturityDate = (startDate, tenure) => {
  if (!startDate || !Number.isFinite(Number(tenure)) || Number(tenure) <= 0) {
    return "";
  }

  const [year, month, day] = startDate.split("-").map(Number);
  if (!year || !month || !day) return "";

  const addMonths = (months) => {
    const firstOfMonth = new Date(Date.UTC(year, month - 1 + months, 1));
    const lastDay = new Date(
      Date.UTC(
        firstOfMonth.getUTCFullYear(),
        firstOfMonth.getUTCMonth() + 1,
        0,
      ),
    ).getUTCDate();
    firstOfMonth.setUTCDate(Math.min(day, lastDay));
    return firstOfMonth;
  };

  let maturity;
  const days = Number(tenure);
  if (days === 730 || days === 731) {
    maturity = addMonths(24);
  } else if (days === 365 || days === 366) {
    maturity = addMonths(12);
  } else if (days >= 180 && days <= 183) {
    maturity = addMonths(6);
  } else if (days === 90) {
    maturity = addMonths(3);
  } else {
    maturity = new Date(Date.UTC(year, month - 1, day + days));
  }

  return [
    maturity.getUTCFullYear(),
    String(maturity.getUTCMonth() + 1).padStart(2, "0"),
    String(maturity.getUTCDate()).padStart(2, "0"),
  ].join("-");
};

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

// if anyone is zero not return
// if year  eg. 1 yr 2 month 4 days
// if months eg. 2 month 4 days
// if days eg. 4 days

export const daysToMonths = (days) => {
  if (days === null || days === undefined || isNaN(days)) return "--";

  let remaining = Number(days);
  const result = [];

  // Years
  const years = Math.floor(remaining / 365);
  if (years > 0) {
    result.push(`${years} yr`);
    remaining %= 365;
  }

  // Months
  const months = Math.floor(remaining / 30);
  if (months > 0) {
    result.push(`${months} month`);
    remaining %= 30;
  }

  // Days (only if non-zero)
  if (remaining > 0) {
    result.push(`${remaining} days`);
  }

  return result.length > 0 ? result.join(" ") : "0 days";
};

/**
 * Validates the sanitized payload against security and business logic rules.
 */
export function validatePayload(payload) {
  const errors = [];

  // Regular Expressions
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[6-9]\d{9}$/; // 10-digit Indian Mobile
  const aadharRegex = /^\d{12}$/; // 12-digit Aadhar
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/; // 11-character Indian IFSC
  const accountNoRegex = /^\d{9,18}$/; // 9-18 digit Bank Account Number

  // Standard validations
  if (!payload.name) errors.push("Name is required.");
  if (!payload.email || !emailRegex.test(payload.email))
    errors.push("Valid email address is required.");
  if (!payload.phone || !phoneRegex.test(payload.phone))
    errors.push("Valid 10-digit phone number is required.");

  if (!payload.aadharNo || !aadharRegex.test(payload.aadharNo)) {
    errors.push("Aadhar number must be a valid 12-digit number.");
  }

  if (payload.dob && Number.isNaN(Date.parse(payload.dob))) {
    errors.push("Date of birth must be a valid date.");
  }

  // Guardian validations
  if (!payload.guardian.name) errors.push("Guardian name is required.");
  if (!payload.guardian.relation) errors.push("Guardian relation is required.");

  // Nominee validations
  if (payload.nominee.aadharNo && !aadharRegex.test(payload.nominee.aadharNo)) {
    errors.push("Nominee Aadhar number must be a valid 12-digit number.");
  }
  if (payload.nominee.mobileNo && !phoneRegex.test(payload.nominee.mobileNo)) {
    errors.push("Nominee mobile number must be a valid 10-digit phone number.");
  }

  // Bank validations
  if (!payload.bankName) errors.push("Bank name is required.");
  if (!payload.accountHolderName)
    errors.push("Account holder name is required.");
  if (!payload.accountNumber || !accountNoRegex.test(payload.accountNumber)) {
    errors.push("Valid bank account number (9 to 18 digits) is required.");
  }
  if (!payload.ifscCode || !ifscRegex.test(payload.ifscCode)) {
    errors.push(
      "Valid 11-character IFSC code is required (e.g., BKID0001234).",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
/**
 * Sanitizes and formats raw user input into the target payload schema.
 */
export function sanitizePayload(rawInput) {
  // Helper to extract nested or flattened dot-notation fields safely
  const getVal = (nestedKey, flatKey) => {
    if (nestedKey !== undefined && nestedKey !== null) return nestedKey;
    if (flatKey && rawInput[flatKey] !== undefined) return rawInput[flatKey];
    return "";
  };

  const cleanString = (val) => (val ? String(val).trim() : null);

  const payload = {
    name: cleanString(rawInput.name),
    email: cleanString(rawInput.email)?.toLowerCase() || null,
    phone: cleanString(rawInput.phone),
    passwordHash: cleanString(rawInput.passwordHash), // NOTE: Hash this value before saving!
    dob: cleanString(rawInput.dob) || null,
    maritalStatus: cleanString(rawInput.maritalStatus) || "Single",
    aadharNo: cleanString(rawInput.aadharNo),

    guardian: {
      name: cleanString(getVal(rawInput.guardian?.name, "guardian.name")),
      relation: cleanString(
        getVal(rawInput.guardian?.relation, "guardian.relation"),
      ),
    },

    address: cleanString(rawInput.address),

    nominee: {
      name: cleanString(getVal(rawInput.nominee?.name, "nominee.name")),
      aadharNo: cleanString(
        getVal(rawInput.nominee?.aadharNo, "nominee.aadharNo"),
      ),
      mobileNo: cleanString(
        getVal(rawInput.nominee?.mobileNo, "nominee.mobileNo"),
      ),
      relation: cleanString(
        getVal(rawInput.nominee?.relation, "nominee.relation"),
      ),
    },

    bankName: cleanString(rawInput.bankName),
    accountHolderName: cleanString(rawInput.accountHolderName),
    accountNumber: cleanString(rawInput.accountNumber),
    ifscCode: cleanString(rawInput.ifscCode)?.toUpperCase() || null,
  };

  return payload;
}
