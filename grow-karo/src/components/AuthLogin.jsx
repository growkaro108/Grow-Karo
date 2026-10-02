"use client";

import { loginUser } from "@/api/userApi";
import { EyeClosedIcon, EyeIcon } from "lucide-react";
import { use, useState } from "react";
import { confirmMessage, errorMessage, successMessage } from "./Message";
import { userContext } from "@/context/UserContext";
import { useLoader } from "@/context/LoaderContext";
import { RemitterLogin } from "../../services/remitterService";
import { remitterContext } from "@/context/RemitterContext";
import { setSecureCookie } from "@/context/cookiesManagement";

const ROLES = [
  { label: "Investor", value: false },
  { label: "Remitter", value: true },
];

export default function AuthLogin({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRemitter, setIsRemitter] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showLoader, hideLoader } = useLoader();
  const { setAuthUser } = use(userContext);
  const { setAuthRemitter } = use(remitterContext);

  const validateEmail = (email) => {
    if (email.length < 10 || email.length > 100) return false;
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
  };

  const handleRoleChange = (remitter) => {
    setIsRemitter(remitter);
    setError("");
    setMessage("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setMessage("");

    // Sanitization
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();

    // Validation
    if (!sanitizedEmail || !sanitizedPassword) {
      return setError("Enter email and password.");
    }
    if (!validateEmail(sanitizedEmail)) {
      return setError("Enter a valid email address.");
    }

    setIsSubmitting(true);
    try {
      if (isRemitter) {
        // Optional: remove this confirm dialog if the toggle is clear enough.
        const ur = await confirmMessage(
          "Do you want to login as a remitter?",
          "Remitter Login",
        );
        if (!ur) return;

        showLoader("Checking remitter credential...");
        const response = await RemitterLogin({
          email: sanitizedEmail,
          password: sanitizedPassword,
          role: "remiter", // confirm with backend: "remiter" or "remitter"
        });

        if (response) {
          const status = await setSecureCookie("authRemitter", response);
          if (status.success) {
            setAuthRemitter(response);
            setMessage("Signed in — redirecting...");
          } else {
            setError(status.message);
          }
        } else {
          setError("Invalid remitter credentials.");
        }
        return;
      }

      // Investor login
      showLoader("Logging in...");
      const response = await loginUser({
        email: sanitizedEmail,
        password: sanitizedPassword,
      });

      if (response.status === "success") {
        successMessage("Signed in successfully", "Congratulation !!");
        const status = await setSecureCookie("authUser", response.data);
        if (status.success) {
          setAuthUser(response.data);
          setMessage("Signed in — redirecting...");
        } else {
          setError(status.message);
        }
      } else if (response.status === "error") {
        errorMessage(response.message);
      } else {
        errorMessage("Invalid username or password");
      }
    } catch (error) {
      errorMessage(error?.payload?.message ?? "Something went wrong...");
      console.error(error);
    } finally {
      hideLoader();
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-[0_15px_50px_rgba(15,23,42,0.03)]">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Welcome Back</h2>
      <p className="text-xs text-slate-400 mb-4">
        {isRemitter
          ? "Sign in to your remitter account."
          : "Securely access your investment dashboard."}
      </p>

      {/* Role toggle */}
      <div
        role="tablist"
        aria-label="Login type"
        className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1"
      >
        {ROLES.map(({ label, value }) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={isRemitter === value}
            onClick={() => handleRoleChange(value)}
            className={`h-9 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              isRemitter === value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

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

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-[11px] font-bold uppercase text-slate-400 mb-1"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@growkaro.com"
            className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300"
          />
        </div>

        {/* Password Field */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label
              htmlFor="password"
              className="block text-[11px] font-bold uppercase text-slate-400"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => onSwitch && onSwitch("forgot")}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600"
            >
              {showPassword ? (
                <EyeClosedIcon size={16} />
              ) : (
                <EyeIcon size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-slate-950 hover:bg-slate-900 text-white rounded-full font-semibold text-sm transition-colors mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRemitter ? "Login as Remitter" : "Login"}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => onSwitch && onSwitch("signup")}
          className="text-blue-600 font-semibold hover:underline"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}