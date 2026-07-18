'use client';
import React, { useState, useCallback, useMemo, useEffect, use } from 'react';
import { confirmMessage, errorMessage, allRounderMessage } from '@/components/Message';
import { userContext } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { enrollInPlan, getAllUserSchemeIds } from '../../../services/grahakService';
import { getAllPlans } from '@/api/generalApi';

import { CheckIcon } from './components/Icons';
import { PlanCard } from './components/PlanCard';
import { PlanDetailsPage } from './components/PlanDetailsPage';
import { EnrollConfirmModal } from './components/EnrollConfirmModal';

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
                //console.log(response);
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
                const response = await getAllUserSchemeIds(userId);
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
        // 1. Guard clauses
        if (!confirmPlan || !authUser?.id) return;

        setEnrolling(true);
        try {
            const response = await enrollInPlan(confirmPlan.schemeId, authUser.id);

            // 2. Sanitize and normalise the response status
            const isSuccess = response?.status === 'success' || response?.status === 'ok';
            const sanitizedResponse = {
                ...response,
                status: isSuccess ? 'success' : (response?.status || 'error')
            };

            // 3. Display message
            allRounderMessage(sanitizedResponse);

            // 4. ONLY update local UI state if the backend operation was actually successful
            if (isSuccess) {
                setEnrolledSchemeIds((prev) => {
                    // Ensure we always return a flat array structure to keep useMemo simple
                    if (Array.isArray(prev)) {
                        return [...prev, confirmPlan.schemeId];
                    }
                    if (prev && typeof prev === 'object') {
                        const existingArray = Array.isArray(prev.data) ? prev.data : (Array.isArray(prev.schemeIds) ? prev.schemeIds : []);
                        return [...existingArray, confirmPlan.schemeId];
                    }
                    return [confirmPlan.schemeId];
                });

                // Close active details view only on successful enrollment
                setSelectedPlan(null);
            }

            // Always close modal when flow finishes (success or handled backend error)
            setConfirmPlan(null);

        } catch (error) {
            // This catch block handles network level drops or raw HTTP exceptions (500, 403, etc.)
            console.error('Enrollment network/server error:', error);
            errorMessage("Something went wrong during enrollment.");
        } finally {
            setEnrolling(false);
        }
        // 5. Complete and correct dependency array preventing stale closures
    }, [confirmPlan, authUser?.id, enrollInPlan, allRounderMessage, errorMessage]);
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