import React, { useState } from "react";
import { X, Mail, Phone, Calendar, Landmark } from "lucide-react";
import StatusPill from "./StatusPill";
import BondStub from "./BondStub";
import { currency, dateFmt, initials } from "./format";
import CertificateLightbox from "./Certificatelightbox";

export default function UserDrawer({ user, onClose }) {
  const [viewingBond, setViewingBond] = useState(null);

  if (!user) return null;
  const totalPrincipal = user.bonds.reduce((sum, b) => sum + b.principal, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full flex-col bg-[#111827] shadow-2xl shadow-black/50 sm:w-[440px] animate-[slideIn_.25s_ease-out]">
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 font-[Space_Grotesk] text-sm font-semibold text-slate-950">
              {initials(user.name)}
            </div>
            <div>
              <h2 className="font-[Space_Grotesk] text-lg font-semibold text-slate-100">
                {user.name}
              </h2>
              <p className="text-xs text-slate-500">{user.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-white/5 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Contact + status */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <StatusPill status={user.status} />
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
              <Calendar className="h-3.5 w-3.5" /> Joined {dateFmt(user.joined)}
            </span>
          </div>

          <div className="mb-6 space-y-2 rounded-xl border border-slate-800 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Mail className="h-4 w-4 text-slate-500" /> {user.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Phone className="h-4 w-4 text-slate-500" /> {user.phone}
            </div>
          </div>

          {/* Scheme */}
          <h3 className="mb-2 font-[Space_Grotesk] text-sm font-semibold uppercase tracking-wide text-slate-500">
            Joined Scheme
          </h3>
          <div className="mb-6 flex items-center justify-between rounded-xl bg-linear-to-br from-teal-900 to-[#0c3b3d] px-4 py-3.5 text-white ring-1 ring-teal-800/50">
            <div className="flex items-center gap-2.5">
              <Landmark className="h-5 w-5 text-[#D8B77B]" />
              <div>
                <p className="text-sm font-medium">{user.scheme}</p>
                <p className="text-xs text-white/50">
                  {user.bonds.length} bond{user.bonds.length !== 1 ? "s" : ""}{" "}
                  held
                </p>
              </div>
            </div>
            <p className="font-[Space_Grotesk] text-sm font-semibold tabular-nums text-[#D8B77B]">
              {currency(totalPrincipal)}
            </p>
          </div>

          {/* Bond ledger */}
          <h3 className="mb-3 font-[Space_Grotesk] text-sm font-semibold uppercase tracking-wide text-slate-500">
            Bonds
          </h3>

          {user.bonds.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
              No bonds issued yet.
            </div>
          ) : (
            <div className="space-y-3">
              {user.bonds.map((b) => (
                <BondStub
                  key={b.id}
                  bond={b}
                  userName={user.name}
                  scheme={user.scheme}
                  onView={setViewingBond}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 px-6 py-4">
          <button className="w-full rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-teal-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827]">
            Manage user
          </button>
        </div>
      </div>

      <CertificateLightbox
        bond={viewingBond}
        userName={user.name}
        scheme={user.scheme}
        onClose={() => setViewingBond(null)}
      />
    </div>
  );
}
