export const currency = (val) => {
    const n = parseFloat(val);
    return Number.isFinite(n) ? `₹${n.toLocaleString(undefined, { minimumFractionDigits: 0 })}` : '—';
};

export const formatDate = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const riskColors = {
    Low: { bg: '#ecfdf5', text: '#059669' },
    Medium: { bg: '#fffbeb', text: '#d97706' },
    High: { bg: '#fef2f2', text: '#dc2626' },
};

export const deriveRiskLevel = (profitPercentage) => {
    const p = parseFloat(profitPercentage);
    if (!Number.isFinite(p)) return 'Medium';
    if (p >= 7) return 'High';
    if (p >= 5) return 'Medium';
    return 'Low';
};
