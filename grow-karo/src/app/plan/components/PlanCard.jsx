import React from 'react';
import { Tab } from './Tab';
import { RiskBadge, StatusBadge, EnrolledBadge } from './Badges';
import { currency } from '../utils/planUtils';

export function PlanCard({ plan, isEnrolled, onOpenDetails, onRequestEnroll }) {
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
