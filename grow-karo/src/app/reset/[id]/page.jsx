"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { resetThePassword } from "../../../../services/grahakService";
import Link from "next/link";
import { allRounderMessage } from "@/components/Message";
import { resetPasswordForRemitter } from "@/api/remitterApi";

// Pure, reusable — no reason for these to live inside the component body.
const PASSWORD_RULES = [
  {
    key: "length",
    label: "8+ characters and max 64",
    test: (pw) => pw.length >= 8 && pw.length <= 64,
  },
  {
    key: "uppercase",
    label: "1 uppercase letter",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    key: "lowercase",
    label: "1 lowercase letter",
    test: (pw) => /[a-z]/.test(pw),
  },
  { key: "number", label: "1 number", test: (pw) => /\d/.test(pw) },
  {
    key: "symbol",
    label: "1 special symbol",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

function PasswordRequirements({ password }) {
  return (
    <div className="space-y-2 text-xs text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">
      <p className="font-medium text-gray-700 mb-2">Password must contain:</p>
      <ul className="grid grid-cols-1 gap-2">
        {PASSWORD_RULES.map(({ key, label, test }) => {
          const valid = test(password);
          return (
            <li
              key={key}
              className={`flex items-center space-x-2 transition-colors duration-200 ${
                valid ? "text-emerald-600 font-medium" : "text-gray-400"
              }`}
            >
              <span
                aria-hidden="true"
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  valid ? "bg-emerald-500 scale-110" : "bg-gray-300"
                }`}
              />
              <span>{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Page({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const isPasswordValid = useMemo(
    () => PASSWORD_RULES.every(({ test }) => test(password)),
    [password],
  );
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit =
    isPasswordValid && passwordsMatch && status !== "submitting";

  const [userId, type] = id.split("_");
  useEffect(() => {
    if (!id) {
      router.replace("/auth");
    }
    window.history.replaceState(null, "", "/reset");

    function isValidId(idStr, role) {
      const pattern = /^GKUSID\d{14}$/;
      const newPattern = /^GKUID\d{14}$/;
      const remPattern = /^GKREMID-\d{17}$/;

      if (role === "user") {
        return pattern.test(idStr) || newPattern.test(idStr);
      } else if (role === "rem") {
        return remPattern.test(idStr);
      }

      return false;
    }
    if (!isValidId(userId, type)) {
      router.replace("/auth");
    }

    // console.log(email, userId);
  }, [id, router, type, userId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Password doesn't meet all requirements.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setStatus("submitting");
    try {
      const res =
        type === "rem"
          ? await resetPasswordForRemitter(userId, password)
          : await resetThePassword(password, userId);
      allRounderMessage(res);
      if (res.status !== "success") {
        setError(res.message);
      } else {
        setStatus("success");
        setTimeout(() => {
          router.push("/auth");
        }, 1000);
      }
    } catch (err) {
      setStatus("error");
      setError(err.message);
    } finally {
      setTimeout(() => {
        setStatus("idle");
      }, 2000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 mt-5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Set New Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your new password must be different and strong with all checks.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1"
              >
                New Password
              </label>
              <input
                id="new-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-describedby="password-requirements"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1"
              >
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                placeholder="••••••••"
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-1 text-xs text-red-600">
                  Passwords don&apos;t match.
                </p>
              )}
            </div>
            {/*  show password checKbox */}
            <div className="flex items-center">
              <input
                id="show-password"
                name="showPassword"
                type="checkbox"
                value={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 text-black border-gray-300 rounded"
              />
              <label
                htmlFor="show-password"
                className="ml-2 block text-sm text-gray-900"
              >
                Show Password
              </label>
            </div>
          </div>

          <div id="password-requirements">
            <PasswordRequirements password={password} />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 text-center">
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3.5 px-4 bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              {status === "submitting" ? "Resetting…" : "Reset Password"}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/auth"
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              ← Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
