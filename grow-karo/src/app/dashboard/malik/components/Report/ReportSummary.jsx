import {
    ArrowDownRight,
    ArrowUpRight,
    Landmark,
    Layers,
    Users,
    Wallet,
} from "lucide-react";
import { currency } from "../../utils";

const ACCENTS = {
    amber: { icon: "bg-amber-400/10 text-amber-300 ring-amber-400/20", glow: "from-amber-400/20" },
    sky: { icon: "bg-sky-400/10 text-sky-300 ring-sky-400/20", glow: "from-sky-400/20" },
    violet: { icon: "bg-violet-400/10 text-violet-300 ring-violet-400/20", glow: "from-violet-400/20" },
    emerald: { icon: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20", glow: "from-emerald-400/20" },
    rose: { icon: "bg-rose-400/10 text-rose-300 ring-rose-400/20", glow: "from-rose-400/20" },
    orange: { icon: "bg-orange-400/10 text-orange-300 ring-orange-400/20", glow: "from-orange-400/20" },
};

function StatCard({ icon: Icon, label, value, accent = "amber", delta, deltaUp }) {
    const tone = ACCENTS[accent];
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-white/6 to-white/1 p-4 backdrop-blur transition hover:border-white/20 sm:p-5">
            <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-linear-to-br ${tone.glow} to-transparent blur-2xl transition group-hover:scale-125`} />
            <div className="relative flex items-center justify-between">
                <span className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ${tone.icon}`}><Icon size={17} /></span>
                {delta && (
                    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${deltaUp ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25" : "bg-rose-400/10 text-rose-300 ring-rose-400/25"
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

export default function ReportSummary({
    totals,
    schemeBreakdown = [],
}) {
    return (
        <>
            <section className="mt-6 grid gap-4 lg:grid-cols-5">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-3">
                    <StatCard icon={Users} label={totals.primaryLabel} value={totals.primaryValue.toLocaleString("en-IN")} accent="amber" />
                    <StatCard icon={Layers} label={totals.secondaryLabel} value={totals.secondaryValue.toLocaleString("en-IN")} accent="sky" />
                    <StatCard icon={Wallet} label="Total invested" value={currency(totals.totalInvested)} accent="violet" />
                    <StatCard
                        icon={Landmark}
                        label="Current principal"
                        value={currency(totals.currentPrincipal ?? 0)}
                        accent="emerald"
                    />
                </div>

                <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-white/1 p-5 backdrop-blur lg:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Top schemes by capital</p>
                    {schemeBreakdown.length > 0 ? (
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
                                        <div className="h-full rounded-full bg-linear-to-r from-[#C9A66B] to-[#F0DDB0]" style={{ width: `${row.width}%` }} />
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-600">{row.investors} enrollment{row.investors !== 1 ? "s" : ""}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-4 text-xs text-slate-500">No scheme capital for the current filters.</p>
                    )}
                </div>
            </section>
        </>
    );
}
