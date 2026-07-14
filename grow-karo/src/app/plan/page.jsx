'use client';
import React, { useState, useCallback, useMemo, useEffect, use } from 'react';
import { confirmMessage, errorMessage, successMessage, toastMessage } from '@/components/Message';
import { userContext } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { enrollInPlan, getAllUserScheme } from '../../../services/grahakService';
import { getAllPlans } from '@/api/generalApi';

// ---- Inline icons (no external icon package dependency) ----
const ArrowLeftIcon = (props) => (
    <svg viewBox="0 0 24 24" width={props.size ?? 18} height={props.size ?? 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

const CheckIcon = (props) => (
    <svg viewBox="0 0 24 24" width={props.size ?? 16} height={props.size ?? 16} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const XIcon = (props) => (
    <svg viewBox="0 0 24 24" width={props.size ?? 18} height={props.size ?? 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const ShieldIcon = (props) => (
    <svg viewBox="0 0 24 24" width={props.size ?? 14} height={props.size ?? 14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const currency = (val) => {
    const n = parseFloat(val);
    return Number.isFinite(n) ? `₹${n.toLocaleString(undefined, { minimumFractionDigits: 0 })}` : '—';
};

const formatDate = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const riskColors = {
    Low: { bg: '#ecfdf5', text: '#059669' },
    Medium: { bg: '#fffbeb', text: '#d97706' },
    High: { bg: '#fef2f2', text: '#dc2626' },
};

const deriveRiskLevel = (profitPercentage) => {
    const p = parseFloat(profitPercentage);
    if (!Number.isFinite(p)) return 'Medium';
    if (p >= 7) return 'High';
    if (p >= 5) return 'Medium';
    return 'Low';
};

function RiskBadge({ profitPercentage }) {
    const level = deriveRiskLevel(profitPercentage);
    const c = riskColors[level] ?? riskColors.Medium;
    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: c.bg, color: c.text }}
        >
            <ShieldIcon size={11} />
            {level} risk
        </span>
    );
}

function StatusBadge({ status }) {
    return status ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
            Active
        </span>
    ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
            Closed
        </span>
    );
}

function EnrolledBadge() {
    return (
        <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}
        >
            <CheckIcon size={12} />
            Enrolled
        </span>
    );
}

function PlanCard({ plan, isEnrolled, onOpenDetails, onRequestEnroll }) {
    const slotsLeft = Math.max(0, (plan.maxInvestorsAllowed ?? 0) - (plan.joinedUsers?.length ?? 0));
    const isFull = plan.maxInvestorsAllowed != null && slotsLeft <= 0;

    return (
        <div
            onClick={() => onOpenDetails(plan)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenDetails(plan)}
            tabIndex={0}
            role="button"
            aria-label={`View details for ${plan.schemeName}`}
            className="flex flex-col gap-4 p-5 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 cursor-pointer transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-300"
        >
            <div className="flex items-start justify-between gap-2">
                <Tab title={plan.schemeCategory} data={plan.schemeName} margin={"0.5"} />
                <div className="flex flex-col items-end gap-1.5">
                    <RiskBadge profitPercentage={plan.profitPercentage} />
                    <StatusBadge status={plan.status} />
                </div>
            </div>

            <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#64748b' }}>{plan.schemeDetails}</p>

            <div className="flex items-end justify-between">
                <div>
                    <p className="text-2xl font-bold" style={{ color: '#4f46e5' }}>
                        {plan.profitPercentage}<span className="text-sm font-medium">% p.a.</span>
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Min. {currency(plan.investmentAmount)}</p>
                </div>

                {isEnrolled ? (
                    <EnrolledBadge />
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRequestEnroll(plan);
                        }}
                        disabled={isFull || !plan.status}
                        className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#4f46e5' }}
                        onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4338ca')}
                        onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4f46e5')}
                    >
                        {isFull ? 'Full' : !plan.status ? 'Closed' : 'Enroll'}
                    </button>
                )}
            </div>
        </div>
    );
}

function Tab({ title, data, margin }) {
    return (
        <div>
            <p className="text-xs font-medium tracking-wider" style={{ color: '#94a3b8' }}>{title}</p>
            <h3 className={`text-xl font-medium mt-${margin}`} style={{ color: '#1e293b' }}>{data}</h3>
        </div>
    );
}

