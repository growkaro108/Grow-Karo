import React from "react";
import { ZoomIn } from "lucide-react";
import StatusPill from "./StatusPill";
import { currency, dateFmt } from "./format";
import BondCertificate from "../Bondcertificate";

export default function BondStub({ bond, userName, scheme, onView }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      {/* counterfoil */}
      <div className="flex items-center justify-between bg-white/3 px-4 py-2">
        <span className="font-mono text-[11px] tracking-wide text-slate-500">
          {bond.id}
        </span>
        <StatusPill
          status={bond.status === "matured" ? "active" : bond.status}
        />
      </div>

      {/* perforation */}
      <div className="relative h-0 border-t border-dashed border-slate-700">
        <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-[#111827]" />
        <span className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-[#111827]" />
      </div>

      {/* certificate thumbnail */}
      <button
        onClick={() => onView(bond)}
        className="group relative block h-28 w-full overflow-hidden border-b border-slate-800 bg-[#F3ECD9] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset"
        aria-label={`View certificate for bond ${bond.id}`}
      >
        <BondCertificate
          bond={bond}
          userName={userName}
          scheme={scheme}
          className="h-full w-full"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white">
            <ZoomIn className="h-3.5 w-3.5" /> View certificate
          </span>
        </div>
      </button>

      {/* details */}
      <div className="grid grid-cols-2 gap-3 px-4 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Principal
          </p>
          <p className="font-[Space_Grotesk] text-sm font-semibold tabular-nums text-slate-100">
            {currency(bond.principal)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Rate
          </p>
          <p className="text-sm font-medium tabular-nums text-slate-200">
            {bond.rate}% per {bond.payoutCycle}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Maturity
          </p>
          <p className="text-sm font-medium text-slate-200">
            {dateFmt(bond.maturity)}
          </p>
        </div>
      </div>
    </div>
  );
}
