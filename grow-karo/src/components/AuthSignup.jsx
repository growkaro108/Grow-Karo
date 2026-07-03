"use client";

import { useState } from "react";

export default function AuthSignup({ onSwitch }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
  const validateName = (n) => /^[a-zA-Z\s'-]{2,50}$/.test(n);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!name || !email || !password || !confirmPassword) return setError("Fill all fields.");
    if (!validateName(name)) return setError("Enter a valid name.");
    if (!validateEmail(email)) return setError("Enter a valid email.");
    if (password.length < 8) return setError("Password must be 8+ chars.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setMessage("Account created — welcome!");
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-[0_15px_50px_rgba(15,23,42,0.03)]">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Create Your Account</h2>
      <p className="text-xs text-slate-400 mb-4">Start your portfolio management journey.</p>

      {message && <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-600 text-center">{message}</div>}
      {error && <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600 text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm" />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm" />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm" />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm" />
        </div>

        <button type="submit" className="w-full h-12 bg-slate-950 text-white rounded-full font-semibold">Create Account</button>
      </form>

      <div className="mt-4 text-center text-xs text-slate-500">
        Already have an account? <button onClick={() => onSwitch && onSwitch("login")} className="text-blue-600 font-semibold">Sign In</button>
      </div>
    </div>
  );
}
