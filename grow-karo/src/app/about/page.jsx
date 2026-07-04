"use client";

import React from "react";
import { 
  Building2, 
  ShieldCheck, 
  FileText, 
  Users, 
  CheckCircle, 
  Lock, 
  Cpu, 
  Scale 
} from "lucide-react";

export default function AboutUs() {
  const coreValues = [
    {
      icon: Users,
      title: "Client-Centric Wealth",
      description: "Building fractionalized financial access models so institutional-grade asset instruments are available to every retail investor ecosystem."
    },
    {
      icon: Cpu,
      title: "Automated Precision",
      description: "Engineered with proprietary matching routers to handle high-frequency allocations with zero latency or settlement slippage."
    },
    {
      icon: Scale,
      title: "Absolute Compliance",
      description: "Operating with rigorous audit logs, clean data lines, and total transparency alignment under active legal frameworks."
    }
  ];

  const securityFeatures = [
    "Hardware Security Keys & Multi-Factor Administration (MFA)",
    "AES-256 Bit End-to-End Vault Encryption Protocols",
    "Real-time Automated Fraud & Anomalous Withdrawal Triggers",
    "Isolated Microservice Architecture with Continuous DevSecOps Audits"
  ];

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12 selection:bg-teal-100 selection:text-teal-900 font-sans">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* SECTION 1: HERO HEADER */}
        <div className="text-center space-y-4 max-w-2xl mx-auto pt-4">
          <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto shadow-sm">
            <Building2 className="h-6 w-6 text-teal-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            The Infrastructure of Modern Trust
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Grow-Karo is an advanced fintech ecosystem engineered to optimize asset multiplication through high-fidelity security matrices and crystal-clear corporate governance.
          </p>
        </div>

        {/* SECTION 2: VALUES & VISION */}
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600" /> Corporate Core Elements
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coreValues.map((value, idx) => {
              const Icon = value.icon;
              return (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-slate-700" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{value.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: SPLIT ARCHITECTURE - SECURITY & POLICY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Security Operations (6 Columns) */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Service Security Protocols
              </h3>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Tier-1 Secure
              </span>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Our engineering architecture models maintain isolated parameters to safeguard investor capitale fields against dynamic threat surfaces.
            </p>

            <div className="space-y-3">
              {securityFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                  <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700 font-medium leading-tight">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Operational Policies (6 Columns) */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-teal-600" />
                Governance & Fair Use Policy
              </h3>
              <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                Revised 2026
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">1. Anti-Money Laundering Compliance (AML)</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Every inbound routing deposit requires authentic PAN verification and matching bank account credentials to strictly counteract illegal cash pipelines.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">2. Liquidity & Capital Payout Controls</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Withdrawal limits are calculated daily to prevent extreme capital flight runs and keep clearinghouse settlement matrix buffers robustly populated.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">3. Privacy Guarantee & Zero-Data Brokerage</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Telemetry transaction metadata files are heavily encrypted. We do not sell user profiles or tracking histories to marketing entities.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER METRIC BRANDING */}
        <div className="text-center border-t border-slate-200 pt-8 text-[11px] text-slate-400 font-mono tracking-wide">
          GROW-KARO MUTUAL CAPITAL INFRASTRUCTURE • ALL RIGHTS RESERVED
        </div>
      </div>
    </div>
  );
}