import React from "react";

export default function SettingsTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex border-b border-gray-200 mb-6 overflow-x-auto space-x-2">
      {tabs.map((tab) => (
        <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className={`py-2 px-4 font-medium text-sm capitalize border-b-2 whitespace-nowrap transition-all duration-300 ${activeTab === tab.id ? "border-indigo-600 text-indigo-600 font-semibold" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
