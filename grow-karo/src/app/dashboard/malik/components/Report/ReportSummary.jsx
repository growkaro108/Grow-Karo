import {
    ArrowDownRight,
    ArrowUpRight,
    Layers,
    TrendingDown,
    TrendingUp,
    Users,
    Wallet,
} from "lucide-react";
import { currency } from "../../utils";
import { formatPercent } from "./reportUtils";

const ACCENTS = {
    amber: { icon: "bg-amber-400/10 text-amber-300 ring-amber-400/20", glow: "from-amber-400/20" },
    sky: { icon: "bg-sky-400/10 text-sky-300 ring-sky-400/20", glow: "from-sky-400/20" },
    violet: { icon: "bg-violet-400/10 text-violet-300 ring-violet-400/20", glow: "from-violet-400/20" },
    emerald: { icon: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20", glow: "from-emerald-400/20" },
    rose: { icon: "bg-rose-400/10 text-rose-300 ring-rose-400/20", glow: "from-rose-400/20" },
};

function StatCard({ icon: Icon, label, value, accent = "amber", delta, deltaUp }) {
    const tone = ACCENTS[accent];
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.01] p-4 backdrop-blur transition hover:border-white/20 sm:p-5">
            <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${tone.glow} to-transparent blur-2xl transition group-hover:scale-125`} />
            <div className="relative flex items-center justify-between">
                <span className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ${tone.icon}`}><Icon size={17} /></span>
                {delta && (
                    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                        deltaUp ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25" : "bg-rose-400/10 text-rose-300 ring-rose-400/25"
                    }`}>
                        {deltaUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {delta}
                    </span>
                )}
            </div>
            <p className="relative mt-4 truncate text-xl font-semibold tabular-nums tracking-tight text-white sm:text-2xl">{value}</p>
            <p className="relative mt-0.5 text-xs text-slate-500">{label}</p>
        </div>
    );
}

export default function ReportSummary({ totals, gain, gainPct, isGain, view, schemeBreakdown, Badge }) {
    const showBreakdown = view === "all" && schemeBreakdown.length > 0;
    return (
        <>
            <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <StatCard icon={Users} label={totals.primaryLabel} value={totals.primaryValue.toLocaleString("en-IN")} accent="amber" />
                <StatCard icon={Layers} label={totals.secondaryLabel} value={totals.secondaryValue.toLocaleString("en-IN")} accent="sky" />
                <StatCard icon={Wallet} label="Total invested" value={currency(totals.totalInvested)} accent="violet" />
                <StatCard
                    icon={isGain ? TrendingUp : TrendingDown}
                    label="Current value"
                    value={currency(totals.totalCurrent)}
                    accent={isGain ? "emerald" : "rose"}
                    delta={totals.totalInvested > 0 ? formatPercent(gainPct) : null}
                    deltaUp={isGain}
                />
            </section>

            <section className={`mt-4 grid gap-4 ${showBreakdown ? "lg:grid-cols-5" : ""}`}>
                <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.01] p-5 backdrop-blur ${showBreakdown ? "lg:col-span-3" : ""}`}>
                    <div className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl ${isGain ? "bg-emerald-400/15" : "bg-rose-400/15"}`} />
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Portfolio performance</p>
                            <p className={`mt-2 text-3xl font-semibold tabular-nums tracking-tight ${isGain ? "text-emerald-300" : "text-rose-300"}`}>
                                {isGain ? "+" : "−"}{currency(Math.abs(gain))}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">net {isGain ? "gain" : "loss"} on invested capital</p>
                        </div>
                        <Badge value={gainPct} large />
                    </div>

                    <div className="mt-6">
                        <div className="mb-2 flex justify-between text-xs">
                            <span className="text-slate-400">Invested</span>
                            <span className="tabular-nums text-slate-200">{currency(totals.totalInvested)}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-800/80">
                            <div className="h-full w-full rounded-full bg-gradient-to-r from-violet-400/80 to-violet-300/60" />
                        </div>
                        <div className="mb-2 mt-4 flex justify-between text-xs">
                            <span className="text-slate-400">Current value</span>
                            <span className="tabular-nums text-slate-200">{currency(totals.totalCurrent)}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-800/80">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r ${isGain ? "from-emerald-400 to-teal-300" : "from-rose-400 to-orange-300"}`}
                                style={{ width: `${Math.min(100, totals.totalInvested > 0 ? (totals.totalCurrent / totals.totalInvested) * 100 : 0)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {showBreakdown && (
                    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-5 backdrop-blur lg:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Top schemes by capital</p>
                        <ul className="mt-4 space-y-3.5">
                            {schemeBreakdown.map((row, index) => (
                                <li key={row.name}>
                                    <div className="flex items-baseline justify-between gap-3 text-xs">
                                        <span className="truncate font-medium text-slate-200">
                                            <span className="mr-2 text-slate-600">0{index + 1}</span>{row.name}
                                        </span>
                                        <span className="shrink-0 tabular-nums text-slate-400">{currency(row.invested)}</span>
                                    </div>
                                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800/80">
                                        <div className="h-full rounded-full bg-gradient-to-r from-[#C9A66B] to-[#F0DDB0]" style={{ width: `${row.width}%` }} />
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-600">{row.investors} enrollment{row.investors !== 1 ? "s" : ""}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>
        </>
    );
}
