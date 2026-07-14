"use client";

import { useState, useEffect, useRef } from "react";
import {
  userSignup,
  sendEmailOtp,
  verifyEmailOTP,
} from "../../services/grahakService";
import { errorMessage } from "./Message";
import { userSendOTPMessage, userSignUpMessage, userValidateOTPMessage } from "@/showMessage/grahakMessage";

// Hoisted outside the component so they aren't recreated on every render.
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
const NAME_REGEX = /^[a-zA-Z\s'-]{2,50}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/;

// NOTE: must match your backend's actual resend cooldown (RedisService used 60s earlier).
const RESEND_COOLDOWN_SECONDS = 60;

const INITIAL_FORM_DATA = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  bankName: "",
  holderName: "",
  accountNumber: "",
  ifscCode: "",
};

const validateEmail = (email) => EMAIL_REGEX.test(email);
const validateName = (n) => NAME_REGEX.test(n);
const validatePhone = (p) => /^\+?[1-9]\d{1,14}$/.test(p.replace(/[\s()+-]/g, ""));
const validateIfsc = (i) => IFSC_REGEX.test(i);

export default function AuthSignup({ onSwitch }) {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ---- Email OTP verification state ----
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const cooldownIntervalRef = useRef(null);

  // Countdown ticker for the resend cooldown. Cleans up on unmount / re-trigger.
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
  }, [resendCooldown > 0]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "email" && emailVerified) {
      setEmailVerified(false);
      setOtpSent(false);
      setOtp("");
      setOtpMessage("");
      setResendCooldown(0);
    }
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
      let status = userSendOTPMessage(response)
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
      let status = userValidateOTPMessage(response)
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

    const sanitizedName = formData.name.trim();
    const sanitizedEmail = formData.email.trim().toLowerCase();
    const sanitizedPhone = formData.phone.trim().replace(/[\s()-]/g, "");
    const { password, confirmPassword } = formData;

    if (
      !sanitizedName ||
      !sanitizedEmail ||
      !sanitizedPhone ||
      !password ||
      !confirmPassword
    ) {
      return setError("Fill all required fields.");
    }
    if (!validateName(sanitizedName))
      return setError("Enter a valid name (2-50 characters, letters only).");

    if (!validateEmail(sanitizedEmail))
      return setError("Enter a valid email address.");

    if (!emailVerified) {
      return setError("Please verify your email before creating an account.");
    }

    if (!validatePhone(sanitizedPhone))
      return setError("Enter a valid phone number.");

    if (!PASSWORD_REGEX.test(password)) {
      return setError(
        "Password must contain at least one uppercase letter, lowercase letter, number, and special character.",
      );
    }
    if (password.length < 8) return setError("Password must be 8+ characters.");
    if (password !== confirmPassword)
      return setError("Passwords do not match.");

    let sanitizedBankName = "";
    let sanitizedHolderName = "";
    let sanitizedAccountNumber = "";
    let sanitizedIfsc = "";

    if (showAccountDetails) {
      sanitizedBankName = formData.bankName.trim();
      sanitizedHolderName = formData.holderName.trim();
      sanitizedAccountNumber = formData.accountNumber.trim();
      sanitizedIfsc = formData.ifscCode.trim().toUpperCase();

      if (
        !sanitizedBankName ||
        !sanitizedHolderName ||
        !sanitizedAccountNumber ||
        !sanitizedIfsc
      ) {
        return setError("Please complete all bank account details.");
      }
      if (!validateIfsc(sanitizedIfsc)) {
        return setError("Enter a valid 11-digit IFSC code (e.g., SBIN0001234).");
      }
    }

    try {
      setLoading(true);

      const payload = {
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        passwordHash: password,
        bankName: sanitizedBankName,
        accountHolderName: sanitizedHolderName,
        accountNumber: sanitizedAccountNumber,
        ifscCode: sanitizedIfsc,
      };

      const response = await userSignup(payload);
      // console.log(response)
      let message = userSignUpMessage(response);

      if (!message) return;
      setMessage(response.message || "Registration successful! Redirecting...");
      setFormData(INITIAL_FORM_DATA);
      setOtp("");
      setOtpSent(false);
      setEmailVerified(false);
      setResendCooldown(0);

      if (onSwitch) setTimeout(() => onSwitch("login"), 1000);
    } catch (err) {
      setError(err.message || "Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const sendOtpLabel = sendingOtp
    ? "Sending..."
    : resendCooldown > 0
      ? `Resend in ${resendCooldown}s`
      : otpSent
        ? "Resend OTP"
        : "Send OTP";

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-[0_15px_50px_rgba(15,23,42,0.03)]">
      <h2 className="text-xl font-bold text-slate-900 text-center mb-2">
        Create Your Account
      </h2>
      <p className="text-xs text-slate-400 text-center mb-6">
        Start your portfolio management journey.
      </p>

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

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
            Email
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={formData.email}
              disabled={emailVerified}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="name@growwkaro.com"
              className="flex-1 h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300 disabled:text-emerald-600 disabled:bg-emerald-50 disabled:border-emerald-100"
            />
            {!emailVerified && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || resendCooldown > 0}
                className="h-11 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap disabled:bg-slate-400"
              >
                {sendOtpLabel}
              </button>
            )}
            {emailVerified && (
              <span className="h-11 px-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold flex items-center whitespace-nowrap">
                ✓ Verified
              </span>
            )}
          </div>

          {otpSent && !emailVerified && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter OTP"
                maxLength={6}
                className="flex-1 h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm tracking-widest focus:outline-none focus:border-slate-300"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={verifyingOtp}
                className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap disabled:bg-slate-400"
              >
                {verifyingOtp ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          )}

          {otpMessage && (
            <p className="text-[11px] text-emerald-600 mt-1">{otpMessage}</p>
          )}
          {otpError && (
            <p className="text-[11px] text-rose-600 mt-1">{otpError}</p>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
            First name
          </label>
          <input
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            disabled={!emailVerified}
            placeholder="John"
            className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
            Phone number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            disabled={!emailVerified}
            placeholder="+91 987-704-5670"
            className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
            Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            disabled={!emailVerified}
            placeholder="••••••••"
            className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
            Confirm Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) =>
              handleInputChange("confirmPassword", e.target.value)
            }
            disabled={!emailVerified}
            placeholder="••••••••"
            className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300"
          />
        </div>

        <div className="flex items-center space-x-2 py-2 col-span-1 sm:col-span-2">
          <input
            type="checkbox"
            id="showPassword"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            disabled={!emailVerified}
            className="w-4 h-4 rounded text-blue-600 border-slate-200 focus:ring-blue-500 cursor-pointer"
          />
          <label
            htmlFor="showPassword"
            className="text-xs text-slate-600 font-medium cursor-pointer select-none"
          >
            Show Password
          </label>
        </div>

        <div className="flex items-center space-x-2 py-2 col-span-1 sm:col-span-2">
          <input
            type="checkbox"
            id="toggleAccount"
            checked={showAccountDetails}
            onChange={(e) => setShowAccountDetails(e.target.checked)}
            disabled={!emailVerified}
            className="w-4 h-4 rounded text-blue-600 border-slate-200 focus:ring-blue-500 cursor-pointer"
          />
          <label
            htmlFor="toggleAccount"
            className="text-xs text-slate-600 font-medium cursor-pointer select-none"
          >
            Do you want to add account details now?
          </label>
        </div>

        {showAccountDetails && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 col-span-1 sm:col-span-2 transition-all">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => handleInputChange("bankName", e.target.value)}
                placeholder="State Bank of India"
                className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={formData.holderName}
                onChange={(e) =>
                  handleInputChange("holderName", e.target.value)
                }
                placeholder="John Doe"
                className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) =>
                  handleInputChange(
                    "accountNumber",
                    e.target.value.replace(/\D/g, ""),
                  )
                }
                placeholder="1234567890"
                className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300 font-mono tracking-wider"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) =>
                  handleInputChange("ifscCode", e.target.value.toUpperCase())
                }
                placeholder="SBIN0001234"
                className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300 font-mono tracking-wider"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !emailVerified}
          className="w-full h-12 bg-slate-950 hover:bg-slate-900 text-white rounded-full font-semibold transition-colors mt-2 col-span-1 sm:col-span-2 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading
            ? "Creating Account..."
            : !emailVerified
              ? "Verify Email to Continue"
              : "Create Account"}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Already have an account?{" "}
        <button
          onClick={() => onSwitch && onSwitch("login")}
          className="text-blue-600 font-semibold hover:underline"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
