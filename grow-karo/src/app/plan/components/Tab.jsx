import React from 'react';

export function Tab({ title, data, margin }) {
    return (
        <div>
            <p className="text-xs font-medium tracking-wider" style={{ color: '#94a3b8' }}>{title}</p>
            <h3 className={`text-xl font-medium mt-${margin}`} style={{ color: '#1e293b' }}>{data}</h3>
        </div>
    );
}
