"use client";

import { useState, useEffect, useRef } from "react";
import {
  userSignup,
  sendEmailOtp,
  verifyEmailOTP,
} from "../../../services/grahakService";
import {
  userSendOTPMessage,
  userSignUpMessage,
  userValidateOTPMessage,
} from "@/showMessage/grahakMessage";
import { useLoader } from "@/context/LoaderContext";
import dynamic from "next/dynamic";
import StepProgress from "./StepProgress";
import EmailStep from "./steps/EmailStep";
import PersonalStep from "./steps/PersonalStep";
import SecurityStep from "./steps/SecurityStep";
import AddressStep from "./steps/AddressStep";
import NomineeStep from "./steps/NomineeStep";
import BankStep from "./steps/BankStep";

const BankSelect = dynamic(() => import("../BankSelect"), {
  loading: () => (
    <div className="animate-pulse w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"></div>
  ),
  ssr: false,
});

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
const NAME_REGEX = /^[a-zA-Z\s'-]{2,50}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/;
const PINCODE_REGEX = /^\d{6}$/;
const AADHAR_REGEX = /^\d{12}$/;
const MIN_AGE_YEARS = 18;
const RESEND_COOLDOWN_SECONDS = 60;

const RELATION_OPTIONS = [
  "Father",
  "Mother",
  "Spouse",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Guardian",
  "Other",
];

const MARITAL_STATUS_OPTIONS = ["Single", "Married", "Divorced", "Widowed"];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const INITIAL_FORM_DATA = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  dob: "",
  maritalStatus: "",
  aadharNo: "",
  guardianName: "",
  guardianRelation: "",
  street: "",
  village: "",
  city: "",
  state: "",
  pincode: "",
  nomineeName: "",
  nomineeAadhar: "",
  nomineeMobile: "",
  nomineeRelation: "",
  bankName: "",
  holderName: "",
  accountNumber: "",
  ifscCode: "",
};

const STEPS = [
  {
    key: "email",
    title: "Verify your email",
    subtitle: "We'll send a one-time code to confirm it's you.",
    fields: [],
  },
  {
    key: "personal",
    title: "Personal information",
    subtitle: "This should match your government-issued ID.",
    fields: [
      "name",
      "phone",
      "dob",
      "maritalStatus",
      "aadharNo",
      "guardianName",
      "guardianRelation",
    ],
  },
  {
    key: "security",
    title: "Set a password",
    subtitle: "Choose something you don't use elsewhere.",
    fields: ["password", "confirmPassword"],
  },
  {
    key: "address",
    title: "Address details",
    subtitle: "Your current residential address.",
    fields: ["street", "village", "city", "state", "pincode"],
  },
  {
    key: "nominee",
    title: "Nominee details",
    subtitle: "Who should inherit this account.",
    fields: ["nomineeName", "nomineeRelation", "nomineeAadhar", "nomineeMobile"],
  },
  {
    key: "bank",
    title: "Bank details",
    subtitle: "Optional — add now or later from your profile.",
    fields: [],
  },
];

const LAST_STEP = STEPS.length - 1;

const validateEmail = (email) => EMAIL_REGEX.test(email);
const validateName = (n) => NAME_REGEX.test(n);
const validatePhone = (p) =>
  /^\+?[1-9]\d{1,14}$/.test(p.replace(/[\s()+-]/g, ""));
const validateIfsc = (i) => IFSC_REGEX.test(i);
const validatePincode = (p) => PINCODE_REGEX.test(p);
const validateAadhar = (a) => AADHAR_REGEX.test(a.replace(/\s/g, ""));

const calculateAge = (dobString) => {
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
};

