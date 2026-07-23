"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Trash2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
    confirmMessage,
    errorMessage,
    successMessage,
} from "@/components/Message";
import { getAllPlans } from "@/api/generalApi";
import { TableRowLoader } from "@/loader/TableRowLoader";
import dynamic from "next/dynamic";
import TabLoader from "@/loader/TabLoader";
import { removePlan } from "../../../../../../services/malikService";
import { calcMaturityValue } from "../../utils";
import { PlanStatusBadge } from "../StatusBadge";
// import { FormModal } from "./Form";
const FormModal = dynamic(() => import("./Form"), {
    loading: () => <TabLoader />,
    ssr: false,
});

const PAYOUT_FREQUENCIES = [
    "21 Days",
    "Monthly",
    "Quarterly",
    "Half-Yearly",
    "Yearly",
];

const PAGE_SIZE = 5;
const SEARCH_DEBOUNCE_MS = 400;

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

export default function PlansPage() {
    // --- server state -------------------------------------------------
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    // --- UI state -------------------------------------------------
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyPlan);
    const [formError, setFormError] = useState(null);
    const [schemeNames, setSchemeNames] = useState([]);

    // NOTE: assumes getAllPlans accepts an optional params object and that
    // your backend understands a `search` query param on it (matching
    // scheme name / scheme id server-side). Rename the key below to match
    // your actual controller if it differs.
    const loadPlans = useCallback(async (term = "") => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const response = await getAllPlans(term ? { search: term } : undefined);
            const data = response.data ?? [];
            console.log(data)
            // setPlans(data);
            // setPage(0);
            // Only refresh the autocomplete universe on unfiltered loads, so
            // suggestions always cover every scheme, not just the current
            // search's results.
            // if (!term) {
            //     setSchemeNames([
            //         ...new Set(data.map((p) => p.schemeName).filter(Boolean)),
            //     ]);
            // }
        } catch (err) {
            setLoadError(err.message || "Failed to load investment plans.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial load happens immediately; every search change after that is
    // debounced and re-queries the DB rather than filtering in-memory.
    const didMountRef = useRef(false);
    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            loadPlans();
            return;
        }
        const handle = setTimeout(() => {
            loadPlans(search.trim());
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(handle);
    }, [search, loadPlans]);

    // Client-side safety net: if the backend ignores the search param (or
    // returns more than expected), this keeps results consistent. Harmless
    // no-op when the backend already filtered correctly.
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return plans;
        return plans.filter(
            (plan) =>
                (plan.schemeName || "").toLowerCase().includes(term) ||
                (plan.schemeId || "").toLowerCase().includes(term),
        );
    }, [plans, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    // Keep page in range if data shrinks (e.g. after a delete or a search
    // that returns fewer results than the page we were on).
    useEffect(() => {
        setPage((p) => Math.min(p, totalPages - 1));
    }, [totalPages]);

    const paginated = useMemo(
        () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
        [filtered, page],
    );

    const suggestionMatches = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return [];
        return schemeNames
            .filter((name) => name.toLowerCase().includes(term))
            .slice(0, 6);
    }, [schemeNames, search]);

    const selectSuggestion = useCallback((name) => {
        setSearch(name);
        setShowSuggestions(false);
    }, []);

    // Auto-fill Maturity Date and Maturity Value whenever the inputs that
    // determine them change. These two fields are computed, never typed.
    useEffect(() => {
        setForm((prev) => {
            const maturityValue = calcMaturityValue(
                prev.investmentAmount,
                prev.profitPercentage,
                prev.tenure,
                prev.payoutFrequency,
            );
            if (prev.maturityValue === maturityValue) {
                return prev;
            }
            return { ...prev, maturityValue };
        });
    }, [
        form.startDate,
        form.tenure,
        form.investmentAmount,
        form.profitPercentage,
        form.payoutFrequency,
    ]);


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

    const deletePlan = useCallback(async (id) => {
        let response = await confirmMessage(
            "You want to delete this investment Plan?",
        );
        if (!response) return;
        // Optimistic removal with rollback on failure.
        let removedPlan;
        setPlans((prev) => {
            removedPlan = prev.find((p) => p.schemeId === id);
            return prev.filter((p) => p.schemeId !== id);
        });

        try {
            const response = await removePlan(id);
            response
                ? successMessage("Scheme Deleted successfully..")
                : errorMessage("Failed to delete this plan. Please try again.");
            loadPlans(search.trim());
        } catch (err) {
            if (removedPlan) setPlans((prev) => [removedPlan, ...prev]);
            errorMessage("Something went wrong..");
        }
    }, [loadPlans, search]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-200 min-h-screen bg-slate-950">
            {/* Action Bar */}
            <div className="relative z-30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 shadow-2xl">
                <div className="relative w-full sm:w-80 group">
                    <Search
                        size={18}
                        className="absolute left-3.5 top-3 text-slate-500 group-focus-within:text-cyan-400 transition-colors"
                    />
                    <input
                        placeholder="Search assets or plans..."
                        className="pl-11 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl w-full text-sm font-medium text-slate-100 placeholder-slate-500 focus:bg-slate-950 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-950/30 outline-none transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    />

                    {showSuggestions && suggestionMatches.length > 0 && (
                        <ul className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
                            {suggestionMatches.map((name) => (
                                <li key={name}>
                                    <button
                                        type="button"
                                        // onMouseDown (not onClick) fires before the input's
                                        // onBlur closes the dropdown.
                                        onMouseDown={() => selectSuggestion(name)}
                                        className="block w-full truncate px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-cyan-400"
                                    >
                                        {name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <button
                    onClick={openCreateModal}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-950/50 border border-indigo-400/20 hover:border-cyan-400/40 active:scale-[0.98] transition-all group"
                >
                    <Plus
                        size={18}
                        className="group-hover:rotate-90 transition-transform duration-200"
                    />
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
                                    <td
                                        colSpan={7}
                                        className="p-12 text-center text-rose-400 font-medium"
                                    >
                                        {loadError}{" "}
                                        <button
                                            onClick={() => loadPlans(search.trim())}
                                            className="underline hover:text-rose-300"
                                        >
                                            Retry
                                        </button>
                                    </td>
                                </tr>
                            ) : isLoading ? (
                                <TableRowLoader loading={"plans"} colSpan={7} />
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="p-12 text-center text-slate-500 font-medium"
                                    >
                                        No active asset allocations match your filter.
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((plan, index) => (
                                    <tr
                                        key={plan.schemeId ?? index}
                                        className="hover:bg-slate-800/30 transition-colors duration-150 group"
                                    >
                                        <td className="p-4 pl-6">
                                            <h2 className="font-bold text-slate-100 tracking-tight group-hover:text-cyan-400 transition-colors">
                                                {plan.schemeName || "Untitled Asset"}
                                            </h2>
                                            <p className="text-[11px] font-bold text-slate-500 tracking-wide uppercase mt-0.5">
                                                {plan.tenure} days
                                            </p>
                                        </td>
                                        <td className="p-4 font-semibold text-slate-200">
                                            ₹{" "}
                                            {Number(plan.investmentAmount || 0).toLocaleString(
                                                undefined,
                                                { minimumFractionDigits: 2 },
                                            )}
                                        </td>
                                        <td className="p-4 font-bold text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.15)]">
                                            {plan.profitPercentage}%
                                            <span className="text-[10px] font-medium text-slate-500 tracking-normal block">
                                                {plan.payoutFrequency}
                                            </span>
                                        </td>
                                        <td className="p-3 font-mono text-xs font-semibold text-slate-400">
                                            ₹ {plan.maturityValue || "—"}
                                        </td>

                                        <td className="p-4 font-medium text-slate-400">
                                            {plan?.joinedUsers?.length ?? 0} active
                                        </td>
                                        <td className="p-4">
                                            <PlanStatusBadge active={plan.status === true} />
                                        </td>
                                        <td className="p-4 pr-6">
                                            <div className="flex justify-center items-center gap-2">
                                                <button
                                                    onClick={() => editPlan(plan)}
                                                    className="p-2 hover:bg-slate-800 text-slate-500 hover:text-cyan-400 rounded-lg transition-colors"
                                                    title="Edit Parameters"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deletePlan(plan.schemeId)}
                                                    className="p-2 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                                                    title="Purge Record"
                                                >
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

                {/* Pagination footer */}
                {!loadError && !isLoading && filtered.length > 0 && (
                    <div className="flex items-center justify-between border-t border-slate-800/80 px-6 py-3">
                        <span className="text-xs font-medium text-slate-500">
                            Showing {page * PAGE_SIZE + 1}–
                            {Math.min(filtered.length, page * PAGE_SIZE + PAGE_SIZE)} of{" "}
                            {filtered.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 disabled:opacity-40 disabled:hover:text-slate-400"
                            >
                                <ChevronLeft size={14} /> Prev
                            </button>
                            <span className="text-xs font-medium text-slate-500">
                                Page {page + 1} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 disabled:opacity-40 disabled:hover:text-slate-400"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {/* Modal */}
            {open && (
                <FormModal editingId={editingId} form={form} formError={formError} setForm={setForm} PAYOUT_FREQUENCIES={PAYOUT_FREQUENCIES} setEditingId={setEditingId} setPlans={setPlans} setFormError={setFormError} setOpen={setOpen} emptyPlan={emptyPlan} />
            )}
        </div>
    );
}