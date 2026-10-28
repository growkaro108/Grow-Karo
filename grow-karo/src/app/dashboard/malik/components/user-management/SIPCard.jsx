"use client";
import { useState } from "react";
import {
  ChevronDown,
  Landmark,
  Pen,
  Loader2,
  TrendingUp,
  Calendar,
  CheckCircle2,
  StarHalf,
  CalendarClock,
} from "lucide-react";
import Image from "next/image";
import { buildSipSchedule, currency, getSipPremium } from "./format";
import dynamic from "next/dynamic";
import SIPBondCertificate from "../SIPBondCertificate";
import { resolveMediaUrl } from "../../../../../api/apiClient";

const SIPDownloadButton = dynamic(() => import("./SIPDownloadButton"), {
  ssr: false,
});

const inputClass =
  "w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 [color-scheme:dark]";

function StatusPill({ paidAmount, dueAmount, paidDate }) {
  const isPaid = paidAmount >= dueAmount && paidAmount > 0;
  const isPartial = paidAmount > 0 && paidAmount < dueAmount;
  const hasPaidDate = Boolean(paidDate);
  if (isPaid)
    return (
      <span className="rounded-full bg-emerald-900 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 flex items-center gap-x-2 ">
        <CheckCircle2 className="h-3.5 w-3.5"/> Paid
      </span>
    );
  if (isPartial || hasPaidDate)
    return (
      <span className="rounded-full bg-fuchsia-600 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-400 flex items-center gap-x-2">
       <StarHalf className="h-3.5 w-3.5" /> Partial
      </span>
    );
  return (
    <span className="rounded-full bg-yellow-700 px-2 py-0.5 text-[10px] font-semibold text-slate-800 flex items-center gap-x-2">
     <CalendarClock className="h-3.5 w-3.5"/> Pending
    </span>
  );
}