const buildValidators = (formData) => ({
  name: (v) => {
    const t = v.trim();
    if (!t) return "Name is required.";
    if (!validateName(t)) return "Letters only, 2-50 characters.";
    return "";
  },
  phone: (v) => {
    const t = v.trim();
    if (!t) return "Phone number is required.";
    if (!validatePhone(t)) return "Enter a valid phone number.";
    return "";
  },
  password: (v) => {
    if (!v) return "Password is required.";
    if (v.length < 8) return "Must be at least 8 characters.";
    if (!PASSWORD_REGEX.test(v))
      return "Add an uppercase, lowercase, number & symbol.";
    return "";
  },
  confirmPassword: (v) => {
    if (!v) return "Confirm your password.";
    if (v !== formData.password) return "Passwords do not match.";
    return "";
  },
  dob: (v) => {
    if (!v) return "Date of birth is required.";
    const dob = new Date(v);
    if (Number.isNaN(dob.getTime())) return "Enter a valid date.";
    if (dob > new Date()) return "Date of birth cannot be in the future.";
    if (calculateAge(v) < MIN_AGE_YEARS)
      return `You must be at least ${MIN_AGE_YEARS} years old.`;
    return "";
  },
  maritalStatus: (v) => (!v ? "Select a marital status." : ""),
  aadharNo: (v) => {
    const t = v.trim();
    if (!t) return "Aadhaar number is required.";
    if (!validateAadhar(t)) return "Enter a valid 12-digit Aadhaar number.";
    return "";
  },
  guardianName: (v) => {
    const t = v.trim();
    if (!t) return "";
    if (!validateName(t)) return "Letters only, 2-50 characters.";
    return "";
  },
  guardianRelation: (v) => {
    if (formData.guardianName.trim() && !v)
      return "Select the guardian's relation.";
    return "";
  },
  street: (v) => (!v.trim() ? "Street address is required." : ""),
  village: (v) => (!v.trim() ? "Village / town is required." : ""),
  city: (v) => (!v.trim() ? "City is required." : ""),
  state: (v) => (!v ? "Select a state." : ""),
  pincode: (v) => {
    const t = v.trim();
    if (!t) return "Pincode is required.";
    if (!validatePincode(t)) return "Enter a valid 6-digit pincode.";
    return "";
  },
  nomineeName: (v) => {
    const t = v.trim();
    if (!t) return "Nominee name is required.";
    if (!validateName(t)) return "Letters only, 2-50 characters.";
    return "";
  },
  nomineeAadhar: (v) => {
    const t = v.trim();
    if (!t) return "Nominee Aadhaar number is required.";
    if (!validateAadhar(t)) return "Enter a valid 12-digit Aadhaar number.";
    return "";
  },
  nomineeMobile: (v) => {
    const t = v.trim();
    if (!t) return "Nominee mobile number is required.";
    if (!validatePhone(t)) return "Enter a valid mobile number.";
    return "";
  },
  nomineeRelation: (v) => (!v ? "Select relation with nominee." : ""),
  bankName: (v) => (!v.trim() ? "Select a bank." : ""),
  holderName: (v) => {
    const t = v.trim();
    if (!t) return "Account holder name is required.";
    if (!validateName(t)) return "Letters only, 2-50 characters.";
    return "";
  },
  accountNumber: (v) => (!v.trim() ? "Account number is required." : ""),
  ifscCode: (v) => {
    const t = v.trim().toUpperCase();
    if (!t) return "IFSC code is required.";
    if (!validateIfsc(t)) return "Enter a valid IFSC code (e.g., SBIN0001234).";
    return "";
  },
});

