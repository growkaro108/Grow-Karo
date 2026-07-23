'use client'
import { Plus, Sparkles, X } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import Field from './Field'
import { createPlan, updatePlan } from '../../../../../../services/malikService'
import { errorMessage, successMessage } from '@/components/Message'

export default function FormModal({ editingId, form, formError, setForm, PAYOUT_FREQUENCIES, setEditingId, setPlans, setFormError, setOpen, emptyPlan }) {
    const [isSaving, setIsSaving] = useState(false);
    // Reused Tailwind class strings, so every field doesn't hand-repeat them
    // and a single style tweak only needs to happen in one place.
    const INPUT_CLS =
        "w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-950/30 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-100 outline-none transition-all placeholder-slate-600";
    const READONLY_INPUT_CLS =
        "w-full bg-slate-900/60 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 outline-none cursor-not-allowed";
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }, []);
    const handleStatusChange = useCallback((e) => {
        setForm((prev) => ({ ...prev, status: e.target.value === "true" }));
    }, []);
    const closeModal = useCallback(() => {
        setOpen(false);
        setEditingId(null);
        setForm(emptyPlan);
        setFormError(null);
    }, []);
    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault();

            if (!form.maturityValue) {
                setFormError(
                    "Maturity Value couldn't be calculated — check Start Date, Tenure, Investment Threshold and Profit Percentage.",
                );
                return;
            }

            setIsSaving(true);
            setFormError(null);

            try {
                const isEditing = editingId ?? false;
                const response = isEditing
                    ? await updatePlan(editingId, form)
                    : await createPlan(form);

                if (response.status !== "success") {
                    const message = response.message || "Something went wrong..";
                    errorMessage(message, "error");
                    setFormError(message);
                    return;
                }

                successMessage(
                    response.message ||
                    (isEditing
                        ? "Plan updated successfully.."
                        : "Scheme Added successfully.."),
                    "success",
                );

                setPlans((prev) =>
                    isEditing
                        ? prev.map((p) => (p.schemeId === editingId ? response.data : p))
                        : [response.data, ...prev],
                );

                closeModal();
            } catch (err) {
                setFormError(
                    err.message || "Something went wrong while saving this plan.",
                );
            } finally {
                setIsSaving(false);
            }
        },
        [
            editingId,
            form,
            closeModal,
            createPlan,
            updatePlan,
            setPlans,
            successMessage,
            errorMessage,
        ],
    );
    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all duration-300">
            <form
                onSubmit={handleSubmit}
                className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-[0_24px_70px_rgba(0,0,0,0.5)] overflow-hidden max-h-[92vh] flex flex-col scale-100 animate-[fadeIn_0.2s_ease-out,scaleUp_0.2s_ease-out]"
            >
                <div className="flex justify-between items-center border-b border-slate-800/80 px-6 py-4 bg-slate-950/40">
                    <div className="flex items-center gap-2">
                        {editingId ? (
                            <Sparkles
                                size={18}
                                className="text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]"
                            />
                        ) : (
                            <Plus size={18} className="text-cyan-400" />
                        )}
                        <h2 className="text-base font-bold text-slate-100">
                            {editingId
                                ? "Modify Asset Configuration"
                                : "Deploy New Asset Plan"}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={closeModal}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-6 flex-1 bg-slate-900 text-slate-300">
                    {formError && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium rounded-xl px-4 py-3">
                            {formError}
                        </div>
                    )}

                    {/* Identification */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="md:col-span-2">
                            <Field label="Scheme Name">
                                <input
                                    required
                                    name="schemeName"
                                    value={form.schemeName || ""}
                                    onChange={handleChange}
                                    placeholder="e.g. Sovereign Secure Treasury Capital"
                                    className={INPUT_CLS}
                                />
                            </Field>
                        </div>
                        <Field label="Scheme Category">
                            <input
                                required
                                name="schemeCategory"
                                value={form.schemeCategory || ""}
                                onChange={handleChange}
                                placeholder="e.g. Fixed Income"
                                className={`${INPUT_CLS} uppercase tracking-wide`}
                            />
                        </Field>
                    </div>

                    {/* Financials */}
                    <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <Field label="Investment Threshold (₹)">
                            <input
                                type="number"
                                required
                                name="investmentAmount"
                                value={form.investmentAmount || ""}
                                onChange={handleChange}
                                placeholder="5000"
                                className={INPUT_CLS}
                            />
                        </Field>

                        <Field label="Asset Tenure (Days)">
                            <input
                                type="number"
                                required
                                name="tenure"
                                value={form.tenure || ""}
                                onChange={handleChange}
                                placeholder="365"
                                className={INPUT_CLS}
                            />
                        </Field>
                        <Field label="Profit Percentage (%)">
                            <input
                                type="number"
                                step="0.01"
                                required
                                name="profitPercentage"
                                value={form.profitPercentage || ""}
                                onChange={handleChange}
                                placeholder="8.5"
                                className={`${INPUT_CLS} font-bold text-emerald-400`}
                            />
                        </Field>
                        <Field label="Maturity Value (₹)-calculated">
                            <input
                                type="number"
                                readOnly
                                name="maturityValue"
                                value={form.maturityValue || ""}
                                placeholder="Fill amount, %, tenure & frequency"
                                className={READONLY_INPUT_CLS}
                            />
                        </Field>
                    </div>

                    {/* Schedule */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        <Field label="Payout Frequency">
                            <select
                                name="payoutFrequency"
                                value={form.payoutFrequency || "Monthly"}
                                onChange={handleChange}
                                className={INPUT_CLS}
                            >
                                {PAYOUT_FREQUENCIES.map((freq) => (
                                    <option key={freq} value={freq}>
                                        {freq}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Start Date">
                            <input
                                type="date"
                                required
                                name="startDate"
                                value={form.startDate || ""}
                                onChange={handleChange}
                                className={`${INPUT_CLS} scheme-dark`}
                            />
                        </Field>
                        <Field label="Plan End Date">
                            <input
                                type="date"
                                required
                                name="endDate"
                                value={form.endDate || ""}
                                onChange={handleChange}
                                className={`${INPUT_CLS} scheme-dark`}
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
                        <Field label="System Lifecycle Status">
                            <select
                                name="status"
                                value={
                                    form.status === undefined ? "true" : String(form.status)
                                }
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
                            rows="3"
                            required
                            name="schemeDetails"
                            value={form.schemeDetails || ""}
                            onChange={handleChange}
                            placeholder="Provide deep structural compliance indices, background asset backing details, and allocation metrics..."
                            className={`${INPUT_CLS} resize-none`}
                        />
                    </Field>
                </div>

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
                            : editingId
                                ? "Save Configurations"
                                : "Authorize Allocation"}
                    </button>
                </div>
            </form>
        </div>
    )
}
