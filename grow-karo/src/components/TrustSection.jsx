import React from "react";

// Static data defined outside render cycle to avoid re-creation on re-renders
const CARDS = [
  {
    id: "bank-grade-encryption",
    title: "Bank-Grade Encryption",
    description:
      "Every transaction and account detail is encrypted end-to-end, both in transit and at rest.",
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
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    id: "regulatory-compliance",
    title: "Regulatory Compliance",
    description:
      "Fully registered and audited, with your portfolio held to the same standards as major financial institutions.",
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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: "24-7-support",
    title: "24/7 Support",
    description:
      "A real person is always one message away, day or night, whenever you have a question about your account.",
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
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    ),
  },
];

export default function TrustSection() {
  return (
    <section
      id="trust"
      aria-labelledby="trust-heading"
      className="mx-auto w-full max-w-7xl rounded-3xl bg-white p-6 sm:p-8 md:p-10 lg:p-12 shadow-sm border border-slate-100"
    >
      {/* Header */}
      <div className="mb-8 max-w-2xl space-y-2 sm:mb-10">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
          Security & Trust
        </span>
        <h2
          id="trust-heading"
          className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl"
        >
          Why Trust Us
        </h2>
      </div>

      {/* Grid Layout: 1 column on mobile, 2 on tablet, 3 on desktop */}
      <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <div
            key={card.id}
            className="group relative flex flex-col items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            {/* Icon Container with subtle hover state */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50/80 transition-colors group-hover:border-blue-200 group-hover:bg-blue-100/70">
              {card.icon}
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold tracking-tight text-slate-900">
                {card.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
