export const EMPTY_REMITTER_FORM = {
  organizationName: "",
  remitterEmail: "",
  remitterCode: "",
  remitterPhone: "",
  allocationLimit: "",
  aadharNumber: "",
  panNumber: "",
  status: true,
};

/**
 * Sanitizes and validates the remitter registration/edit form state object.
 */
export function validateAndSanitizeForm(rawForm) {
  const errors = {};
  const sanitizedData = {};

  sanitizedData.organizationName = rawForm.organizationName?.trim() || "";
  if (
    !sanitizedData.organizationName ||
    sanitizedData.organizationName.length > 100
  ) {
    errors.organizationName =
      "Entity name is required and must be less than 100 characters.";
  }

  sanitizedData.remitterEmail =
    rawForm.remitterEmail?.trim().toLowerCase() || "";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedData.remitterEmail)) {
    errors.remitterEmail = "Please enter a valid email address.";
  }

  sanitizedData.remitterCode = rawForm.remitterCode?.trim() || "";
  const remitterCodeRegex = /^GK-REM-[0-9]{3}$/;
  if (!remitterCodeRegex.test(sanitizedData.remitterCode)) {
    errors.remitterCode = "Remitter code must be in the format GK-REM-001.";
  }

  const digits = (rawForm.remitterPhone?.replace(/\D/g, "") || "").slice(-10);
  const remitterPhone = /^[6-9]\d{9}$/.test(digits) ? digits : "";
  sanitizedData.remitterPhone = remitterPhone;
  if (!remitterPhone) {
    errors.remitterPhone = "Please enter a valid phone number.";
  }

  // sanitizedData.trackerCode =
  //   rawForm.trackerCode?.replace(/\s+/g, "").toUpperCase() || "";
  // if (!sanitizedData.trackerCode || sanitizedData.trackerCode.length < 3) {
  //   errors.trackerCode = "Tracker code must be at least 3 characters long.";
  // }

  const rawLimit = parseFloat(rawForm.allocationLimit);
  sanitizedData.allocationLimit = isNaN(rawLimit) ? 0 : rawLimit;
  if (sanitizedData.allocationLimit <= 0) {
    errors.allocationLimit = "Allocation limit must be greater than 0.";
  }

  sanitizedData.aadharNumber =
    rawForm.aadharNumber?.replace(/[\s-]/g, "") || "";
  const aadharRegex = /^\d{12}$/;
  if (!aadharRegex.test(sanitizedData.aadharNumber)) {
    errors.aadharNumber =
      "Identity reference number must be exactly 12 digits.";
  }

  sanitizedData.panNumber =
    rawForm.panNumber?.replace(/\s+/g, "").toUpperCase() || "";
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(sanitizedData.panNumber)) {
    errors.panNumber = "Invalid format structure code (Expected: ABCDE1234F).";
  }
  sanitizedData.status = rawForm.status;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: sanitizedData,
  };
}
