export default function TrustSection() {
  const cards = [
    {
      title: "Secure Encryption",
      description: "Secure encryption processes and maintain secure encryption.",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )
    },
    {
      title: "Regulatory Compliance",
      description: "Regulatory or portfolio management for regulatory compliance.",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    },
    {
      title: "24/7 Support",
      description: "24/7 support assistant in record and 24/7 support.",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      )
    }
  ];

  return (
    <section id="trust" className="rounded-3xl sm:rounded-4xl bg-white p-6 sm:p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <div className="space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Why Trust Us
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.01)] transition hover:-translate-y-1 hover:shadow-md hover:border-slate-200/80 flex flex-col items-start gap-4"
          >
            {/* Icon Wrapper */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50/70 border border-blue-100/50">
              {card.icon}
            </div>
            {/* Text details */}
            <div>
              <h3 className="text-base font-bold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