/** SIPCard displays one SIP bond and its monthly or daily installment ledger. */
export default function SIPCard({
  bond,
  user,
  viewUser,
  sipLedger = [],
  savingLedger = false,
  onInstallmentChange, // (index, field, value) => void
  onAddInstallment, // () => void
  onSaveLedger, // () => Promise
  onViewBond,
  // Bond upload
  bondFormState = {},
  onBondFormChange,
  onSaveBond,
  savingBond,
  // Edit scheme
  editingScheme,
  schemeEditForm = {},
  onStartEditingScheme,
  onCancelEditingScheme,
  onSchemeEditFieldChange,
  onSaveSchemeDetails,
  savingSchemeDetails,
  logoUrl,
  stampUrl,
}) {
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [bondOpen, setBondOpen] = useState(false);

  const isApproved = !!bond.enrollmentDate;
  const sipFrequency =
    String(bond.sipFrequency || "MONTHLY").toUpperCase() === "DAILY"
      ? "DAILY"
      : "MONTHLY";
  const ledgerEntries = Array.isArray(sipLedger) ? [...sipLedger] : [];
  const sipAmount = getSipPremium({ ...bond, sipLedger: ledgerEntries });
  const tenureMonths =
    bond.tenureMonths ||
    (bond.tenure ? Math.round(Number(bond.tenure) / 30) : 0);
  const displayedSipAmount =
    sipAmount === null ? "Variable" : currency(sipAmount);

  // Compute auto schedule if no ledger entries
  const buildSchedule = () => {
    if (ledgerEntries.length) return ledgerEntries;
    const startDate = bond.paidDate || bond.enrollmentDate;
    return buildSipSchedule(startDate, {
      ...bond,
      sipFrequency,
      sipAmount,
    }).map((row, index) => ({ ...row, no: index + 1, paidAmount: 0 }));
  };

  const schedule = ledgerEntries.length ? ledgerEntries : buildSchedule();
  const certificateBond = { ...bond, sipLedger: schedule, sipAmount };
  const paidCount = schedule.filter(
    (r) =>
      Number(r.paidAmount) >= Number(r.dueAmount) && Number(r.paidAmount) > 0,
  ).length;
  const totalDue = schedule.reduce(
    (s, r) => s + Number(r.dueAmount ?? sipAmount),
    0,
  );
  const totalPaid = schedule.reduce((s, r) => s + Number(r.paidAmount || 0), 0);
  const totalPayableAmount = totalDue;
  const progress = schedule.length
    ? (totalPayableAmount > 0
        ? (totalPaid / totalPayableAmount) * 100
        : 0
      ).toFixed(1)
    : 0;
  // console.log(sipAmount,tenureMonths,totalPayableAmount,totalPaid)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-white/2">
      {/* Header band */}
      <div
        className={`flex items-center justify-between gap-3 px-4 py-3.5 text-white ${
          isApproved
            ? "bg-linear-to-br from-indigo-900 to-[#1a0c3d]"
            : "bg-linear-to-br from-amber-700 to-[#3d2c0c]"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <TrendingUp className="h-5 w-5 shrink-0 text-indigo-300" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {bond.schemeName}{" "}
              <span className="text-[10px] text-indigo-300 ml-1">SIP</span>
            </p>
            <p className="text-xs text-white/50">
              {sipFrequency === "DAILY"
                ? `${paidCount} deposit days · ${currency(totalPaid)} deposited`
                : `${paidCount}/${schedule.length} installments paid`}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-[Space_Grotesk] text-sm font-semibold tabular-nums text-indigo-200">
            {sipFrequency === "DAILY" ? "Variable" : displayedSipAmount}
            {sipFrequency !== "DAILY" && sipAmount !== null && (
              <span className="text-[10px] text-white/50">
                /{sipFrequency === "DAILY" ? "day" : "mo"}
              </span>
            )}
          </p>
          <p className="text-[10px] text-white/50">
            {isApproved
              ? `Enrolled: ${bond.enrollmentDate}`
              : "Pending approval"}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {sipFrequency !== "DAILY" && (
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span>Progress</span>
            <span>
              {progress}% · {currency(totalPaid)} of {currency(totalPayableAmount)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800">
            <div
              className="h-1.5 rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            Maturity
          </p>
          <p className="mt-0.5 text-sm font-medium text-slate-200">
            {bond.maturityDate ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            Tenure
          </p>
          <p className="mt-0.5 text-sm font-medium text-slate-200">
            {tenureMonths} months
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            Frequency
          </p>
          <p className="mt-0.5 text-sm font-medium text-slate-200">
            {sipFrequency === "DAILY" ? "Daily" : "Monthly"}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      {isApproved && (
        <div className="flex flex-wrap gap-2 border-t border-slate-800/70 px-4 py-2.5">
          {/* Ledger toggle */}
          <button
            type="button"
            onClick={() => setLedgerOpen((v) => !v)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
              ledgerOpen
                ? "border-indigo-700 bg-indigo-950/50 text-indigo-300"
                : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Installments
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${ledgerOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Bond upload toggle */}
          <button
            type="button"
            onClick={() => setBondOpen((v) => !v)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
              bondOpen
                ? "border-teal-700 bg-teal-950/50 text-teal-300"
                : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200"
            }`}
          >
            <Landmark className="h-3.5 w-3.5" />
            {bond.bondUrl ? "Update Bond" : "Add Bond"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${bondOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() =>
              editingScheme ? onCancelEditingScheme() : onStartEditingScheme()
            }
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
              editingScheme
                ? "border-amber-700 bg-amber-950/50 text-amber-300"
                : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200"
            }`}
          >
            <Pen className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
      )}

      {/* ── Edit scheme panel ── */}
      {editingScheme && (
        <div className="space-y-3 border-t border-slate-800/70 bg-slate-950/40 px-4 py-3.5">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-400">
              SIP {sipFrequency === "DAILY" ? "Daily" : "Monthly"} Amount
              <input
                type="number"
                min="100"
                step="100"
                value={schemeEditForm.sipAmount ?? sipAmount}
                onChange={(e) =>
                  onSchemeEditFieldChange("sipAmount", e.target.value)
                }
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="text-xs text-slate-400">
              Installment Frequency
              <input
                type="text"
                value={sipFrequency === "DAILY" ? "Daily" : "Monthly"}
                readOnly
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="text-xs text-slate-400">
              Enrollment / Start Date
              <input
                type="date"
                value={schemeEditForm.paidDate ?? ""}
                onChange={(e) =>
                  onSchemeEditFieldChange("paidDate", e.target.value)
                }
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="text-xs text-slate-400">
              Maturity Date
              <input
                type="date"
                value={schemeEditForm.maturityDate ?? ""}
                onChange={(e) =>
                  onSchemeEditFieldChange("maturityDate", e.target.value)
                }
                className={`mt-1 ${inputClass}`}
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancelEditingScheme}
              disabled={savingSchemeDetails}
              className="flex-1 rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSaveSchemeDetails}
              disabled={savingSchemeDetails}
              className="flex-1 rounded-md bg-teal-400 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50"
            >
              {savingSchemeDetails ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* ── Installment ledger panel ── */}
      {ledgerOpen && (
        <div className="space-y-3 border-t border-slate-800/70 bg-slate-950/40 px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-indigo-200">Installment ledger</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Edit each user’s due date, due amount, payment date and amount paid.
            </p>
          </div>
          <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-400">
            {schedule.length} installments
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <div className="min-w-172.5">
            <div className={`grid ${sipFrequency === "DAILY" ? "grid-cols-[2rem_minmax(6rem,1fr)_minmax(6rem,1fr)_minmax(6rem,1fr)_4rem]" : "grid-cols-[2rem_minmax(6rem,1fr)_minmax(5rem,.8fr)_minmax(6rem,1fr)_minmax(5rem,.8fr)_4rem]"} items-center gap-2 bg-slate-900 px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-500`}>
              <span>#</span>
              <span>{sipFrequency === "DAILY" ? "Schedule date" : "Due date"}</span>
              {sipFrequency !== "DAILY" && <span>Due amount</span>}
              <span>Paid date</span>
              <span>{sipFrequency === "DAILY" ? "Deposit (₹)" : "Paid amount"}</span>
              <span>Status</span>
            </div>
            <div className="max-h-80 divide-y divide-slate-800/70 overflow-y-auto scrollbar-none">
              {schedule.map((row, i) => {
                const lRow = sipLedger[i] || row;
                const dueAmount = Number(lRow.dueAmount ?? row.dueAmount ?? sipAmount);
                const paidAmount = Number(lRow.paidAmount || 0);
                const fieldCls =
                  "min-w-0 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 [color-scheme:dark]";
                return (
                  <div
                    key={i}
                    className={`grid ${sipFrequency === "DAILY" ? "grid-cols-[2rem_minmax(6rem,1fr)_minmax(6rem,1fr)_minmax(6rem,1fr)_4rem]" : "grid-cols-[2rem_minmax(6rem,1fr)_minmax(5rem,.8fr)_minmax(6rem,1fr)_minmax(5rem,.8fr)_4rem]"} items-center gap-2 px-3 py-2`}
                  >
                    <span className="text-xs tabular-nums text-slate-500">{i + 1}</span>
                    <input
                      type="date"
                      aria-label={`Installment ${i + 1} schedule date`}
                      value={lRow.installmentDate || lRow.dueDate || ""}
                      onChange={(e) => onInstallmentChange(i, "installmentDate", e.target.value)}
                      className={fieldCls}
                      disabled
                    />
                    {sipFrequency !== "DAILY" && (
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        aria-label={`Installment ${i + 1} due amount`}
                        value={lRow.dueAmount ?? row.dueAmount ?? sipAmount}
                        className={fieldCls}
                        disabled
                      />
                    )}
                    <input
                      type="date"
                      aria-label={`Installment ${i + 1} paid date`}
                      value={lRow.paidDate || ""}
                      onChange={(e) => onInstallmentChange(i, "paidDate", e.target.value)}
                      className={fieldCls}
                    />
                    <input
                      type="number"
                      min="0"
                      max={sipFrequency === "DAILY" ? "2000" : undefined}
                      step="0.01"
                      aria-label={`Installment ${i + 1} paid amount`}
                      value={lRow.paidAmount ?? 0}
                      required={sipFrequency === "DAILY" && Number(lRow.paidAmount) > 0}
                      onChange={(e) => onInstallmentChange(i, "paidAmount", e.target.value)}
                      className={fieldCls}
                    />
                    <StatusPill
                      paidAmount={paidAmount}
                      dueAmount={sipFrequency === "DAILY" ? 0 : dueAmount}
                      paidDate={
                        sipFrequency === "DAILY" && paidAmount === 0
                          ? ""
                          : lRow.paidDate
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-2">
          <button
            type="button"
            onClick={onAddInstallment}
            className="rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-indigo-600 hover:text-indigo-200"
          >
            + Add installment
          </button>
          <button
            type="button"
            onClick={onSaveLedger}
            disabled={savingLedger}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-wait disabled:opacity-60"
          >
            {savingLedger && <Loader2 size={14} className="animate-spin" />}
            {savingLedger ? "Saving…" : "Save ledger"}
          </button>
        </div>
        </div>
      )}

      {/* ── Bond upload panel ── */}
      {bondOpen && (
        <div className="space-y-2.5 border-t border-slate-800/70 bg-slate-950/40 px-4 py-3.5">
          <input
            aria-label="Bond number"
            placeholder={bond.bondNumber || "Bond number (e.g. GKSIP0021)"}
            value={bondFormState.bondNumber ?? bond.bondNumber ?? "GKSIP"}
            onChange={(e) => onBondFormChange("bondNumber", e.target.value)}
            className={inputClass}
          />
          <input
            aria-label="Bond file"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onBondFormChange("image", f);
            }}
            className="w-full text-xs text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:text-slate-200 hover:file:bg-slate-700"
          />
          <button
            type="button"
            disabled={savingBond}
            onClick={onSaveBond}
            className={`relative w-full overflow-hidden rounded-md px-3 py-2 text-xs font-semibold transition ${
              savingBond
                ? "cursor-not-allowed border-slate-600 bg-slate-950/30 text-slate-600"
                : "border border-teal-700 text-teal-300 hover:bg-teal-950/50"
            }`}
          >
            {savingBond ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Saving…
              </span>
            ) : (
              "Save bond details"
            )}
          </button>
        </div>
      )}

      {/* ── Certificate / Download ── */}
      <div className="border-t border-slate-800/70 px-4 py-3.5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            Certificate
          </p>
          {isApproved && (
            <SIPDownloadButton
              bond={certificateBond}
              userData={viewUser}
              logoUrl={stampUrl}
              stampUrl={stampUrl}
              watermarkUrl={logoUrl}
            />
          )}
        </div>
        {!isApproved ? (
          <div className="rounded-lg border border-dashed border-slate-700 px-4 py-4 text-center text-xs text-slate-500">
            Not approved yet.
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onViewBond?.(certificateBond)}
            className="group relative block aspect-8/3 w-full overflow-hidden rounded-lg border border-slate-700 bg-[#F3ECD9] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            aria-label={`View generated SIP bond for ${user?.name || "user"}`}
          >
            <div className="absolute inset-x-0 top-0 aspect-4/3 w-full">
              {bond.bondUrl ? (
                <Image
                  src={resolveMediaUrl(bond.bondUrl)}
                  alt={`Uploaded SIP bond for ${user?.name || "user"}`}
                  width={800}
                  height={600}
                  unoptimized
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <SIPBondCertificate
                  bond={certificateBond}
                  userData={viewUser || user}
                  logoUrl={logoUrl}
                  stampUrl={stampUrl}
                  className="h-full w-full"
                  profilePhoto="/profile.jpg"
                />
              )}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-10 items-center justify-center bg-gradient-to-t from-black/70 to-transparent text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
              View bond certificate
            </div>
          </button>
        )}
        {bond.nominee && (
          <div className="mt-2 text-xs text-slate-400">
            Nominee:{" "}
            <strong className="text-slate-200">{bond.nominee.name}</strong>
            <span className="ml-2 text-slate-500">
              ({bond.nominee.relation})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
