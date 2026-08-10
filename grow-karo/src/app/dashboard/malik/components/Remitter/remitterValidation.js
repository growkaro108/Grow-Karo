export const EMPTY_REMITTER_FORM = {
  userId: "",
  remitterOrganizationName: "",
  allocationLimit: "",
  aadharNumber: "",
  panNumber: "",
  status: "active",
};

/**
 * Sanitizes and validates the remitter registration/edit form state object.
 */
export function validateAndSanitizeForm(rawForm) {
  const errors = {};
  const sanitizedData = {};

  sanitizedData.remitterOrganizationName =
    rawForm.remitterOrganizationName?.trim() || "";
  if (!sanitizedData.remitterOrganizationName) {
    errors.remitterOrganizationName = "Entity name is required.";
  }

  // sanitizedData.remitterEmail =
  //   rawForm.remitterEmail?.trim().toLowerCase() || "";
  // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // if (!emailRegex.test(sanitizedData.remitterEmail)) {
  //   errors.remitterEmail = "Please enter a valid email address.";
  // }

  // sanitizedData.remitterPhone = rawForm.remitterPhone?.replace(/\D/g, "") || "";
  // if (sanitizedData.remitterPhone.length !== 10) {
  //   errors.remitterPhone = "Phone number must be exactly 10 digits.";
  // }

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

  sanitizedData.userId =
    rawForm.userId?.trim().length == 0 ? null : rawForm.userId.trim();
  if (
    sanitizedData.userId != null &&
    (sanitizedData.userId.length > 20 || sanitizedData.userId.length < 14)
  ) {
    errors.userId = "User ID must be between 14 and 20 characters.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: sanitizedData,
  };
}
