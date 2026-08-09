import React from "react";
import { ChevronDown } from "lucide-react";

export default function SelectFilter({ value, onChange, options, full }) {
  return (
    <div className={`relative ${full ? "w-full" : ""}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none rounded-lg border border-slate-800 bg-[#0F172A] py-2.5 pl-3 pr-8 text-sm font-medium text-slate-300 focus:border-teal-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 ${
          full ? "w-full" : ""
        }`}
      >
        {options.map((o) => (
          <option
            key={o.value}
            value={o.value}
            className="bg-[#0F172A] text-slate-200"
          >
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  );
}
