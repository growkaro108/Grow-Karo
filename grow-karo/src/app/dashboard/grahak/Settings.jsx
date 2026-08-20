import { userContext } from "@/context/UserContext";
import React, { use, useEffect, useState } from "react";
import { allRounderMessage } from "@/components/Message";
import { updateProfile } from "../../../../services/grahakService";
import { INDIAN_BANKS } from "@/app/utils/constant";
import dynamic from "next/dynamic";

// import NomineesSection from "./settings/NomineesSection";
// import ProfileSettings from "./settings/ProfileSettings";
// import BankDetailsSettings from "./settings/BankDetailsSettings";
// import SecuritySettings from "./settings/SecuritySettings";
// import NotificationSettings from "./settings/NotificationSettings";
// import SettingsTabs from "./settings/SettingsTabs";
const NomineesSection = dynamic(() => import("./settings/NomineesSection"), {
  loading: () => (
    <div className="w-full h-32 bg-gray-200 rounded-xl animate-pulse"></div>
  ),
  ssr: false,
});
const ProfileSettings = dynamic(() => import("./settings/ProfileSettings"), {
  loading: () => (
    <div className="w-full h-32 bg-gray-200 rounded-xl animate-pulse"></div>
  ),
  ssr: false,
});
const BankDetailsSettings = dynamic(
  () => import("./settings/BankDetailsSettings"),
  {
    loading: () => (
      <div className="w-full h-32 bg-gray-200 rounded-xl animate-pulse"></div>
    ),
    ssr: false,
  },
);
const SecuritySettings = dynamic(() => import("./settings/SecuritySettings"), {
  loading: () => (
    <div className="w-full h-32 bg-gray-200 rounded-xl animate-pulse"></div>
  ),
  ssr: false,
});
const NotificationSettings = dynamic(
  () => import("./settings/NotificationSettings"),
  {
    loading: () => (
      <div className="w-full h-32 bg-gray-200 rounded-xl animate-pulse"></div>
    ),
    ssr: false,
  },
);
const SettingsTabs = dynamic(() => import("./settings/SettingsTabs"), {
  loading: () => (
    <div className="w-full h-32 bg-gray-200 rounded-xl animate-pulse"></div>
  ),
  ssr: false,
});

import FieldError from "./settings/FieldError";
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
  const { authUser, updateAuthUser } = use(userContext);

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
    // alert(`${activeTab.toUpperCase()} settings saved successfully!`);
    // console.log(profile);
    try {
      const res = await updateProfile(profile, authUser.id);
      // console.log(res);
      setProfile(res.data);
      updateAuthUser(res.data);
      allRounderMessage(res);
    } catch (error) {
      console.log(error);
    }
  };

  const TABS = [
    { id: "profile", label: "Profile" },
    { id: "bank details", label: "Bank Details" },
    { id: "nominees", label: "Nominees" },
    { id: "security", label: "Security" },
    { id: "notifications", label: "Notifications" },
  ];

  const inputClass = (name) =>
    `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
      fieldError(name)
        ? "border-red-400 focus:ring-red-400"
        : "border-gray-300 focus:ring-indigo-500"
    }`;

  useEffect(() => {
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
            ifscCode: sanitizeAlphaNumUpper(
              authUser?.ifscCode ?? prev.ifscCode,
            ),
          }));
        }
      } catch (error) {
        console.log(error);
      }
    };
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

      <SettingsTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <form onSubmit={handleSave} noValidate>
        {activeTab === "profile" && (
          <ProfileSettings
            authUser={authUser}
            profile={profile}
            inputClass={inputClass}
            errors={errors}
            touched={touched}
            onChange={handleProfileChange}
            onBlur={handleBlur}
          />
        )}
        {activeTab === "bank details" && (
          <BankDetailsSettings
            profile={profile}
            inputClass={inputClass}
            errors={errors}
            touched={touched}
            fieldError={fieldError}
            onChange={handleProfileChange}
            onBlur={handleBlur}
          />
        )}
        {activeTab === "nominees" && <NomineesSection />}

        {activeTab === "security" && (
          <SecuritySettings
            profile={profile}
            inputClass={inputClass}
            errors={errors}
            touched={touched}
            fieldError={fieldError}
            onChange={handleProfileChange}
            onBlur={handleBlur}
          />
        )}
        {activeTab === "notifications" && (
          <NotificationSettings
            profile={profile}
            onChange={handleProfileChange}
          />
        )}

        {activeTab !== "nominees" && (
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
        )}
      </form>
    </div>
  );
}
