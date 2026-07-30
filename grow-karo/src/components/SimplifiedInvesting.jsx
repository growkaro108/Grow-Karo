import React from "react";

// Static content defined outside render scope to avoid re-creation on re-renders
const STEPS = [
  {
    id: "connect-accounts",
    title: "Connect Accounts",
    description:
      "Link your bank or brokerage in a few taps — everything stays read-only and encrypted.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 stroke-current text-blue-600"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    id: "set-goals",
    title: "Set Goals",
    description:
      "Tell us what you're investing for and by when, and we'll shape a plan around it.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 stroke-current text-blue-600"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    id: "optimize-grow",
    title: "Optimize & Grow",
    description:
      "We rebalance automatically as markets move, so your portfolio stays on track.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 stroke-current text-blue-600"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function SimplifiedInvesting() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="mx-auto w-full max-w-7xl rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 md:p-10 lg:p-12 shadow-xs"
    >
      {/* Header */}
      <div className="mx-auto mb-10 max-w-2xl space-y-2 text-center sm:mb-14">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
          How It Works
        </span>
        <h2
          id="features-heading"
          className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl"
        >
          Simplified Investing
        </h2>
      </div>

      {/* Grid container with step sequence visuals */}
      <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
        {/* Desktop Connecting Line (md+ viewports) */}
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-7 hidden h-0.5 bg-gradient-to-r from-transparent via-blue-200 to-transparent md:block"
          style={{ marginInline: "16.6%" }}
        />

        {/* Mobile Vertical Connecting Line (below md viewports) */}
        <div
          aria-hidden="true"
          className="absolute bottom-10 left-1/2 top-10 w-0.5 -translate-x-1/2 bg-gradient-to-b from-blue-100 via-blue-200 to-blue-100 md:hidden"
        />

        {STEPS.map((step, idx) => (
          <div
            key={step.id}
            className="group relative flex flex-col items-center bg-white p-2 text-center transition-all duration-300 motion-reduce:transition-none"
          >
            {/* Centered Circle Badge & Number */}
            <div className="relative z-10 mb-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50/80 shadow-xs transition-transform duration-300 group-hover:scale-105 group-hover:border-blue-200 group-hover:bg-blue-100/70">
                {step.icon}
              </div>
              <span className="absolute -right-2 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white ring-2 ring-white shadow-xs">
                {idx + 1}
              </span>
            </div>

            {/* Step Text Content */}
            <h3 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
              {step.title}
            </h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
