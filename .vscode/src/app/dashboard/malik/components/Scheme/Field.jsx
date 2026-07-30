import React from "react";

export default function Field({ label, children }) {
    return (
        <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">{label}</label>
            {children}
        </div>
    );
}