export default function AuthSignup({ onSwitch }) {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [direction, setDirection] = useState("forward");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const { showLoader, hideLoader } = useLoader();

  const cooldownIntervalRef = useRef(null);
  const validators = buildValidators(formData);
  const step = STEPS[currentStep];
  const isLastStep = currentStep === LAST_STEP;

  useEffect(() => {
    if (resendCooldown <= 0) return;

    cooldownIntervalRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(cooldownIntervalRef.current);
  }, [resendCooldown]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }

    if (field === "email" && emailVerified) {
      setEmailVerified(false);
      setOtpSent(false);
      setOtp("");
      setOtpMessage("");
      setResendCooldown(0);
    }
  };

  const handleFieldBlur = (field) => {
    const validator = validators[field];
    if (!validator) return;
    const err = validator(formData[field]);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  const goToStep = (index) => {
    setDirection(index > currentStep ? "forward" : "back");
    setError("");
    setCurrentStep(index);
  };

  const handleNext = () => {
    setError("");

    if (step.key === "email" && !emailVerified) {
      setError("Please verify your email to continue.");
      return;
    }

    if (step.fields.length) {
      const newErrors = {};
      step.fields.forEach((field) => {
        const validator = validators[field];
        if (validator) {
          const err = validator(formData[field]);
          if (err) newErrors[field] = err;
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...newErrors }));
        setError("Please fix the highlighted fields before continuing.");
        return;
      }
    }

    const next = Math.min(currentStep + 1, LAST_STEP);
    setDirection("forward");
    setCurrentStep(next);
    setFurthestStep((prev) => Math.max(prev, next));
  };

  const handleBack = () => {
    setError("");
    setDirection("back");
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSendOtp = async () => {
    if (sendingOtp || resendCooldown > 0) return;

    setOtpError("");
    setOtpMessage("");

    const sanitizedEmail = formData.email.trim().toLowerCase();
    if (!sanitizedEmail || !validateEmail(sanitizedEmail)) {
      return setOtpError("Enter a valid email address first.");
    }

    try {
      setSendingOtp(true);
      const response = await sendEmailOtp(sanitizedEmail);
      const status = userSendOTPMessage(response);
      if (status) {
        setOtpSent(true);
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
      }
    } catch (err) {
      setOtpError(err.message || "Network error..");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError("");
    setOtpMessage("");

    const sanitizedEmail = formData.email.trim().toLowerCase();
    if (!otp.trim()) {
      return setOtpError("Enter the OTP sent to your email.");
    }

    try {
      setVerifyingOtp(true);
      const response = await verifyEmailOTP(sanitizedEmail, otp.trim());
      const status = userValidateOTPMessage(response);
      if (status) {
        setEmailVerified(true);
        setOtpMessage(response.message || "Email verified successfully.");
      } else {
        setOtpError(response?.message || "Please enter a valid OTP.");
      }
    } catch (err) {
      setOtpError(err.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!isLastStep) {
      handleNext();
      return;
    }

    if (!emailVerified) {
      return setError("Please verify your email before creating an account.");
    }

    const fieldsToCheck = STEPS.flatMap((s) => s.fields);
    if (showAccountDetails) {
      fieldsToCheck.push("bankName", "holderName", "accountNumber", "ifscCode");
    }

    const newErrors = {};
    fieldsToCheck.forEach((field) => {
      const validator = validators[field];
      if (validator) {
        const err = validator(formData[field]);
        if (err) newErrors[field] = err;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...newErrors }));
      return setError("Please fix the highlighted fields before continuing.");
    }

    const sanitizedName = formData.name.trim();
    const sanitizedEmail = formData.email.trim().toLowerCase();
    const sanitizedPhone = formData.phone.trim().replace(/[\s()-]/g, "");
    const sanitizedAadhar = formData.aadharNo.trim().replace(/\s/g, "");
    const sanitizedGuardianName = formData.guardianName.trim();

    const address = {
      street: formData.street.trim(),
      village: formData.village.trim(),
      city: formData.city.trim(),
      state: formData.state,
      pincode: formData.pincode.trim(),
    };

    const nominee = {
      name: formData.nomineeName.trim(),
      aadharNo: formData.nomineeAadhar.trim().replace(/\s/g, ""),
      mobileNo: formData.nomineeMobile.trim().replace(/[\s()-]/g, ""),
      relation: formData.nomineeRelation,
    };

    let sanitizedBankName = "";
    let sanitizedHolderName = "";
    let sanitizedAccountNumber = "";
    let sanitizedIfsc = "";

    if (showAccountDetails) {
      sanitizedBankName = formData.bankName.trim();
      sanitizedHolderName = formData.holderName.trim();
      sanitizedAccountNumber = formData.accountNumber.trim();
      sanitizedIfsc = formData.ifscCode.trim().toUpperCase();
    }

    try {
      setLoading(true);
      showLoader("Submitting Details to the server...");

      const payload = {
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        passwordHash: formData.password,
        dob: formData.dob,
        maritalStatus: formData.maritalStatus,
        aadharNo: sanitizedAadhar,
        guardian: sanitizedGuardianName
          ? { name: sanitizedGuardianName, relation: formData.guardianRelation }
          : null,
        address,
        nominee,
        bankName: sanitizedBankName,
        accountHolderName: sanitizedHolderName,
        accountNumber: sanitizedAccountNumber,
        ifscCode: sanitizedIfsc,
      };

      const response = await userSignup(payload);
      const successMessage = userSignUpMessage(response);

      if (!successMessage) return;
      setMessage(response.message || "Registration successful! Redirecting...");
      setFormData(INITIAL_FORM_DATA);
      setFieldErrors({});
      setOtp("");
      setOtpSent(false);
      setEmailVerified(false);
      setResendCooldown(0);
      setCurrentStep(0);
      setFurthestStep(0);

      if (onSwitch) setTimeout(() => onSwitch("login"), 1000);
    } catch (err) {
      setError(err.message || "Network error. Please try again later.");
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  const renderStepContent = () => {
    switch (step.key) {
      case "email":
        return (
          <EmailStep
            formData={formData}
            emailVerified={emailVerified}
            otp={otp}
            setOtp={setOtp}
            sendingOtp={sendingOtp}
            verifyingOtp={verifyingOtp}
            otpSent={otpSent}
            otpMessage={otpMessage}
            otpError={otpError}
            resendCooldown={resendCooldown}
            handleSendOtp={handleSendOtp}
            handleVerifyOtp={handleVerifyOtp}
            handleInputChange={handleInputChange}
          />
        );
      case "personal":
        return (
          <PersonalStep
            formData={formData}
            fieldErrors={fieldErrors}
            handleInputChange={handleInputChange}
            handleFieldBlur={handleFieldBlur}
            MARITAL_STATUS_OPTIONS={MARITAL_STATUS_OPTIONS}
            RELATION_OPTIONS={RELATION_OPTIONS}
          />
        );
      case "security":
        return (
          <SecurityStep
            formData={formData}
            fieldErrors={fieldErrors}
            handleInputChange={handleInputChange}
            handleFieldBlur={handleFieldBlur}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        );
      case "address":
        return (
          <AddressStep
            formData={formData}
            fieldErrors={fieldErrors}
            handleInputChange={handleInputChange}
            handleFieldBlur={handleFieldBlur}
            INDIAN_STATES={INDIAN_STATES}
          />
        );
      case "nominee":
        return (
          <NomineeStep
            formData={formData}
            fieldErrors={fieldErrors}
            handleInputChange={handleInputChange}
            handleFieldBlur={handleFieldBlur}
            RELATION_OPTIONS={RELATION_OPTIONS}
          />
        );
      case "bank":
        return (
          <BankStep
            formData={formData}
            fieldErrors={fieldErrors}
            handleInputChange={handleInputChange}
            handleFieldBlur={handleFieldBlur}
            showAccountDetails={showAccountDetails}
            setShowAccountDetails={setShowAccountDetails}
            BankSelect={BankSelect}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl border border-slate-100 bg-white p-5 sm:p-8 shadow-[0_15px_50px_rgba(15,23,42,0.03)]">
      <style>{`
        @keyframes authSignupSlideForward {
          from { opacity: 0; transform: translateX(28px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes authSignupSlideBack {
          from { opacity: 0; transform: translateX(-28px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <h2 className="text-xl font-bold text-slate-900 text-center mb-2">
        Create Your Account
      </h2>
      <p className="text-xs text-slate-400 text-center mb-6">
        Start your portfolio management journey.
      </p>

      <StepProgress
        steps={STEPS}
        currentStep={currentStep}
        furthestStep={furthestStep}
        onStepClick={goToStep}
      />

      {message && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-600 text-center">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {step.subtitle && (
          <p className="text-[12px] text-slate-400 mb-4 -mt-1">{step.subtitle}</p>
        )}

        <div
          key={currentStep}
          style={{
            animation: `${direction === "forward" ? "authSignupSlideForward" : "authSignupSlideBack"} 0.32s ease-out both`,
          }}
        >
          {renderStepContent()}
        </div>

        <div className="flex items-center gap-3 mt-6">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="h-12 px-6 rounded-full border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
          )}

          {!isLastStep && (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 h-12 bg-slate-950 hover:bg-slate-900 text-white rounded-full font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Next
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path
                  d="M7.5 4.5L13 10L7.5 15.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {isLastStep && (
            <button
              type="submit"
              disabled={loading || !emailVerified}
              className="flex-1 h-12 bg-slate-950 hover:bg-slate-900 text-white rounded-full font-semibold transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => onSwitch?.("login")}
          className="text-blue-600 font-semibold hover:underline"
        >
          Log In
        </button>
      </div>
    </div>
  );
}
