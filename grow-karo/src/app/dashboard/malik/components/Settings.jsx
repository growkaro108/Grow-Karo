"use client";

import React, { useState } from "react";
import {
  Sliders,
  ShieldAlert,
  Percent,
  BellRing,
  Save,
  RefreshCw,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

export default function Settings() {
  const [activeSection, setActiveSection] = useState("investment");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Core Platform Configuration States
  const [settings, setSettings] = useState({
    minWithdrawal: "500",
    maxWithdrawal: "500000",
    platformFee: "1.5",
    autoApproveLimit: "25000",
    maintenanceMode: false,
    mfaRequired: true,
    emailAlerts: true,
    webhookUrl: "https://api.grow-karo.com/v1/webhooks/admin",
  });

  const handleInputChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    // Simulate API delay for configuration write
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md  h-[60vh] items-center">
      {/* Settings Module Header */}
      <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/20">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="h-5 w-5 text-teal-400" />
            System Control & Gateway Configurations
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Modify critical routing thresholds, risk triggers, and operational
            states for Grow-Karo.
          </p>
        </div>

        {/* Dynamic Save Feedback Actions */}
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md ${
            saveSuccess
              ? "bg-emerald-500 text-slate-950 shadow-emerald-500/10"
              : "bg-teal-500 text-slate-900 hover:bg-teal-400 disabled:opacity-50 shadow-teal-500/10"
          }`}
        >
          {isSaving ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Committing Matrix...</span>
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Configurations Saved</span>
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              <span>Save System Changes</span>
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col md:flex-row min-h-125">
        {/* Sub-Navigation Sub-Panel */}
        <div className="w-full md:w-56 border-r border-slate-800/60 p-3 space-y-1 bg-slate-950/20">
          {[
            { id: "investment", label: "Financial & Limits", icon: Percent },
            { id: "security", label: "Security & Gates", icon: ShieldAlert },
            { id: "notifications", label: "System Triggers", icon: BellRing },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  activeSection === tab.id
                    ? "bg-slate-900 text-teal-400 border border-slate-800 shadow-inner font-semibold"
                    : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${activeSection === tab.id ? "text-teal-400" : "text-slate-500"}`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Forms Core Section */}
        <form onSubmit={handleSaveSettings} className="flex-1 p-6 space-y-6">
          {/* SECTION 1: INVESTMENT LIMITS */}
          {activeSection === "investment" && (
            <div className="space-y-4 class-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-2">
                    Min Withdrawal Limit (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.minWithdrawal}
                    onChange={(e) =>
                      handleInputChange("minWithdrawal", e.target.value)
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-2">
                    Max Daily Payout Cap (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.maxWithdrawal}
                    onChange={(e) =>
                      handleInputChange("maxWithdrawal", e.target.value)
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-2">
                    Global Platform Management Fee (%)
                  </label>
                  <input
                    type="text"
                    value={settings.platformFee}
                    onChange={(e) =>
                      handleInputChange("platformFee", e.target.value)
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-2">
                    Instant Auto-Approval Ceiling (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.autoApproveLimit}
                    onChange={(e) =>
                      handleInputChange("autoApproveLimit", e.target.value)
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700 transition-colors"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                    <HelpCircle className="h-3 w-3 text-slate-600" /> Requests
                    above this will strictly trigger manual admin review lines.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: SECURITY & OPERATIONAL ENGINES */}
          {activeSection === "security" && (
            <div className="space-y-4">
              {/* Toggle Switch: Maintenance Mode */}
              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/10 flex items-center justify-between gap-4">
                <div className="max-w-md">
                  <h4 className="text-xs font-bold text-white tracking-wide">
                    Emergency Global Maintenance Overlap
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Freeze public database updates, blocking funding and
                    withdrawal lines globally for general operations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("maintenanceMode")}
                  className={`w-11 h-6 rounded-full p-1 transition-colors shrink-0 ${
                    settings.maintenanceMode ? "bg-rose-500" : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.maintenanceMode
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Toggle Switch: MFA Mandatory Verification */}
              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/10 flex items-center justify-between gap-4">
                <div className="max-w-md">
                  <h4 className="text-xs font-bold text-white tracking-wide">
                    Mandatory Multi-Factor Administrative Validation
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Enforce hardware security key or TOTP challenges for
                    verifying payouts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("mfaRequired")}
                  className={`w-11 h-6 rounded-full p-1 transition-colors shrink-0 ${
                    settings.mfaRequired ? "bg-teal-500" : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.mfaRequired ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* SECTION 3: WEBHOOKS & NOTIFICATION BROADCASTS */}
          {activeSection === "notifications" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/10 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">
                    Live Slack/Discord Webhook Synchronization
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Dispatch live alerts for sudden multi-million deposits
                    directly into corporate channels.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("emailAlerts")}
                  className={`w-11 h-6 rounded-full p-1 transition-colors shrink-0 ${
                    settings.emailAlerts ? "bg-teal-500" : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.emailAlerts ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-2">
                  System Audit Dispatch Endpoint URL
                </label>
                <input
                  type="url"
                  value={settings.webhookUrl}
                  onChange={(e) =>
                    handleInputChange("webhookUrl", e.target.value)
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-slate-700 transition-colors"
                />
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
