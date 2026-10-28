"use client";
import { Plus, Sparkles, X, Trash2 } from "lucide-react";
import React, { memo, useCallback, useMemo, useState } from "react";
import Field from "./Field";
import {
  createPlan,
  updatePlan,
} from "../../../../../../services/malikService";
import { errorMessage, successMessage } from "@/components/Message";
import { Suggestion } from "./Suggestion";
import { formatDateTime } from "@/app/plan/utils/planUtils";

/* ------------------------------------------------------------------ */
/* Module-level constants (created once, not on every render)          */
/* ------------------------------------------------------------------ */
const MAX_TERMS = 8;
const MAX_TERM_LENGTH = 110; // keeps a term on one line of the bond certificate
const TERM_WARN_AT = MAX_TERM_LENGTH - 20;
const EMPTY_TERMS = [];

const INPUT_CLS =
  "w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-950/30 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-100 outline-none transition-all placeholder-slate-600";
const INPUT_UPPER_CLS = `${INPUT_CLS} uppercase tracking-wide`;
const INPUT_PROFIT_CLS = `${INPUT_CLS} font-bold text-emerald-400`;
const INPUT_DATE_CLS = `${INPUT_CLS} scheme-dark`;
const INPUT_TEXTAREA_CLS = `${INPUT_CLS} resize-none`;

const PLAN_TYPES = [
  { value: "FD", label: "Fixed Deposit (FD)", description: "One-time lump sum investment with fixed tenure" },
  { value: "SIP", label: "Systematic Investment Plan (SIP)", description: "Monthly or daily recurring installment plan" },
  { value: "PENSION", label: "Pension Plan", description: "Interest-only payouts; principal is settled at maturity" },
];

// Same wording the bond certificate falls back to when a scheme has no terms.
const DEFAULT_TERMS = [
  "This Bond is valid only till maturity date*",
  "Profit will be generated within 7 to 10 working days after completion of tenure*",
  "Payment is not made on Saturday, Sunday and Bank Holidays as the office remains closed*",
];
const PENSION_DEFAULT_TERMS = [
  "Interest payouts are recorded manually and are separate from principal*",
  "Principal is settled separately within 30 days after the maturity date*",
  "This Bond is valid only till the stated maturity date*",
];

