import React, { useState } from 'react';
import { Plus, Copy, ShieldCheck, Users, Mail, Phone, Eye, EyeOff, CheckCircle2, X } from "lucide-react";
import { currency } from '../utils';
import { StatusBadge } from './StatusBadge';

export default function AdminRemitterTrackersTab({ codes, onAddRemitterToServer }) {
  // UI View States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successPayload, setSuccessPayload] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Consolidated Form Data State Object
  const [formData, setFormData] = useState({
    remitterName: '',
    remitterEmail: '',
    remitterPhone: '',
    trackerCode: '',
    allocationLimit: '',
    aadharNumber: '',
    panNumber: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  /**
   * Sanitizes and validates the entire remitter registration form state object.
   */
  function validateAndSanitizeForm(rawForm) {
    const errors = {};
    const sanitizedData = {};

    // 1. Remitter Name Sanitization (Strict Alpha-Numeric and spaces only)
    sanitizedData.remitterName = rawForm.remitterName?.trim() || "";
    if (!sanitizedData.remitterName) {
      errors.remitterName = "Entity name is required.";
    }

    // 2. Email Address Sanitization
    sanitizedData.remitterEmail = rawForm.remitterEmail?.trim().toLowerCase() || "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.remitterEmail)) {
      errors.remitterEmail = "Please enter a valid email address.";
    }

    // 3. Phone Number Sanitization (Only digits allowed)
    sanitizedData.remitterPhone = rawForm.remitterPhone?.replace(/\D/g, "") || "";
    if (sanitizedData.remitterPhone.length !== 10) {
      errors.remitterPhone = "Phone number must be exactly 10 digits.";
    }

    // 4. Tracker Code Sanitization
    sanitizedData.trackerCode = rawForm.trackerCode?.replace(/\s+/g, "").toUpperCase() || "";
    if (!sanitizedData.trackerCode || sanitizedData.trackerCode.length < 3) {
      errors.trackerCode = "Tracker code must be at least 3 characters long.";
    }

    // 5. Allocation Limit Conversion
    const rawLimit = parseFloat(rawForm.allocationLimit);
    sanitizedData.allocationLimit = isNaN(rawLimit) ? 0 : rawLimit;
    if (sanitizedData.allocationLimit <= 0) {
      errors.allocationLimit = "Allocation limit must be greater than 0.";
    }

    // 6. Identity String Structure Check (Aadhar format verification)
    sanitizedData.aadharNumber = rawForm.aadharNumber?.replace(/[\s-]/g, "") || "";
    const aadharRegex = /^\d{12}$/;
    if (!aadharRegex.test(sanitizedData.aadharNumber)) {
      errors.aadharNumber = "Identity reference number must be exactly 12 digits.";
    }

    // 7. Identity String Structure Check (PAN format verification)
    sanitizedData.panNumber = rawForm.panNumber?.replace(/\s+/g, "").toUpperCase() || "";
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(sanitizedData.panNumber)) {
      errors.panNumber = "Invalid format structure code (Expected: ABCDE1234F).";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      data: sanitizedData
    };
  }

  const handleSubmitNewRemitter = async (e) => {
    e.preventDefault();
    const result = validateAndSanitizeForm(formData);
    
    if (!result.isValid) {
      setFormErrors(result.errors);
      return;
    }
    
    setFormErrors({});
    console.log("Dispatching secure sanitized payload to remote server node...", result.data);
      
    const mockServerResponse = {
      loginId: result.data.remitterEmail,
      password: Math.random().toString(36).slice(-8) + "@Vantage",
      emailSent: false,
      remitterName: result.data.remitterName,
    };

    setSuccessPayload(mockServerResponse);
    setIsFormOpen(false);
    
    setFormData({
      remitterName: '',
      remitterEmail: '',
      remitterPhone: '',
      trackerCode: '',
      allocationLimit: '',
      aadharNumber: '',
      panNumber: ''
    });
  };

  const handleSendCredentialEmail = () => {
    if (!successPayload) return;
    setSuccessPayload(prev => ({ ...prev, emailSent: true }));
  };

  return (
    <div className="space-y-6 relative">
      
      {/* 1. CONTROL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 font-body">Remitter Performance Trackers</h2>
          <p className="text-xs text-slate-400 font-body mt-0.5">
            Managing {codes.length} active allocation links assigned to authorized remitters.
          </p>
        </div>
        <button
          onClick={() => { setSuccessPayload(null); setFormErrors({}); setIsFormOpen(true); }}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 active:scale-[0.99] transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" /> Assign Remitter
        </button>
      </div>

      {/* 2. SUCCESS NOTIFICATION BANNER */}
      {successPayload && (
        <div className="bg-slate-900 border-2 border-emerald-500/30 rounded-2xl p-5 transition-all duration-300 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Remitter Onboarded Successfully</h3>
                <p className="text-xs text-slate-400 mt-0.5">Secure gateway credentials generated by authorization server.</p>
              </div>
            </div>
            <button onClick={() => setSuccessPayload(null)} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
            <div className="space-y-1">
              <span className="text-slate-500 block text-[10px] font-sans uppercase font-bold tracking-wider">Login / Portal ID</span>
              <span className="text-slate-200 select-all">{successPayload.loginId}</span>
            </div>
            <div className="space-y-1 relative">
              <span className="text-slate-500 block text-[10px] font-sans uppercase font-bold tracking-wider">Temporary Password</span>
              <div className="flex items-center justify-between pr-2">
                <span className="text-slate-200 select-all">{showPassword ? successPayload.password : "••••••••"}</span>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-200">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={handleSendCredentialEmail}
              disabled={successPayload.emailSent}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all ${
                successPayload.emailSent 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.98]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              {successPayload.emailSent ? "Credentials Dispatched via Email" : "Email Login Details to Remitter"}
            </button>
          </div>
        </div>
      )}

      {/* 3. NEW REMITTER CREATION MODAL */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-all duration-300 ${
          isFormOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div 
          className={`bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl transition-all duration-300 transform ${
            isFormOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Setup Authorized Remitter Rail</h3>
              <p className="text-xs text-slate-400 mt-0.5">Configure access rights and disbursement tracking nodes.</p>
            </div>
            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-200 bg-slate-800 p-1.5 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          <hr className="border-slate-800" />

          <form onSubmit={handleSubmitNewRemitter} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Remitter Entity Name</label>
              <input 
                type="text" 
                name="remitterName"
                required
                placeholder="e.g. Neha Payments Ltd"
                value={formData.remitterName}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 transition-colors"
              />
              {formErrors.remitterName && <p className="text-rose-500 text-[11px] mt-1">{formErrors.remitterName}</p>}
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Official Communications Email</label>
              <input 
                type="email" 
                name="remitterEmail"
                required
                placeholder="name@remit-rail.com"
                value={formData.remitterEmail}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 transition-colors"
              />
              {formErrors.remitterEmail && <p className="text-rose-500 text-[11px] mt-1">{formErrors.remitterEmail}</p>}
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Remitter Phone Number</label>
              <div className="relative rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 focus-within:border-emerald-500 transition-colors">
                <span className="absolute left-3.5 text-slate-500 font-medium select-none">+91</span>
                <input 
                  type="tel" 
                  name="remitterPhone"
                  required
                  placeholder="9876543210"
                  value={formData.remitterPhone}
                  onChange={handleInputChange}
                  className="w-full bg-transparent pl-8 text-slate-100 outline-none"
                />
              </div>
              {formErrors.remitterPhone && <p className="text-rose-500 text-[11px] mt-1">{formErrors.remitterPhone}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1.5">Unique Tracker Code</label>
                <input 
                  type="text" 
                  name="trackerCode"
                  required
                  placeholder="e.g. NEHA-BOOST"
                  value={formData.trackerCode}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 uppercase font-mono tracking-wider outline-none focus:border-emerald-500 transition-colors"
                />
                {formErrors.trackerCode && <p className="text-rose-500 text-[11px] mt-1">{formErrors.trackerCode}</p>}
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1.5">Allocation Limit (INR)</label>
                <input 
                  type="number" 
                  name="allocationLimit"
                  required
                  placeholder="100000"
                  value={formData.allocationLimit}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 transition-colors"
                />
                {formErrors.allocationLimit && <p className="text-rose-500 text-[11px] mt-1">{formErrors.allocationLimit}</p>}
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1.5">Aadhar Number</label>
                {/* CHANGED FROM type="number" TO type="text" TO BLOCK HTML5 MATH OVERFLOW EXPLOITS */}
                <input 
                  type="text" 
                  name="aadharNumber"
                  required
                  maxLength={12}
                  placeholder="e.g. 123456789012"
                  value={formData.aadharNumber}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 font-mono tracking-wider outline-none focus:border-emerald-500 transition-colors"
                />
                {formErrors.aadharNumber && <p className="text-rose-500 text-[11px] mt-1">{formErrors.aadharNumber}</p>}
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1.5">PAN Number</label>
                <input 
                  type="text" 
                  name="panNumber"
                  required
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={formData.panNumber}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 transition-colors"
                />
                {formErrors.panNumber && <p className="text-rose-500 text-[11px] mt-1">{formErrors.panNumber}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)}
                className="w-1/2 py-2.5 border border-slate-800 text-slate-300 font-semibold rounded-xl hover:bg-slate-800"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="w-1/2 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 shadow-md active:scale-[0.99] transition-all"
              >
                Onboard & Generate
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 4. PERFORMANCE GRID */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {codes.map((c) => {
          const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
          return (
            <div key={c.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-mono text-base font-bold tracking-wider text-slate-100">{c.code}</span>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" /> Authorized Remitter Rail
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="mb-2 flex items-baseline justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total Disbursed</p>
                    <span className="text-base font-bold text-emerald-400">{currency(c.raised)}</span>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Allocation Limit</p>
                    <span className="text-sm font-medium text-slate-300">of {currency(c.goal)}</span>
                  </div>
                </div>
                <div className="relative mb-5 pt-1">
                  <div className="mb-1 flex items-center justify-end"><span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">{pct}% Cleared</span></div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-linear-to-r from-emerald-600 to-emerald-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 mt-2">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-bold text-slate-200">{c.referrals}</span> successful payouts
                </span>
                <span className="text-[11px] font-medium text-slate-500 truncate max-w-32.5" title={c.owner}>Owner: {c.owner}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}