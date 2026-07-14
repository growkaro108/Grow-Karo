"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Search, X, Sparkles } from "lucide-react";
import { createPlan, removePlan, updatePlan } from "../../../../../services/malikService";
import { confirmMessage, errorMessage, successMessage } from "@/components/Message";
import { getAllPlans } from "@/api/generalApi";

const PAYOUT_FREQUENCIES = ["21 Days", "Monthly", "Quarterly", "Half-Yearly", "Yearly"];

const emptyPlan = {
    schemeName: "",
    schemeCategory: "",
    schemeDetails: "",
    payoutFrequency: "Monthly",
    tenure: "",
    startDate: "",
    endDate: "",
    investmentAmount: "",
    maturityValue: "",
    status: true,
    profitPercentage: "",
    maxInvestorsAllowed: "",
};

// Reused Tailwind class strings, so every field doesn't hand-repeat them
// and a single style tweak only needs to happen in one place.
const INPUT_CLS =
    "w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-950/30 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-100 outline-none transition-all placeholder-slate-600";
const READONLY_INPUT_CLS =
    "w-full bg-slate-900/60 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 outline-none cursor-not-allowed";
const LABEL_CLS = "text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block";

/* ------------------------------------------------------------------ */
/*  Maturity auto-calculation                                          */
/*  Maturity Date  = Start Date + tenure (days)                        */
/*  Maturity Value = compound interest, compounded per payout cycle    */
/*  Adjust COMPOUNDS_PER_YEAR / the formula if your product uses a     */
/*  different payout math (e.g. simple interest, flat payout, etc).    */
/* ------------------------------------------------------------------ */

const COMPOUNDS_PER_YEAR = {
    "21 Days": 365 / 21,
    Monthly: 12,
    Quarterly: 4,
    "Half-Yearly": 2,
    Yearly: 1,
};


function calcMaturityValue(amount, percent, tenureDays, frequency) {
    const principal = Number(amount);
    const rate = Number(percent);
    const days = Number(tenureDays);
    if (!principal || !rate || !days) return "";

    const n = COMPOUNDS_PER_YEAR[frequency] ?? 1;
    const years = days / 365;
    const value = principal * Math.pow(1 + rate / 100 / n, n * years);
    return value.toFixed(2);
}



