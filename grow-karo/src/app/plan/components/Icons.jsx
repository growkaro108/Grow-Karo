import React from 'react';

export const ArrowLeftIcon = (props) => (
    <svg viewBox="0 0 24 24" width={props.size ?? 18} height={props.size ?? 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

export const CheckIcon = (props) => (
    <svg viewBox="0 0 24 24" width={props.size ?? 16} height={props.size ?? 16} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export const XIcon = (props) => (
    <svg viewBox="0 0 24 24" width={props.size ?? 18} height={props.size ?? 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export const ShieldIcon = (props) => (
    <svg viewBox="0 0 24 24" width={props.size ?? 14} height={props.size ?? 14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);
