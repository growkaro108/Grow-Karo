export default function PortfolioSnapshot() {
  return (
    <section className="space-y-6 rounded-4xl bg-slate-950 p-6 text-white shadow-[0_24px_50px_rgba(15,23,42,0.18)] sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-300">Portfolio snapshot</p>
          <p className="text-3xl font-semibold sm:text-4xl">₹248,450</p>
          <p className="max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Total portfolio value updated in real time with confidence-building insights and secure account aggregation.</p>
        </div>
        <div className="inline-flex rounded-3xl bg-slate-900/70 px-4 py-3 text-sm uppercase tracking-[0.2em] text-slate-200 shadow-sm sm:px-5 sm:py-4">
          +12.4% growth
        </div>
      </div>

      <div className="overflow-hidden rounded-[30px] bg-slate-900/50 p-4 sm:p-5">
        <div className="h-56 w-full rounded-[28px] bg-slate-950 p-4 sm:h-64">
          <svg viewBox="0 0 400 190" className="h-full w-full">
            <defs>
              <linearGradient id="trendLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>
            <path
              d="M20 150 C80 130 130 110 180 100 C230 90 270 82 320 55 C360 34 380 28 390 25"
              fill="none"
              stroke="url(#trendLine)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx="20" cy="150" r="4" fill="#38bdf8" />
            <circle cx="180" cy="100" r="4" fill="#38bdf8" />
            <circle cx="390" cy="25" r="4" fill="#38bdf8" />
          </svg>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 text-sm text-slate-300">
        <div className="rounded-3xl bg-slate-900/65 p-4 shadow-sm">
          <p className="font-semibold text-white">Balanced exposure</p>
          <p className="mt-1">Monitor allocation across funds, gold, shares, and trading.</p>
        </div>
        <div className="rounded-3xl bg-slate-900/65 p-4 shadow-sm">
          <p className="font-semibold text-white">Data clarity</p>
          <p className="mt-1">Visual insights designed for quick decisions.</p>
        </div>
        <div className="rounded-3xl bg-slate-900/65 p-4 shadow-sm">
          <p className="font-semibold text-white">Action-ready</p>
          <p className="mt-1">Responsive analytics for every market move.</p>
        </div>
      </div>
    </section>
  );
}
