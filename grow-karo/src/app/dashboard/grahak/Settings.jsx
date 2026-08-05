import { userContext } from "@/context/UserContext";
import React, { use, useEffect, useRef, useState } from "react";
import { initials } from "../malik/components/SchemeAproval/components/constants";
import { allRounderMessage } from "@/components/Message";
import { updateProfile } from "../../../../services/grahakService";
import { INDIAN_BANKS } from "@/app/utils/constant";
import BankSelect from "@/components/BankSelect";
// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------
// Strips HTML tags/angle brackets, control characters, and collapses
// whitespace so raw markup or script fragments never make it into state
// (and therefore never make it into an API payload or, later, the DOM).
// Note: React already escapes text on render, so this isn't about protecting
// this component from an XSS render — it's about not persisting/forwarding
// dangerous input to the backend, logs, or other views that might render it
// as raw HTML down the line.
function sanitizeText(value, { maxLength = 100 } = {}) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "") // strip tags e.g. <script>, <img onerror=...>
    .replace(/[<>]/g, "") // strip stray angle brackets
    .replace(/[\u0000-\u001F\u007F]/g, "") // strip control chars
    .trimStart()
    .slice(0, maxLength);
}

// Digits only (for phone / account number / OTP-like fields)
function sanitizeDigits(value, { maxLength = 20 } = {}) {
  if (typeof value !== "string") return "";
  return value.replace(/[^\d]/g, "").slice(0, maxLength);
}

// Alphanumeric, uppercased (for IFSC-style codes)
function sanitizeAlphaNumUpper(value, { maxLength = 11 } = {}) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, maxLength);
}

// Passwords: don't mangle characters (special chars are valid and expected),
// just strip control chars and cap length to stop absurdly long payloads.
function sanitizePassword(value, { maxLength = 64 } = {}) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, maxLength);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]{1,49}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/; // Indian mobile numbers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_NUMBER_REGEX = /^\d{9,18}$/;
// At least 8 chars, one upper, one lower, one digit, one special char.
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function validateField(name, value, allValues) {
  switch (name) {
    case "name":
      if (!value.trim()) return "Full name is required.";
      if (!NAME_REGEX.test(value.trim()))
        return "Name must be 2-50 letters and may include spaces, hyphens or apostrophes.";
      return "";

    case "phone":
      if (!value.trim()) return "Phone number is required.";
      if (!PHONE_REGEX.test(value.trim()))
        return "Enter a valid 10-digit mobile number.";
      return "";

    case "email":
      if (value && !EMAIL_REGEX.test(value.trim()))
        return "Enter a valid email address.";
      return "";

    case "accountHolderName":
      if (!value.trim()) return "Account holder name is required.";
      if (!NAME_REGEX.test(value.trim()))
        return "Enter a valid name (letters only).";
      return "";

    case "bankName":
      if (!value.trim()) return "Please select your bank.";
      if (!INDIAN_BANKS.includes(value.trim()))
        return "Select a bank from the list.";
      return "";

    case "accountNumber":
      if (!value.trim()) return "Account number is required.";
      if (!ACCOUNT_NUMBER_REGEX.test(value.trim()))
        return "Account number must be 9-18 digits.";
      return "";

    case "ifscCode":
      if (!value.trim()) return "IFSC code is required.";
      if (!IFSC_REGEX.test(value.trim()))
        return "Enter a valid IFSC code (e.g., SBIN0001234).";
      return "";

    case "currentPassword":
      if (!value) return "Current password is required.";
      return "";

    case "newPassword":
      if (!value) return "New password is required.";
      if (!PASSWORD_REGEX.test(value))
        return "Min 8 characters, with upper, lower, number & special character.";
      if (allValues.currentPassword && value === allValues.currentPassword)
        return "New password must be different from the current password.";
      return "";

    case "confirmPassword":
      if (!value) return "Please confirm your new password.";
      if (value !== allValues.newPassword) return "Passwords do not match.";
      return "";

    default:
      return "";
  }
}

// Indian banks — public sector, private sector, small finance, and major
// foreign banks operating in India. Kept alphabetical for easy scanning.

// Fields required by each tab — used to validate only the relevant slice
// of state when a given tab is saved.
const TAB_FIELDS = {
  profile: ["name", "phone", "email"],
  "bank details": [
    "accountHolderName",
    "bankName",
    "accountNumber",
    "ifscCode",
  ],
  security: ["currentPassword", "newPassword", "confirmPassword"],
  notifications: [],
};

