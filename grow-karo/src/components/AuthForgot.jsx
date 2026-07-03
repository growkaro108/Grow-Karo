"use client";

import { useState } from "react";

export default function AuthForgot({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(email);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email) return setError("Enter your email.");
    if (!validateEmail(email)) return setError("Enter a valid email.");
    setMessage("If an account exists, a reset link was sent.");
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-[0_15px_50px_rgba(15,23,42,0.03)]">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Reset Password</h2>
      <p className="text-xs text-slate-400 mb-4">Enter your email to receive a secure reset link.</p>

      {message && <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-600 text-center">{message}</div>}
      {error && <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600 text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Email Address</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm" />
        </div>

        <button type="submit" className="w-full h-12 bg-slate-950 text-white rounded-full font-semibold">Send Reset Link</button>
      </form>

      <div className="mt-4 text-center text-xs text-slate-500">
        <button onClick={() => onSwitch && onSwitch("login")} className="text-blue-600 font-semibold">Back to Sign In</button>
      </div>
    </div>
  );
}
