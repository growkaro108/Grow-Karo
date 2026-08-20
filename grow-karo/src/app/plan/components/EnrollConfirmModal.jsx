import React, { use, useEffect, useMemo, useState } from "react";
import { X, User, ChevronDown, Plus, Phone, CreditCard } from "lucide-react";
import { currency } from "../utils/planUtils";
import { userContext } from "@/context/UserContext";
import dynamic from "next/dynamic";
// import AddNomineeForm from "./AddNomineeForm";
const AddNomineeForm = dynamic(() => import("./AddNomineeForm"), {
  loading: () => <div className="w-full h-32 bg-gray-200 rounded-xl"></div>,
});

const ADD_NEW_VALUE = "__add_new_nominee__";

export default function EnrollConfirmModal({
  plan,
  enrolling,
  onConfirm,
  onCancel,
}) {
  const [amount, setAmount] = useState(0);
  const { nominees, FetchNominees, nomineeId, setNomineeId } = use(userContext);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !enrolling && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, enrolling]);

  useEffect(() => {
    if (nominees) return;
    FetchNominees();
  }, [FetchNominees, nominees]);

  const selectedNominee = useMemo(
    () => nominees?.find((n) => n.nomineeId === nomineeId),
    [nominees, nomineeId],
  );

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === ADD_NEW_VALUE) {
      setShowAddForm(true);
      setNomineeId("");
      return;
    }
    setNomineeId(val);
  };

  const handleNomineeSaved = (newNominee) => {
    setNomineeId(newNominee?.nomineeId ?? "");
    setShowAddForm(false);
  };

  const canConfirm = !enrolling && Number(amount) > 0 && nomineeId;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => !enrolling && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <p className="text-sm font-semibold" style={{ color: "#1e293b" }}>
            Confirm enrollment
          </p>
          {!enrolling && (
            <button
              onClick={onCancel}
              aria-label="Close"
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="overflow-y-auto">
          {/* Plan summary */}
          <div className="px-5 pt-5 pb-4">
            <p className="text-sm" style={{ color: "#475569" }}>
              You&apos;re about to enroll in
            </p>
            <p
              className="text-base font-semibold mt-1"
              style={{ color: "#1e293b" }}
            >
              {plan.schemeName}
            </p>
            <div
              className="mt-3 flex items-center gap-4 text-sm"
              style={{ color: "#64748b" }}
            >
              <span>
                {plan.profitPercentage}% - {plan.payoutFrequency}
              </span>
              <span>·</span>
              <span>Min. {currency(plan.minimumAmount)}</span>
            </div>
          </div>

          <div className="h-px bg-slate-100 mx-5" />

          {/* Amount */}
          <div className="px-5 pt-4">
            <label
              htmlFor="amount"
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "#94a3b8" }}
            >
              Amount
            </label>
            <div className="relative mt-1.5">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: "#94a3b8" }}
              >
                ₹
              </span>
              <input
                type="number"
                id="amount"
                className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Nominee */}
          <div className="px-5 pt-5 pb-1">
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "#94a3b8" }}
            >
              Nominee
            </p>

            <div className="relative">
              <User
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "#94a3b8" }}
              />
              <select
                id="nominee"
                className="w-full appearance-none pl-8 pr-8 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                value={nomineeId}
                onChange={handleSelectChange}
              >
                <option value="" disabled>
                  {nominees?.length ? "Select a nominee" : "No nominee found"}
                </option>
                {nominees?.map((n) => (
                  <option key={n.nomineeId} value={n.nomineeId}>
                    {n.name} · {n.relation}
                  </option>
                ))}
                <option value={ADD_NEW_VALUE}>+ Add new nominee</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "#94a3b8" }}
              />
            </div>

            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: "#4f46e5" }}
              >
                <Plus size={14} /> Add nominee
              </button>
            )}

            {selectedNominee && !showAddForm && (
              <div
                className="mt-2.5 px-3 py-2 rounded-lg text-xs"
                style={{ backgroundColor: "#eef2ff", color: "#4338ca" }}
              >
                <div className="flex items-center gap-2 font-medium">
                  <User size={12} /> {selectedNominee.name} (
                  {selectedNominee.relation})
                </div>
                <div
                  className="mt-1 flex items-center gap-3"
                  style={{ color: "#6366f1" }}
                >
                  {selectedNominee.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> {selectedNominee.phone}
                    </span>
                  )}
                  {selectedNominee.aadhaar && (
                    <span className="flex items-center gap-1">
                      <CreditCard size={12} /> XXXX XXXX{" "}
                      {String(selectedNominee.aadhaar).slice(-4)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Add-nominee form, now reused from its own component */}
          {showAddForm && (
            <div className="mx-5 mt-3 mb-1">
              <AddNomineeForm
                onSaved={handleNomineeSaved}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={onCancel}
            disabled={enrolling}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(amount, nomineeId)}
            disabled={!canConfirm}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#4f46e5" }}
          >
            {enrolling && (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {enrolling ? "Enrolling…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