/* ------------------------------------------------------------------ */
/* Memoized sub-components: typing in one field no longer re-renders   */
/* the plan-type cards or every term row.                              */
/* ------------------------------------------------------------------ */
const PlanTypeSelector = memo(function PlanTypeSelector({ value, onSelect }) {
  return (
    <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
        Plan Type
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PLAN_TYPES.map((pt) => {
          const active = value === pt.value;
          return (
            <button
              key={pt.value}
              type="button"
              onClick={() => onSelect(pt.value)}
              className={`flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-all ${
                active
                  ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_14px_rgba(34,211,238,0.12)]"
                  : "border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
              }`}
            >
              <span
                className={`text-sm font-bold ${
                  active ? "text-cyan-300" : "text-slate-300"
                }`}
              >
                {pt.label}
              </span>
              <span className="mt-0.5 text-[11px] text-slate-500">
                {pt.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

const TermRow = memo(function TermRow({ index, term, onChange, onRemove, onEnter }) {
  const handleKeyDown = (e) => {
    // Enter adds another term instead of submitting the form
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-2.5 w-5 shrink-0 text-right text-xs tabular-nums text-slate-500">
        {index + 1}.
      </span>
      <div className="flex-1">
        <input
          value={term}
          maxLength={MAX_TERM_LENGTH}
          onChange={(e) => onChange(index, e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. This Bond is valid only till maturity date*"
          aria-label={`Term ${index + 1}`}
          className={INPUT_CLS}
        />
        {term.length > TERM_WARN_AT && (
          <p className="mt-1 text-right text-[11px] tabular-nums text-slate-500">
            {term.length}/{MAX_TERM_LENGTH}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        aria-label={`Remove term ${index + 1}`}
        className="mt-1.5 rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
});

const TermsSection = memo(function TermsSection({
  terms,
  onAdd,
  onChange,
  onRemove,
  onUseDefaults,
}) {
  return (
    <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Terms of Scheme</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Shown as bullet points on the bond certificate. Keep each term to one line.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {terms.length === 0 && (
            <button
              type="button"
              onClick={onUseDefaults}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
            >
              Use default terms
            </button>
          )}
          <button
            type="button"
            onClick={onAdd}
            disabled={terms.length >= MAX_TERMS}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} /> Add term
          </button>
        </div>
      </div>

      {terms.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-800 px-4 py-5 text-center text-sm text-slate-500">
          No terms added yet. The bond will show the standard terms until you add your own.
        </p>
      ) : (
        <ol className="mt-4 space-y-2.5">
          {terms.map((term, index) => (
            <TermRow
              // Terms are plain strings with no id; index is the only stable
              // identity available, and rows are cheap thanks to memo().
              key={index}
              index={index}
              term={term}
              onChange={onChange}
              onRemove={onRemove}
              onEnter={onAdd}
            />
          ))}
        </ol>
      )}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Main modal                                                          */
/* ------------------------------------------------------------------ */
export default function FormModal({
  editingId,
  form,
  formError,
  setForm,
  PAYOUT_FREQUENCIES,
  RISK_LEVELS,
  setEditingId,
  setPlans,
  setFormError,
  setOpen,
  emptyPlan,
  schemeNames,
  setShowSuggestions,
}) {
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = editingId != null && editingId !== false && editingId !== "";
  const terms = Array.isArray(form.terms) ? form.terms : EMPTY_TERMS;
  const planType = form.planType || "FD";

  /* ---- generic handlers ---- */
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setForm((prev) => ({
        ...prev,
        [name]: value,
        ...(name === "tenureMonths"
          ? { tenure: value ? String(Number(value) * 30) : "" }
          : {}),
      }));
    },
    [setForm],
  );

  const handleStatusChange = useCallback(
    (e) => setForm((prev) => ({ ...prev, status: e.target.value === "true" })),
    [setForm],
  );

  const handlePlanTypeSelect = useCallback(
    (value) =>
      setForm((prev) => ({
        ...prev,
        planType: value,
        ...(["SIP", "PENSION"].includes(value) && !prev.tenureMonths
          ? {
              tenureMonths: prev.tenure
                ? String(Math.max(1, Math.round(Number(prev.tenure) / 30)))
                : "",
            }
          : {}),
      })),
    [setForm],
  );

  const handleSchemeNameSuggestion = useCallback(
    (value) => setForm((prev) => ({ ...prev, schemeName: value })),
    [setForm],
  );

  const handleNameFocus = useCallback(
    () => setShowSuggestions(true),
    [setShowSuggestions],
  );
  const handleNameBlur = useCallback(
    // small delay so a click on a suggestion registers before the list closes
    () => setTimeout(() => setShowSuggestions(false), 150),
    [setShowSuggestions],
  );

  /* ---- terms of scheme (stable callbacks so memoized rows don't re-render) ---- */
  const addTerm = useCallback(() => {
    setForm((prev) => {
      const list = Array.isArray(prev.terms) ? prev.terms : EMPTY_TERMS;
      if (list.length >= MAX_TERMS) return prev;
      return { ...prev, terms: [...list, ""] };
    });
  }, [setForm]);

  const updateTerm = useCallback(
    (index, value) => {
      setForm((prev) => {
        const list = Array.isArray(prev.terms) ? [...prev.terms] : [];
        list[index] = value;
        return { ...prev, terms: list };
      });
    },
    [setForm],
  );

  const removeTerm = useCallback(
    (index) => {
      setForm((prev) => {
        const list = Array.isArray(prev.terms) ? prev.terms : EMPTY_TERMS;
        return { ...prev, terms: list.filter((_, i) => i !== index) };
      });
    },
    [setForm],
  );

  // Not named `useXxx` on purpose: it's an event handler, not a hook.
  const applyDefaultTerms = useCallback(() => {
    const defaultTerms =
      planType === "PENSION" ? PENSION_DEFAULT_TERMS : DEFAULT_TERMS;
    setForm((prev) => ({ ...prev, terms: [...defaultTerms] }));
  }, [planType, setForm]);

  /* ---- lifecycle ---- */
  const closeModal = useCallback(() => {
    setOpen(false);
    setEditingId(null);
    setForm(emptyPlan);
    setFormError(null);
  }, [emptyPlan, setEditingId, setForm, setFormError, setOpen]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (isSaving) return; // guard against double submit (e.g. rapid Enter)
      setIsSaving(true);
      setFormError(null);
      try {
        // trim and drop blank terms before sending
        const payload = {
          ...form,
          planType,
          tenure:
            planType === "SIP" || planType === "PENSION"
              ? Number(form.tenureMonths) * 30
              : Number(form.tenure),
          tenureMonths:
            planType === "SIP" || planType === "PENSION"
              ? Number(form.tenureMonths)
              : null,
          sipFrequency:
            planType === "SIP" ? form.sipFrequency || "MONTHLY" : null,
          sipAmount:
            planType === "SIP" && form.sipFrequency !== "DAILY"
              ? Number(form.sipAmount)
              : null,
          terms: terms.map((t) => String(t || "").trim()).filter(Boolean),
        };
        const response = isEditing
          ? await updatePlan(editingId, payload)
          : await createPlan(payload);

        if (response.status !== "success") {
          const message = response.message || "Something went wrong..";
          errorMessage(message, "error");
          setFormError(message);
          return;
        }

        successMessage(
          response.message ||
            (isEditing ? "Plan updated successfully.." : "Scheme Added successfully.."),
          "success",
        );
        setPlans(response.data);
        closeModal();
      } catch (err) {
        const message =
          err?.message || "Something went wrong while saving this plan.";
        errorMessage(message, "error");
        setFormError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [form, terms, planType, isEditing, editingId, isSaving, setFormError, setPlans, closeModal],
  );

  /* ---- derived option lists (only rebuilt when their source changes) ---- */
  const payoutOptions = useMemo(
    () =>
      PAYOUT_FREQUENCIES.map((freq) => (
        <option key={freq} value={freq} className="capitalize">
          {freq}
        </option>
      )),
    [PAYOUT_FREQUENCIES],
  );

  const riskOptions = useMemo(
    () =>
      RISK_LEVELS.map((risk, idx) => (
        <option key={risk} value={idx}>
          {risk}
        </option>
      )),
    [RISK_LEVELS],
  );

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all duration-300">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-[0_24px_70px_rgba(0,0,0,0.5)] overflow-hidden max-h-[92vh] flex flex-col scale-100 animate-[fadeIn_0.2s_ease-out,scaleUp_0.2s_ease-out]"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800/80 px-6 py-4 bg-slate-950/40">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Sparkles
                size={18}
                className="text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]"
              />
            ) : (
              <Plus size={18} className="text-cyan-400" />
            )}
            <h2 className="text-base font-bold text-slate-100">
              {isEditing ? "Modify Asset Configuration" : "Deploy New Asset Plan"}
            </h2>
            {isEditing && (
              <p className="text-xs">
                Last Updated : {formatDateTime(form.updatedAt)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close"
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 bg-slate-900 text-slate-300">
          {formError && (
            <div
              role="alert"
              className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium rounded-xl px-4 py-3"
            >
              {formError}
            </div>
          )}

          <PlanTypeSelector value={planType} onSelect={handlePlanTypeSelect} />

          {/* Identification */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <Field label="Scheme Name">
                <input
                  required
                  name="schemeName"
                  value={form.schemeName || ""}
                  onChange={handleChange}
                  placeholder="e.g. Growth funds.."
                  autoComplete="off"
                  className={INPUT_CLS}
                  onFocus={handleNameFocus}
                  onBlur={handleNameBlur}
                />
              </Field>
              {!isEditing && (
                <Suggestion
                  schemeNames={schemeNames}
                  target={form.schemeName}
                  setTo={handleSchemeNameSuggestion}
                />
              )}
            </div>
            <Field label="Category">
              <input
                required
                name="schemeCategory"
                value={form.schemeCategory || ""}
                onChange={handleChange}
                placeholder="e.g. investment..."
                className={INPUT_UPPER_CLS}
              />
            </Field>
          </div>

          {/* Financials */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Min. Investment (₹)">
              <input
                type="number"
                required
                name="minimumAmount"
                value={form.minimumAmount || ""}
                onChange={handleChange}
                placeholder="500"
                className={INPUT_CLS}
              />
            </Field>
            <Field label="Max. Investment (₹)">
              <input
                type="number"
                required
                name="maximumAmount"
                value={form.maximumAmount || ""}
                onChange={handleChange}
                placeholder="50000"
                className={INPUT_CLS}
              />
            </Field>
            <Field
              label={
                planType === "SIP"
                  ? "Tenure (Months)"
                  : planType === "PENSION"
                    ? "Default bond term (Months)"
                    : "Asset Tenure (Days)"
              }
            >
              <input
                type="number"
                required
                min="1"
                name={planType === "SIP" || planType === "PENSION" ? "tenureMonths" : "tenure"}
                value={planType === "SIP" || planType === "PENSION" ? form.tenureMonths || "" : form.tenure || ""}
                onChange={handleChange}
                placeholder={planType === "SIP" || planType === "PENSION" ? "12" : "365"}
                className={INPUT_CLS}
              />
            </Field>
            <Field label={planType === "PENSION" ? "Default monthly interest (%)" : "Profit Percentage (%)"}>
              <input
                type="number"
                step="0.01"
                required
                name="profitPercentage"
                value={form.profitPercentage || ""}
                onChange={handleChange}
                placeholder={planType === "PENSION" ? "10" : "8.5"}
                className={INPUT_PROFIT_CLS}
              />
            </Field>
          </div>
          {planType === "PENSION" && (
            <p className="text-xs leading-5 text-slate-400">
              Each bond can use its own principal, monthly interest rate, and
              term. Monthly interest is scheduled at enrollment; principal is
              returned separately after maturity.
            </p>
          )}

           {planType === "SIP" && (
             <div className="bg-indigo-950/20 border border-indigo-900/60 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
               <Field label="Installment Frequency">
                 <select
                   name="sipFrequency"
                  value={form.sipFrequency || "MONTHLY"}
                  onChange={handleChange}
                  className={INPUT_CLS}
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="DAILY">Daily</option>
                </select>
              </Field>
              {form.sipFrequency !== "DAILY" && (
                <Field label="Default Monthly Installment (₹)">
                  <input
                    type="number"
                    min={form.minimumAmount || "0.01"}
                    max={form.maximumAmount || undefined}
                    step="0.01"
                    required
                    name="sipAmount"
                    value={form.sipAmount || ""}
                    onChange={handleChange}
                    placeholder="1000"
                    className={INPUT_CLS}
                  />
                </Field>
              )}
              {form.sipFrequency === "DAILY" && (
                <p className="self-center text-xs leading-5 text-slate-400">
                  Daily deposits can vary. Each calendar day allows up to ₹2,000;
                  interest is calculated from the actual payment date.
                </p>
              )}
            </div>
          )}

          {/* Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            <Field label="Payout Frequency">
              <select
                name="payoutFrequency"
                value={form.payoutFrequency || "Monthly"}
                onChange={handleChange}
                className={INPUT_CLS}
              >
                {payoutOptions}
              </select>
            </Field>
            <Field label="Risk Level">
              <select
                name="riskLevel"
                value={form.riskLevel ?? "1"}
                onChange={handleChange}
                className={INPUT_CLS}
              >
                {riskOptions}
              </select>
            </Field>
            <Field label="Start Date">
              <input
                type="date"
                required
                name="startDate"
                value={form.startDate || ""}
                onChange={handleChange}
                className={INPUT_DATE_CLS}
              />
            </Field>
            <Field label="Plan End Date">
              <input
                type="date"
                required
                name="endDate"
                value={form.endDate || ""}
                onChange={handleChange}
                className={INPUT_DATE_CLS}
              />
            </Field>
          </div>

          {/* Limits + status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Max Investors Pool Cap">
              <input
                type="number"
                required
                name="maxInvestorsAllowed"
                value={form.maxInvestorsAllowed || ""}
                onChange={handleChange}
                placeholder="500"
                className={INPUT_CLS}
              />
            </Field>
            <Field label="Scheme Status">
              <select
                name="status"
                value={form.status === undefined ? "true" : String(form.status)}
                onChange={handleStatusChange}
                className={INPUT_CLS}
              >
                <option value="true">Active (Open for Deposits)</option>
                <option value="false">Closed (Locked)</option>
              </select>
            </Field>
          </div>

          {/* Details */}
          <Field label="Scheme Profile Details">
            <textarea
              rows={3}
              required
              name="schemeDetails"
              value={form.schemeDetails || ""}
              onChange={handleChange}
              placeholder="Provide deep structural compliance indices, background asset backing details, and allocation metrics..."
              className={INPUT_TEXTAREA_CLS}
            />
          </Field>

          <TermsSection
            terms={terms}
            onAdd={addTerm}
            onChange={updateTerm}
            onRemove={removeTerm}
            onUseDefaults={applyDefaultTerms}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4 bg-slate-950/40">
          <button
            type="button"
            onClick={closeModal}
            disabled={isSaving}
            className="px-4 py-2.5 border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Abort Deployment
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-950/50 border border-indigo-400/20 hover:border-cyan-400/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving
              ? "Saving..."
              : isEditing
                ? "Save Configurations"
                : "Authorize Allocation"}
          </button>
        </div>
      </form>
    </div>
  );
}
