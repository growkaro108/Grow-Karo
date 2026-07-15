import React, { useEffect } from 'react';
import { XIcon } from './Icons';
import { currency } from '../utils/planUtils';

export function EnrollConfirmModal({ plan, enrolling, onConfirm, onCancel }) {
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