function StatusBadge({ active }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase border ${active
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${active ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-rose-400"
                    }`}
            />
            {active ? "Active" : "Closed"}
        </span>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label className={LABEL_CLS}>{label}</label>
            {children}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function PlansPage() {
    // --- server state -------------------------------------------------
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    // --- UI state -------------------------------------------------
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyPlan);
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState(null);

    const loadPlans = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const response = await getAllPlans();
            // console.log(response);
            setPlans(response.data ?? []);
        } catch (err) {
            setLoadError(err.message || "Failed to load investment plans.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPlans();
    }, [loadPlans]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return plans;
        return plans.filter(
            (plan) =>
                (plan.schemeName || "").toLowerCase().includes(term) ||
                (plan.schemeId || "").toLowerCase().includes(term)
        );
    }, [plans, search]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }, []);

    // Auto-fill Maturity Date and Maturity Value whenever the inputs that
    // determine them change. These two fields are computed, never typed.
    useEffect(() => {
        setForm((prev) => {
            const maturityValue = calcMaturityValue(
                prev.investmentAmount,
                prev.profitPercentage,
                prev.tenure,
                prev.payoutFrequency
            );
            if (prev.maturityValue === maturityValue) {
                return prev;
            }
            return { ...prev, maturityValue };
        });
    }, [form.startDate, form.tenure, form.investmentAmount, form.profitPercentage, form.payoutFrequency]);

    const handleStatusChange = useCallback((e) => {
        setForm((prev) => ({ ...prev, status: e.target.value === "true" }));
    }, []);

    const openCreateModal = useCallback(() => {
        setEditingId(null);
        setForm(emptyPlan);
        setFormError(null);
        setOpen(true);
    }, []);

    const editPlan = useCallback((plan) => {
        setEditingId(plan.schemeId);
        setForm(plan);
        setFormError(null);
        setOpen(true);
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
                    "Maturity Value couldn't be calculated — check Start Date, Tenure, Investment Threshold and Profit Percentage."
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
                    response.message || (isEditing ? "Plan updated successfully.." : "Scheme Added successfully.."),
                    "success"
                );

                setPlans((prev) =>
                    isEditing
                        ? prev.map((p) => (p.schemeId === editingId ? response.data : p))
                        : [response.data, ...prev]
                );

                closeModal();
            } catch (err) {
                setFormError(err.message || "Something went wrong while saving this plan.");
            } finally {
                setIsSaving(false);
            }
        },
        [editingId, form, closeModal, createPlan, updatePlan, setPlans, successMessage, errorMessage]
    );

    const deletePlan = useCallback(async (id) => {
        let response = await confirmMessage("You want to delete this investment Plan?");
        if (!response) return;
        // Optimistic removal with rollback on failure.
        let removedPlan;
        setPlans((prev) => {
            removedPlan = prev.find((p) => p.schemeId === id);
            return prev.filter((p) => p.schemeId !== id);
        });

        try {
            const response = await removePlan(id);
            response ? successMessage("Scheme Deleted successfully..") : errorMessage("Failed to delete this plan. Please try again.");
            loadPlans();
        } catch (err) {
            if (removedPlan) setPlans((prev) => [removedPlan, ...prev]);
            errorMessage("Something went wrong..");
        }
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-200 min-h-screen bg-slate-950">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 shadow-2xl">
                <div className="relative w-full sm:w-80 group">
                    <Search size={18} className="absolute left-3.5 top-3 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                        placeholder="Search assets or plans..."
                        className="pl-11 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl w-full text-sm font-medium text-slate-100 placeholder-slate-500 focus:bg-slate-950 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-950/30 outline-none transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <button
                    onClick={openCreateModal}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-950/50 border border-indigo-400/20 hover:border-cyan-400/40 active:scale-[0.98] transition-all group"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-200" />
                    Add New Plan
                </button>
            </div>

            {/* Table */}
            <div className="overflow-hidden bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                <th className="p-4 pl-6 text-left">Investment Plan</th>
                                <th className="p-4 text-left">Capital Threshold</th>
                                <th className="p-4 text-left">Yield Ratio</th>
                                <th className="p-4 text-left">Maturity Value</th>
                                <th className="p-4 text-left">Total Investors</th>
                                <th className="p-4 text-left">Status</th>
                                <th className="p-4 text-center pr-6">Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {loadError ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-rose-400 font-medium">
                                        {loadError}{" "}
                                        <button onClick={loadPlans} className="underline hover:text-rose-300">
                                            Retry
                                        </button>
                                    </td>
                                </tr>
                            ) : isLoading ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-500 font-medium">
                                        <div className="flex items-center justify-center gap-3">
                                            <span className="w-5 h-5 border-b-2 border-cyan-500 animate-spin rounded-full"></span>
                                            <span>Loading plans...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-500 font-medium">
                                        No active asset allocations match your filter.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((plan, index) => (
                                    <tr key={index + 1} className="hover:bg-slate-800/30 transition-colors duration-150 group">
                                        <td className="p-4 pl-6">
                                            <h2 className="font-bold text-slate-100 tracking-tight group-hover:text-cyan-400 transition-colors">
                                                {plan.schemeName || "Untitled Asset"}
                                            </h2>
                                            <p className="text-[11px] font-bold text-slate-500 tracking-wide uppercase mt-0.5">{plan.tenure} days</p>
                                        </td>
                                        <td className="p-4 font-semibold text-slate-200">
                                            ₹ {Number(plan.investmentAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-4 font-bold text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.15)]">
                                            {plan.profitPercentage}%
                                            <span className="text-[10px] font-medium text-slate-500 tracking-normal block">{plan.payoutFrequency}</span>
                                        </td>
                                        <td className="p-3 font-mono text-xs font-semibold text-slate-400">₹ {plan.maturityValue || "—"}</td>

                                        <td className="p-4 font-medium text-slate-400">{plan?.joinedUsers?.length ?? 0} active</td>
                                        <td className="p-4">
                                            <StatusBadge active={plan.status === true} />
                                        </td>
                                        <td className="p-4 pr-6">
                                            <div className="flex justify-center items-center gap-2">
                                                <button onClick={() => editPlan(plan)} className="p-2 hover:bg-slate-800 text-slate-500 hover:text-cyan-400 rounded-lg transition-colors" title="Edit Parameters">
                                                    <Pencil size={16} />
                                                </button>
                                                <button onClick={() => deletePlan(plan.schemeId)} className="p-2 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded-lg transition-colors" title="Purge Record">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {open && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all duration-300">
                    <form
                        onSubmit={handleSubmit}
                        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-[0_24px_70px_rgba(0,0,0,0.5)] overflow-hidden max-h-[92vh] flex flex-col scale-100 animate-[fadeIn_0.2s_ease-out,scaleUp_0.2s_ease-out]"
                    >
                        <div className="flex justify-between items-center border-b border-slate-800/80 px-6 py-4 bg-slate-950/40">
                            <div className="flex items-center gap-2">
                                {editingId ? <Sparkles size={18} className="text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]" /> : <Plus size={18} className="text-cyan-400" />}
                                <h2 className="text-base font-bold text-slate-100">{editingId ? "Modify Asset Configuration" : "Deploy New Asset Plan"}</h2>
                            </div>
                            <button type="button" onClick={closeModal} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors">
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
                                        <input required name="schemeName" value={form.schemeName || ""} onChange={handleChange} placeholder="e.g. Sovereign Secure Treasury Capital" className={INPUT_CLS} />
                                    </Field>
                                </div>
                                <Field label="Scheme Category">
                                    <input required name="schemeCategory" value={form.schemeCategory || ""} onChange={handleChange} placeholder="e.g. Fixed Income" className={`${INPUT_CLS} uppercase tracking-wide`} />
                                </Field>
                            </div>

                            {/* Financials */}
                            <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <Field label="Investment Threshold (₹)">
                                    <input type="number" required name="investmentAmount" value={form.investmentAmount || ""} onChange={handleChange} placeholder="5000" className={INPUT_CLS} />
                                </Field>

                                <Field label="Asset Tenure (Days)">
                                    <input type="number" required name="tenure" value={form.tenure || ""} onChange={handleChange} placeholder="365" className={INPUT_CLS} />
                                </Field>
                                <Field label="Profit Percentage (%)">
                                    <input type="number" step="0.01" required name="profitPercentage" value={form.profitPercentage || ""} onChange={handleChange} placeholder="8.5" className={`${INPUT_CLS} font-bold text-emerald-400`} />
                                </Field>
                                <Field label="Maturity Value (₹)-calculated">
                                    <input type="number" readOnly name="maturityValue" value={form.maturityValue || ""} placeholder="Fill amount, %, tenure & frequency" className={READONLY_INPUT_CLS} />
                                </Field>
                            </div>

                            {/* Schedule */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                <Field label="Payout Frequency">
                                    <select name="payoutFrequency" value={form.payoutFrequency || "Monthly"} onChange={handleChange} className={INPUT_CLS}>
                                        {PAYOUT_FREQUENCIES.map((freq) => (
                                            <option key={freq} value={freq}>
                                                {freq}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Start Date">
                                    <input type="date" required name="startDate" value={form.startDate || ""} onChange={handleChange} className={`${INPUT_CLS} scheme-dark`} />
                                </Field>
                                <Field label="Plan End Date">
                                    <input type="date" required name="endDate" value={form.endDate || ""} onChange={handleChange} className={`${INPUT_CLS} scheme-dark`} />
                                </Field>
                            </div>

                            {/* Limits + status */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <Field label="Max Investors Pool Cap">
                                    <input type="number" required name="maxInvestorsAllowed" value={form.maxInvestorsAllowed || ""} onChange={handleChange} placeholder="500" className={INPUT_CLS} />
                                </Field>
                                <Field label="System Lifecycle Status">
                                    <select name="status" value={form.status === undefined ? "true" : String(form.status)} onChange={handleStatusChange} className={INPUT_CLS}>
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
                            <button type="button" onClick={closeModal} disabled={isSaving} className="px-4 py-2.5 border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                                Abort Deployment
                            </button>
                            <button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-950/50 border border-indigo-400/20 hover:border-cyan-400/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                {isSaving ? "Saving..." : editingId ? "Save Configurations" : "Authorize Allocation"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
