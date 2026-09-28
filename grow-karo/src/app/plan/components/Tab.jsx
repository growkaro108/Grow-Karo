import React from "react";

const COLORS = {
  day: { title: "#94a3b8", data: "#1e293b" },
  dark: { title: "#94a3b8", data: "#f1f5f9" },
};

// mode: "day" | "dark" (default "day")
export function Tab({ title, data, margin = "0", mode = "day" }) {
  const c = COLORS[mode] || COLORS.day;

  return (
    <div>
      <p
        className="text-xs font-medium tracking-wider"
        style={{ color: c.title }}
      >
        {title}
      </p>
      <h3
        className="text-xl font-medium"
        // Tailwind can't see `mt-${margin}` built at runtime, so use an inline
        // margin (1 unit = 0.25rem, same as mt-1).
        style={{ color: c.data, marginTop: `${Number(margin) * 0.25}rem` }}
      >
        {data}
      </h3>
    </div>
  );
}