function PlanDetailsPage({ plan, isEnrolled, onBack, onRequestEnroll }) {
    const joinedCount = plan.joinedUsers?.length ?? 0;
    const slotsLeft = Math.max(0, (plan.maxInvestorsAllowed ?? 0) - joinedCount);
    const isFull = plan.maxInvestorsAllowed != null && slotsLeft <= 0;

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm font-medium mb-5 hover:underline"
                style={{ color: '#4f46e5' }}
            >
                <ArrowLeftIcon size={16} />
                Back to plans
            </button>

            <div className="flex items-start justify-between gap-4 flex-wrap">
                <Tab title={"schemeCategory"} data={plan.schemeCategory} margin={"0.5"} />
                <div className="flex items-center gap-2">
                    <RiskBadge profitPercentage={plan.profitPercentage} />
                    <StatusBadge status={plan.status} />
                </div>
            </div>

            <p className="text-sm leading-relaxed mt-4 max-w-2xl" style={{ color: '#475569' }}>{plan.schemeDetails}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mt-6 p-5 rounded-xl" style={{ backgroundColor: '#f8fafc' }}>
                <Tab title={"Profit Rate"} data={plan.profitPercentage + "% p.a."} margin={"1"} />
                <Tab title={"Investment"} data={currency(plan.investmentAmount)} margin={"1"} />
                <Tab title={"Maturity Value"} data={currency(plan.maturityValue)} margin={"1"} />
                <Tab title={"Payout"} data={plan.payoutFrequency} margin={"1"} />
                <Tab title={"Tenure"} data={plan.tenure} margin={"1"} />
                <Tab title={"Start Date"} data={formatDate(plan.startDate)} margin={"1"} />
                <Tab title={"End Date"} data={formatDate(plan.endDate)} margin={"1"} />
                <Tab title={"Investors"} data={joinedCount + " / " + (plan.maxInvestorsAllowed ?? '∞')} margin={"1"} />
            </div>

            <p className="text-xs mt-3" style={{ color: '#94a3b8' }}>
                Last updated {formatDate(plan.updatedAt)}
            </p>

            <div className="mt-7 flex items-center gap-3 justify-end">
                {isEnrolled ? (
                    <EnrolledBadge />
                ) : (
                    <button
                        onClick={() => onRequestEnroll(plan)}
                        disabled={isFull || !plan.status}
                        className="px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#4f46e5' }}
                        onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4338ca')}
                        onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4f46e5')}
                    >
                        {isFull ? 'Fully subscribed' : !plan.status ? 'Enrollment closed' : 'Enroll in this plan'}
                    </button>
                )}
            </div>
        </div>
    );
}

