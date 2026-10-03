import React from "react";
import { ZoomIn } from "lucide-react";
import Image from "next/image";
import StatusPill from "./StatusPill";
import { calculateMaturityAmount, currency } from "./format";
import BondCertificate from "../BondCertificate.jsx";
import { resolveMediaUrl } from "../../../../../api/apiClient";

// Must match the surface the card sits on so the perforation notches look "cut out".
const NOTCH_BG = "bg-[#111827]";

function Field({ label, children, emphasis = false }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-400">{label}</p>
      <p
        className={
          emphasis
            ? "mt-0.5 truncate font-[Space_Grotesk] text-base font-semibold tabular-nums text-teal-300"
            : "mt-0.5 truncate text-sm font-medium tabular-nums text-slate-100"
        }
      >
        {children}
      </p>
    </div>
  );
}

export default function BondStub({ bond, userName, scheme, onView, viewUser }) {
  const bondLabel = bond.userSchemeId || bond.id || "";

  return (
    <article className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 transition-colors hover:border-slate-700">
      {/* counterfoil */}
      <header className="flex items-center justify-between gap-3 bg-white/5 px-4 py-2.5">
        <span className="truncate font-mono text-xs text-slate-400">
          {bond.bondNumber? `Bond: ${bond.bondNumber}` : `ID: ${bondLabel}`}
        </span>
        <StatusPill
          status={bond.status === "matured" ? "Matured" : bond.status}
        />
      </header>

      {/* perforation */}
      <div
        className="relative h-0 border-t border-dashed border-slate-700"
        aria-hidden="true"
      >
        <span
          className={`absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full border border-slate-800 ${NOTCH_BG}`}
        />
        <span
          className={`absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full border border-slate-800 ${NOTCH_BG}`}
        />
      </div>

      {/* certificate thumbnail */}
      <button
        type="button"
        onClick={() => onView(bond)}
        className="group relative block aspect-[8/3] w-full overflow-hidden border-b border-slate-800 bg-[#F3ECD9] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500"
        aria-label={`View certificate for bond ${bondLabel}`}
      >
        {/*
          The full certificate is rendered at its natural 4:3 ratio (inner wrapper),
          and the button above is only half that height, so overflow-hidden clips
          it to the top half. To show the bottom half instead, change `top-0`
          to `bottom-0` on the wrapper below.
        */}
        <div className="absolute inset-x-0 top-0 aspect-[4/3] w-full">
          {bond.bondUrl ? (
            <Image
              src={resolveMediaUrl(bond.bondUrl)}
              alt={`Certificate for bond ${bondLabel}`}
              width={800}
              height={600}
              unoptimized
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <BondCertificate
              bond={bond}
              userData={viewUser}
              userName={userName}
              scheme={scheme || bond?.schemeName}
              className="h-full w-full"
            />
          )}
        </div>

        {/* soft fade at the cut edge so it reads as "continues" */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#F3ECD9] to-transparent"
          aria-hidden="true"
        />

        {/* hover / keyboard-focus overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100 group-focus-visible:bg-black/40 group-focus-visible:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 text-xs font-medium text-white">
            <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
            View bond
          </span>
        </div>
      </button>

      {/* details */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 px-4 py-4">
        <Field label="Principal">{currency(bond.paidAmount)}</Field>
        <Field label="Rate">
          {bond.profitPercentage}% per {bond.payoutCycle}
        </Field>
        <Field label="Maturity date">
          {bond.maturityDate ? bond.maturityDate : "—"}
        </Field>
        <Field label="Payout at maturity" emphasis>
          {currency(calculateMaturityAmount(bond))}
        </Field>
      </dl>
    </article>
  );
}