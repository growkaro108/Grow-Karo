"use client";

import { loginUser } from "@/api/userApi";
import { EyeClosedIcon, EyeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { errorMessage, successMessage } from "./Message";
import { userContext } from "@/context/UserContext";
import { setSecureCookie } from "@/context/cookiesManagement";

export default function AuthLogin({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { authUser, setAuthUser, isLoading, setIsLoading } = use(userContext);

  // Guards against double submits (e.g. rapid Enter key presses)
  // that could race ahead of the isLoading state update.
  const submittingRef = useRef(false);

  const validateEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
  };
  useEffect(() => {
    if (authUser && !isLoading) {
      router.push("/dashboard");
    }
  }, [isLoading, authUser, router]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (submittingRef.current) return;

    setError("");
    setMessage("");

    // Sanitization
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();

    // Validation (no network call yet, so no need to spin the loader)
    if (!sanitizedEmail || !sanitizedPassword) {
      setError("Enter email and password.");
      return;
    }
    if (!validateEmail(sanitizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    submittingRef.current = true;
    setIsLoading(true);

    try {
      // Authenticate credentials with service
      const response = await loginUser({
        email: sanitizedEmail,
        password: sanitizedPassword,
      });

      if (process.env.NODE_ENV !== "production") {
        console.log("loginUser response:", response);
      }

      if (response.status === "ok") {
        successMessage("Signed in successfully", "Congratulation !!");
        const status = await setSecureCookie("authUser", response.data.user);
        if (status.success) {
          setAuthUser(response.data.user);
          setMessage("Signed in — redirecting...");
          router.push("/dashboard");
        } else {
          setError(status.message);
        }
      } else if (response.status === "error") {
        errorMessage(response.message);
        setPassword("");
      } else {
        errorMessage("Invalid username or password");
        setPassword("");
      }
    } catch (error) {
      errorMessage(
        "Something went wrong. Please check your connection and try again.",
      );
      console.error(error);
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-[0_15px_50px_rgba(15,23,42,0.03)]">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Welcome Back</h2>
      <p className="text-xs text-slate-400 mb-4">
        Securely access your investment dashboard.
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@growkaro.com"
            autoComplete="email"
            disabled={isLoading}
            required
            className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300 disabled:opacity-60"
          />
        </div>

        {/* Password Field */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label
              htmlFor="passwd"
              className="block text-[11px] font-bold uppercase text-slate-400"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => onSwitch("forgot")}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              id="passwd"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoading}
              required
              className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600 disabled:opacity-60"
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
          disabled={isLoading}
          className="w-full h-12 bg-slate-950 hover:bg-slate-900 text-white rounded-full font-semibold text-sm transition-colors mt-4 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? "Signing in..." : "Login"}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => onSwitch ?? onSwitch("signup")}
          disabled={isLoading}
          className="text-blue-600 font-semibold hover:underline disabled:opacity-60"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}
