import Link from "next/link";

export default function ModernHero() {
  return (
    <section className="max-h-[95vh] overflow-y-auto rounded-4xl bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.2)] sm:p-8 lg:p-10">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 text-base font-bold uppercase tracking-[0.28em] text-slate-950 shadow-sm">
            AW
          </div>
          <div>
            <p className="text-base font-semibold uppercase tracking-[0.25em] text-slate-200">Grow-Karo</p>
            <p className="text-sm text-slate-400">Secure investment platform</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
          <Link href="/dashboard" className="transition hover:text-white">Dashboard</Link>
          <Link href="#trust" className="transition hover:text-white">Trust</Link>
          <Link href="#features" className="transition hover:text-white">Solutions</Link>
          <Link href="/login" className="rounded-full border border-slate-600 px-4 py-2 transition hover:border-slate-400 hover:text-white">
            Sign In
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-5">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Investment platform</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Invest with trust, clarity, and secure performance.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Discover a refined financial dashboard that makes portfolio growth easier to understand and simpler to manage.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/login?mode=signup"
                className="inline-flex min-h-14 items-center justify-center rounded-full bg-linear-to-r from-slate-950 via-slate-800 to-slate-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(15,23,42,0.2)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.25)]"
            >
              Create Your Account
            </Link>
            <Link
              href="#insights"
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-slate-500 bg-slate-900/90 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:border-slate-400 hover:bg-slate-800"
            >
              Explore Portfolio Trends
            </Link>
          </div>
        </div>

        <div className="rounded-4xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6">
          <div className="flex items-center justify-between rounded-[28px] bg-slate-800/80 p-4 shadow-[0_18px_36px_rgba(15,23,42,0.16)]">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Portfolio value</p>
              <p className="mt-3 text-3xl font-semibold">$248,450</p>
            </div>
            <span className="rounded-full bg-slate-950 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-200">+12.4%</span>
          </div>
          <div className="mt-6 h-52 overflow-hidden rounded-[28px] bg-slate-950 p-4 sm:h-56">
            <svg viewBox="0 0 400 190" className="h-full w-full">
              <defs>
                <linearGradient id="heroLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#7dd3fc" />
                </linearGradient>
              </defs>
              <path
                d="M20 150 C80 140 140 120 180 110 C220 100 260 85 300 60 C340 35 380 25 390 20"
                fill="none"
                stroke="url(#heroLine)"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mt-6 grid gap-3 rounded-[28px] bg-slate-800/90 p-4 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Liquid Funds</span>
              <span>29%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Margin Trading</span>
              <span>18%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Gold</span>
              <span>14%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shares</span>
              <span>39%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
