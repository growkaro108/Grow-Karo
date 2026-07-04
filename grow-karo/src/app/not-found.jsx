"use client";

import React, { useState } from "react";
import { 
  AlertTriangle, 
  Home, 
  RefreshCw, 
  ShieldAlert, 
  Terminal,
  CheckCircle2
} from "lucide-react";

export default function NotFound() {
  const [isHealing, setIsHealing] = useState(false);
  const [healComplete, setHealComplete] = useState(false);
  const [logs, setLogs] = useState([]);

  const triggerSelfHeal = () => {
    setIsHealing(true);
    setHealComplete(false);
    setLogs(["Initializing integrity diagnostic...", "Checking internal route maps..."]);

    setTimeout(() => {
      setLogs(prev => [...prev, "Purging dead viewport cache memory...", "Rerouting operational pipelines..."]);
    }, 800);

    setTimeout(() => {
      setIsHealing(false);
      setHealComplete(true);
      setLogs(prev => [...prev, "System integrity restored successfully."]);
    }, 2200);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-950 p-6 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-900">
      
      {/* Visual Glitch Vector/Icon Array */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-rose-500/10 blur-3xl rounded-full h-32 w-32 mx-auto animate-pulse" />
        <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 flex items-center justify-center shadow-2xl shadow-black/50">
          <AlertTriangle className="h-10 w-10 text-rose-500 animate-bounce" style={{ animationDuration: '3s' }} />
        </div>
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
        </span>
      </div>

      {/* Error Messaging Texts */}
      <div className="text-center max-w-md space-y-2">
        <span className="text-xs font-mono font-bold tracking-widest text-rose-500 uppercase bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
          Error Code 404
        </span>
        <h2 className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent tracking-tight pt-2">
          Route Resolution Failure
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
          This endpoint has been liquidated, restricted, or moved to another vault.
        </p>
      </div>

      {/* Interactive Micro-Terminal Interface */}
      <div className="mt-8 w-full max-w-md rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md overflow-hidden shadow-xl shadow-black/40">
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Terminal className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Grow-Karo Diagnostic Layer</span>
          </div>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
          </div>
        </div>
        
        <div className="p-4 font-mono text-[11px] space-y-1.5 text-slate-400 min-h-[90px]">
          <p className="text-slate-600">&gt; await platform.resolveRoute(current_location)</p>
          <p className="text-rose-400/90 font-medium">🚨 [UNRESOLVED_DESCRIPTOR]: Link structurally compromised or expired.</p>
          {logs.map((log, idx) => (
            <p key={idx} className={idx === logs.length - 1 && healComplete ? "text-emerald-400 font-semibold" : "text-slate-300"}>
              &gt; {log}
            </p>
          ))}
        </div>

        {/* Console Call to Actions */}
        <div className="p-3 bg-slate-950 border-t border-slate-900 flex flex-col sm:flex-row gap-2">
          <button
            onClick={triggerSelfHeal}
            disabled={isHealing}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
              healComplete 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white disabled:opacity-50"
            }`}
          >
            {isHealing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-teal-400" />
            ) : healComplete ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            )}
            <span>{isHealing ? "Running Matrix Cleanse..." : healComplete ? "Environment Patched" : "Trigger Core Self-Heal"}</span>
          </button>

          <a
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-teal-500 text-slate-950 hover:bg-teal-400 transition-all shadow-md shadow-teal-500/5"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Return Home</span>
          </a>
        </div>
      </div>
    </div>
  );
}