export default function SettingsComponent() {
  const [activeTab, setActiveTab] = useState("profile");
  const { authUser } = use(userContext);

  const [profile, setProfile] = useState({
    // profile
    id: authUser?.id,
    name: "",
    phone: "",
    email: "",
    // bank details
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    // security
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    enable2FA: false,
    // notifications
    schemeAlerts: true,
    securityAlerts: true,
  });

  // Field-level error messages, keyed by field name.
  const [errors, setErrors] = useState({});
  // Tracks which fields the user has interacted with, so we don't show
  // "required" errors before they've even typed anything.
  const [touched, setTouched] = useState({});

  // --- Searchable bank dropdown state ---
  const [bankQuery, setBankQuery] = useState("");
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const bankFieldRef = useRef(null);

  const filteredBanks = INDIAN_BANKS.filter((bank) =>
    bank.toLowerCase().includes(bankQuery.trim().toLowerCase()),
  );

  // Close the dropdown when clicking anywhere outside the bank field.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bankFieldRef.current && !bankFieldRef.current.contains(e.target)) {
        setBankDropdownOpen(false);
        // Reset the visible text back to the actual selected value
        setBankQuery(profile.bankName || "");
        setTouched((prev) => ({ ...prev, bankName: true }));
        setErrors((prev) => ({
          ...prev,
          bankName: validateField("bankName", profile.bankName || "", profile),
        }));
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profile.bankName, profile]);

  // Keep the visible search text in sync whenever bankName changes elsewhere
  // (e.g. loaded from the API on mount).
  useEffect(() => {
    setBankQuery(profile.bankName || "");
  }, [profile.bankName]);

  const selectBank = (bankName) => {
    setProfile((prev) => {
      const updated = { ...prev, bankName };
      setErrors((prevErrors) => ({
        ...prevErrors,
        bankName: validateField("bankName", bankName, updated),
      }));
      return updated;
    });
    setBankQuery(bankName);
    setTouched((prev) => ({ ...prev, bankName: true }));
    setBankDropdownOpen(false);
  };

  // Sanitize raw input based on field type, then run validation against the
  // *sanitized* value so an error can never be based on discarded characters.
  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;

    let nextValue;
    if (type === "checkbox") {
      nextValue = checked;
    } else if (name === "phone" || name === "accountNumber") {
      nextValue = sanitizeDigits(value, {
        maxLength: name === "phone" ? 10 : 18,
      });
    } else if (name === "ifscCode") {
      nextValue = sanitizeAlphaNumUpper(value, { maxLength: 11 });
    } else if (
      name === "currentPassword" ||
      name === "newPassword" ||
      name === "confirmPassword"
    ) {
      nextValue = sanitizePassword(value);
    } else if (name === "email") {
      nextValue = sanitizeText(value, { maxLength: 100 }).toLowerCase();
    } else {
      nextValue = sanitizeText(value, { maxLength: 100 });
    }

    setProfile((prev) => {
      const updated = { ...prev, [name]: nextValue };
      // Re-validate this field (and confirmPassword, which depends on newPassword)
      setErrors((prevErrors) => {
        const nextErrors = {
          ...prevErrors,
          [name]: validateField(name, nextValue, updated),
        };
        if (name === "newPassword" && prev.confirmPassword) {
          nextErrors.confirmPassword = validateField(
            "confirmPassword",
            prev.confirmPassword,
            updated,
          );
        }
        return nextErrors;
      });
      return updated;
    });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, profile[name], profile),
    }));
  };

  const fieldError = (name) => (touched[name] ? errors[name] : "");

  const handleSave = async (e) => {
    e.preventDefault();

    const fieldsToCheck = TAB_FIELDS[activeTab] || [];
    const newErrors = {};
    let hasError = false;

    fieldsToCheck.forEach((field) => {
      const message = validateField(field, profile[field], profile);
      newErrors[field] = message;
      if (message) hasError = true;
    });

    setErrors((prev) => ({ ...prev, ...newErrors }));
    setTouched((prev) => ({
      ...prev,
      ...fieldsToCheck.reduce((acc, f) => ({ ...acc, [f]: true }), {}),
    }));

    if (hasError) {
      allRounderMessage?.({
        status: "error",
        message: "Please fix the highlighted fields before saving.",
      });
      return;
    }

    // At this point every relevant field has been sanitized on input and
    // validated against the regex rules above — safe to send to the API.
    alert(`${activeTab.toUpperCase()} settings saved successfully!`);
    // console.log(profile);
    try {
      const res = await updateProfile(profile, authUser.id);
      // console.log(res);
      setProfile(res.data);
      allRounderMessage(res);
    } catch (error) {
      console.log(error);
    }
  };

  const TABS = [
    { id: "profile", label: "Profile" },
    { id: "bank details", label: "Bank Details" },
    { id: "security", label: "Security" },
    { id: "notifications", label: "Notifications" },
  ];

  const tabContentClass =
    "space-y-6 transition-all duration-500 ease-out opacity-100 translate-y-0 animate-[fadeIn_0.5s_ease-out]";

  const inputClass = (name) =>
    `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
      fieldError(name)
        ? "border-red-400 focus:ring-red-400"
        : "border-gray-300 focus:ring-indigo-500"
    }`;

  const ErrorText = ({ name }) =>
    fieldError(name) ? (
      <p className="text-xs text-red-600 mt-1">{fieldError(name)}</p>
    ) : null;

  const getUserInfo = async () => {
    try {
      if (authUser) {
        setProfile((prev) => ({
          ...prev,
          name: sanitizeText(authUser?.name ?? prev.name),
          phone: sanitizeDigits(authUser?.phone ?? prev.phone, {
            maxLength: 10,
          }),
          email: sanitizeText(authUser?.email ?? prev.email).toLowerCase(),
          accountHolderName: sanitizeText(
            authUser?.accountHolderName ?? prev.accountHolderName,
          ),
          bankName: sanitizeText(authUser?.bankName ?? prev.bankName),
          accountNumber: sanitizeDigits(
            authUser?.accountNumber ?? prev.accountNumber,
            {
              maxLength: 18,
            },
          ),
          ifscCode: sanitizeAlphaNumUpper(authUser?.ifscCode ?? prev.ifscCode),
        }));
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (authUser) {
      getUserInfo();
    }
  }, [authUser]);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100">
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Account Settings</h2>
        <p className="text-sm text-gray-500">
          Update your profile information, financial details, and preferences.
        </p>
      </div>

      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto space-x-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-4 font-medium text-sm capitalize border-b-2 whitespace-nowrap transition-all duration-300 ${
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} noValidate>
        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className={tabContentClass}>
            <div className="flex flex-col items-center justify-center text-center mb-6">
              <div className="relative group w-21 h-21 mb-1 cursor-pointer">
                <div className="w-24 h-24 bg-linear-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-4xl font-bold animate-bounce">
                  {initials(authUser?.name)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  onBlur={handleBlur}
                  maxLength={50}
                  autoComplete="name"
                  className={inputClass("name")}
                />
                <ErrorText name="name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  inputMode="numeric"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  onBlur={handleBlur}
                  maxLength={10}
                  autoComplete="tel"
                  className={inputClass("phone")}
                />
                <ErrorText name="phone" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                  disabled
                  readOnly
                />
              </div>
            </div>
          </div>
        )}

        {/* BANK DETAILS TAB */}
        {activeTab === "bank details" && (
          <div className={tabContentClass}>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs">
              <strong>Notice:</strong> Please ensure bank details match your
              official proof documents to avoid verification delays.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BankSelect
                value={profile.bankName}
                onChange={handleProfileChange}
                onBlur={handleBlur}
                error={fieldError("bankName")}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={profile.accountHolderName}
                  onChange={handleProfileChange}
                  onBlur={handleBlur}
                  maxLength={50}
                  className={inputClass("accountHolderName")}
                />
                <ErrorText name="accountHolderName" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  inputMode="numeric"
                  value={profile.accountNumber}
                  onChange={handleProfileChange}
                  onBlur={handleBlur}
                  placeholder="e.g., 123456789012"
                  maxLength={18}
                  className={inputClass("accountNumber")}
                />
                <ErrorText name="accountNumber" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  value={profile.ifscCode}
                  onChange={handleProfileChange}
                  onBlur={handleBlur}
                  placeholder="SBIN0001234"
                  maxLength={11}
                  className={inputClass("ifscCode") + " uppercase"}
                />
                <ErrorText name="ifscCode" />
              </div>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <div className={tabContentClass}>
            <div className="grid grid-cols-1 gap-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  placeholder="••••••••"
                  value={profile.currentPassword}
                  onChange={handleProfileChange}
                  onBlur={handleBlur}
                  autoComplete="current-password"
                  maxLength={64}
                  className={inputClass("currentPassword")}
                />
                <ErrorText name="currentPassword" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="**********"
                  value={profile.newPassword}
                  onChange={handleProfileChange}
                  onBlur={handleBlur}
                  autoComplete="new-password"
                  maxLength={64}
                  className={inputClass("newPassword")}
                />
                <ErrorText name="newPassword" />
                {!fieldError("newPassword") && (
                  <p className="text-xs text-gray-400 mt-1">
                    Min 8 characters, with uppercase, lowercase, number &
                    special character.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="**********"
                  value={profile.confirmPassword}
                  onChange={handleProfileChange}
                  onBlur={handleBlur}
                  autoComplete="new-password"
                  maxLength={64}
                  className={inputClass("confirmPassword")}
                />
                <ErrorText name="confirmPassword" />
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <div className={tabContentClass}>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Scheme Alerts
                </p>
                <p className="text-xs text-gray-500">
                  Get instant push updates when new scheme included.
                </p>
              </div>
              <input
                type="checkbox"
                name="schemeAlerts"
                checked={profile.schemeAlerts}
                onChange={handleProfileChange}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
              />
            </div>

            {/* <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Weekly Performance Digest
                </p>
                <p className="text-xs text-gray-500">
                  Receive a structured analytics breakdown of your portfolio
                  balance weekly.
                </p>
              </div>
              <input
                type="checkbox"
                name="weeklyDigest"
                checked={profile.weeklyDigest}
                onChange={handleProfileChange}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
              />
            </div> */}

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Security & Login Notifications
                </p>
                <p className="text-xs text-gray-500">
                  Get notified immediately whenever a new login device session
                  is detected.
                </p>
              </div>
              <input
                type="checkbox"
                name="securityAlerts"
                checked={profile.securityAlerts}
                onChange={handleProfileChange}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
