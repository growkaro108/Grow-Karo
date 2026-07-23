import React from "react";
import { FILTER_TABS } from "./constants";

export default function FilterTabs({
  statusFilter,
  setStatusFilter,
  statusCounts,
  showFilter,
}) {
  if (!showFilter) return null;

  return (
    <div
      className="sea-filter-bar"
      role="tablist"
      aria-label="Filter by status"
    >
      {FILTER_TABS.map((tab) => {
        const isActive = statusFilter === tab.key;
        const count = statusCounts[tab.key] || 0;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            className="sea-filter-btn"
            onClick={() => setStatusFilter(tab.key)}
            style={
              isActive
                ? {
                    color: tab.color,
                    background: tab.bg,
                    borderColor: tab.color,
                  }
                : undefined
            }
          >
            {tab.label}
            <span
              className="sea-filter-count"
              style={isActive ? { color: tab.color } : undefined}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
