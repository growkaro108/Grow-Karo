import {
    ChevronDown,
    Download,
    FileSpreadsheet,
    FileText,
    Layers,
    LoaderCircle,
    RefreshCw,
    Sparkles,
    Users,
} from "lucide-react";
import { EXPORT_OPTIONS } from "./reportUtils";

export default function ReportControls({
    view,
    onViewChange,
    selectedScheme,
    onSchemeChange,
    schemeOptions,
    refreshing,
    onRefresh,
    exportScope,
    onExportScopeChange,
    exportDisabled,
    exporting,
    onExport,
}) {
    return (
        <>
            <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="inline-flex rounded-xl border border-white/10 bg-white/3 p-1 backdrop-blur">
                        {[
                            { id: "all", label: "All users", icon: Users },
                            { id: "scheme", label: "By scheme", icon: Layers },
                        ].map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => onViewChange(id)}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${view === id
                                        ? "bg-linear-to-b from-white/15 to-white/5 text-white shadow-inner ring-1 ring-white/15"
                                        : "text-slate-400 hover:text-slate-200"
                                    }`}
                            >
                                <Icon size={15} className={view === id ? "text-[#E0C58F]" : ""} />
                                {label}
                            </button>
                        ))}
                    </div>

                    {view === "scheme" && (
                        <div className="relative">
                            <Layers size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C9A66B]" />
                            <select
                                value={selectedScheme}
                                onChange={(event) => onSchemeChange(event.target.value)}
                                aria-label="Filter by scheme"
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900/80 py-2.5 pl-10 pr-10 text-sm text-slate-100 outline-none backdrop-blur transition focus:border-[#C9A66B]/60 focus:ring-2 focus:ring-[#C9A66B]/20 sm:w-72"
                            >
                                <option value="">Select a scheme…</option>
                                {schemeOptions.map((scheme) => (
                                    <option key={scheme.name} value={scheme.name}>{scheme.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={onRefresh}
                        disabled={refreshing}
                        className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3.5 py-2.5 text-sm font-medium text-slate-200 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw size={15} className={refreshing ? "animate-spin" : "transition group-hover:rotate-90"} />
                        Refresh
                    </button>
                    <div className="relative">
                        <Download size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#C9A66B]" />
                        <select
                            value={exportScope}
                            onChange={(event) => onExportScopeChange(event.target.value)}
                            aria-label="Choose how much data to export"
                            title="How much data to export"
                            className="appearance-none rounded-xl border border-white/10 bg-slate-900/80 py-2.5 pl-9 pr-9 text-sm text-slate-100 outline-none backdrop-blur transition hover:border-white/20 focus:border-[#C9A66B]/60 focus:ring-2 focus:ring-[#C9A66B]/20"
                        >
                            {EXPORT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    </div>
                    <button
                        onClick={() => onExport("xlsx")}
                        disabled={exportDisabled}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-3.5 py-2.5 text-sm font-medium text-emerald-200 backdrop-blur transition hover:border-emerald-400/40 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {exporting === "xlsx" ? <LoaderCircle size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                        {exporting === "xlsx" ? "Exporting…" : "Excel"}
                    </button>
                    {/* <button
                        onClick={() => onExport("pdf")}
                        disabled={exportDisabled}
                        className="inline-flex items-center gap-2 rounded-xl bg-linear-to-b from-[#E0C58F] to-[#C9A66B] px-4 py-2.5 text-sm font-semibold text-[#1C1506] shadow-[0_8px_24px_-8px_rgba(201,166,107,0.6)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                    >
                        {exporting === "pdf" ? <LoaderCircle size={16} className="animate-spin" /> : <FileText size={16} />}
                        {exporting === "pdf" ? "Exporting…" : "PDF"}
                    </button> */}
                </div>
            </header>


        </>
    );
}
