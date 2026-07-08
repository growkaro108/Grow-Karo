"use client";

import { loginUser } from "@/api/userApi";
import { EyeClosedIcon, EyeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthLogin({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router=useRouter();

  const validateEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
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

    // Authenticate credentials with service
    const response = await loginUser({ email: sanitizedEmail, password: sanitizedPassword });
    console.log(response);

    if (response.status === "ok") {
      setMessage("Signed in — redirecting...");
      //redirect to user Dashboard
      router.push("/dashboard");

    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-[0_15px_50px_rgba(15,23,42,0.03)]">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Welcome Back</h2>
      <p className="text-xs text-slate-400 mb-4">Securely access your investment dashboard.</p>

      {message && <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-600 text-center">{message}</div>}
      {error && <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600 text-center">{error}</div>}

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300"
          />
        </div>

        {/* Password Field */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[11px] font-bold uppercase text-slate-400">Password</label>
            <button type="button" onClick={() => onSwitch && onSwitch("forgot")} className="text-[11px] font-semibold text-blue-600 hover:underline">Forgot password?</button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600">
              {showPassword ? <EyeClosedIcon size={16} /> : <EyeIcon size={16} />}
            </button>
          </div>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="w-full h-12 bg-slate-950 hover:bg-slate-900 text-white rounded-full font-semibold text-sm transition-colors mt-4"
        >
          Login
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Don&apos;t have an account? <button onClick={() => onSwitch && onSwitch("signup")} className="text-blue-600 font-semibold hover:underline">Sign Up</button>
      </div>
    </div>
  );
}