function EnrollConfirmModal({ plan, enrolling, onConfirm, onCancel }) {
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && !enrolling && onCancel();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onCancel, enrolling]);

    return (
        <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !enrolling && onCancel()}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>Confirm enrollment</p>
                    {!enrolling && (
                        <button
                            onClick={onCancel}
                            aria-label="Close"
                            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <XIcon size={16} />
                        </button>
                    )}
                </div>

                <div className="px-5 py-5">
                    <p className="text-sm" style={{ color: '#475569' }}>
                        You&apos;re about to enroll in
                    </p>
                    <p className="text-base font-semibold mt-1" style={{ color: '#1e293b' }}>{plan.schemeName}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm" style={{ color: '#64748b' }}>
                        <span>{plan.profitPercentage}% p.a.</span>
                        <span>·</span>
                        <span>Min. {currency(plan.investmentAmount)}</span>
                    </div>
                </div>

                <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
                    <button
                        onClick={onCancel}
                        disabled={enrolling}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={enrolling}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-70"
                        style={{ backgroundColor: '#4f46e5' }}
                    >
                        {enrolling && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                        {enrolling ? 'Enrolling…' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const EMPTY_ARRAY = [];

export default function Plans({ initialPlans = EMPTY_ARRAY }) {
    const [plans, setPlans] = useState(initialPlans);
    const [plansLoading, setPlansLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [confirmPlan, setConfirmPlan] = useState(null);
    const [enrolledSchemeIds, setEnrolledSchemeIds] = useState([]);
    const [enrolling, setEnrolling] = useState(false);
    const { authUser } = use(userContext);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        const getAllSchemes = async () => {
            try {
                const response = await getAllPlans();
                // console.log(response.data)
                if (response.status === 'success') {
                    if (isMounted) setPlans(response.data ?? []);
                } else {
                    errorMessage('Something went wrong..');
                }
            } catch (error) {
                console.error('Failed to fetch plans:', error);
                errorMessage('Something went wrong..');
            } finally {
                if (isMounted) setPlansLoading(false);
            }
        };

        const getAllEnrolledScheme = async (userId) => {
            try {
                const response = await getAllUserScheme(userId);
                // console.log(response)
                if (response.status === 'success') {
                    if (isMounted) setEnrolledSchemeIds(response.data ?? []);
                } else {
                    errorMessage('Something went wrong fetching enrolled schemes..');
                }
            } catch (error) {
                console.error('Failed to fetch enrolled schemes:', error);
                errorMessage('Something went wrong..');
            }
        };

        getAllSchemes();
        if (authUser?.id) {
            getAllEnrolledScheme(authUser.id);
        }

        return () => {
            isMounted = false;
        };
    }, [authUser?.id]);
    const enrolledSet = useMemo(() => {
        // 1. If it's already an Array, use it directly.
        if (Array.isArray(enrolledSchemeIds)) {
            return new Set(enrolledSchemeIds);
        }
        // 2. If it is a string/ID, pack it in an array.
        if (typeof enrolledSchemeIds === 'string') {
            return new Set([enrolledSchemeIds]);
        }
        // 3. If it's an object, check if it has a data/schemeIds property, or check values
        if (enrolledSchemeIds && typeof enrolledSchemeIds === 'object') {
            if (Array.isArray(enrolledSchemeIds.schemeIds)) {
                return new Set(enrolledSchemeIds.schemeIds);
            }
            if (Array.isArray(enrolledSchemeIds.data)) {
                return new Set(enrolledSchemeIds.data);
            }
        }
        // 4. Fallback to an empty Set
        return new Set();
    }, [enrolledSchemeIds]);

    const enrolledPlans = useMemo(
        () => plans.filter((p) => enrolledSet.has(p.schemeId)),
        [plans, enrolledSet]
    );

    const openDetails = useCallback((plan) => setSelectedPlan(plan), []);
    const closeDetails = useCallback(() => setSelectedPlan(null), []);

    const requestEnroll = useCallback(async (plan) => {
        if (!authUser?.id) {
            const response = await confirmMessage('Please login to enroll in a plan', "Want to Login");
            if (response) {
                router.push('/auth');
            }
            return;
        }

        setConfirmPlan(plan);
    }, [authUser?.id, router]);

    const cancelEnroll = useCallback(() => setConfirmPlan(null), []);

    const confirmEnrollment = useCallback(async () => {
        if (!confirmPlan || !authUser?.id) return;
        setEnrolling(true);
        try {
            const response = await enrollInPlan(confirmPlan.schemeId, authUser.id);
            console.log(response)
            toastMessage(response.message, response.status, response.status)
        } catch (error) {
            console.error('Enrollment error:', error);
            errorMessage("Something went wrong during enrollment.");
        } finally {
            setEnrolling(false);
            setConfirmPlan(null);
        }
    }, [confirmPlan, authUser?.id]);

    return (
        <div className="flex flex-col gap-6 p-6 bg-slate-50 min-h-screen font-sans">
            {selectedPlan ? (
                <PlanDetailsPage
                    plan={selectedPlan}
                    isEnrolled={enrolledSet.has(selectedPlan.schemeId)}
                    onBack={closeDetails}
                    onRequestEnroll={requestEnroll}
                />
            ) : (
                <>
                    {enrolledPlans.length > 0 && (
                        <div className="p-5 bg-white rounded-xl shadow-sm border border-slate-100">
                            <p className="text-sm font-semibold mb-3" style={{ color: '#1e293b' }}>Your active plans</p>
                            <div className="flex flex-wrap gap-2">
                                {enrolledPlans.map((p) => (
                                    <button
                                        key={p.schemeId}
                                        onClick={() => openDetails(p)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                                        style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}
                                    >
                                        <CheckIcon size={12} />
                                        {p.schemeName}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-lg font-semibold" style={{ color: '#1e293b' }}>Available Plans</h3>
                        <p className="text-sm mt-1 mb-5" style={{ color: '#64748b' }}>
                            Click a plan to see full details, or enroll directly from the card
                        </p>

                        {plansLoading ? (
                            <p className="text-sm" style={{ color: '#94a3b8' }}>Loading plans…</p>
                        ) : plans.length === 0 ? (
                            <p className="text-sm" style={{ color: '#94a3b8' }}>No plans available right now.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {plans.map((plan) => (
                                    <PlanCard
                                        key={plan.schemeId}
                                        plan={plan}
                                        isEnrolled={enrolledSet.has(plan.schemeId)}
                                        onOpenDetails={openDetails}
                                        onRequestEnroll={requestEnroll}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {confirmPlan && (
                <EnrollConfirmModal
                    plan={confirmPlan}
                    enrolling={enrolling}
                    onConfirm={confirmEnrollment}
                    onCancel={cancelEnroll}
                />
            )}
        </div>
    );
}