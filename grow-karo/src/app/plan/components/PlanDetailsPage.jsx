import React from 'react';
import { ArrowLeftIcon } from './Icons';
import { Tab } from './Tab';
import { RiskBadge, StatusBadge, EnrolledBadge } from './Badges';
import { currency, formatDate } from '../utils/planUtils';

export function PlanDetailsPage({ plan, isEnrolled, onBack, onRequestEnroll }) {
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
