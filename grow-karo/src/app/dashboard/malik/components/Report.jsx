"use client";

/**
 * AdminUsersDashboard.jsx
 * ---------------------------------------------------------------
 * Admin panel for an investment platform — fixed night mode.
 *
 * Two views, switched by the nav bar:
 *   · All Users   — every investor with their full portfolio,
 *                    expandable to show every scheme they hold.
 *   · Scheme       — pick a scheme from the dropdown and see only
 *                    the investors enrolled in that scheme, with
 *                    figures specific to that scheme.
 *
 * Both views export to PDF / Excel, scoped to what's on screen.
 *
 * Install once:
 *   npm install jspdf jspdf-autotable xlsx lucide-react
 *
 * Usage:
 *   import AdminUsersDashboard from "@/components/AdminUsersDashboard";
 *   export default function Page() { return <AdminUsersDashboard />; }
 *
 * Swap MOCK_USERS for your API data — the shape is documented
 * just above the constant.
 * ---------------------------------------------------------------
 */

import { useCallback, useMemo, useState } from "react";
import {
    Search,
    FileSpreadsheet,
    FileText,
    ChevronDown,
    Users,
    Wallet,
    TrendingUp,
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    X,
    Layers,
} from "lucide-react";
import { currency } from "../utils";

// ---------------------------------------------------------------
// Mock data — replace with data fetched from your API / database.
// Each user: { id, name, email, phone, joinedDate, kyc, status,
//              totalInvested, currentValue, schemes: [...] }
// Each scheme: { id, name, category, investedAmount, currentValue,
//                returns, enrolledOn, sip }
// ---------------------------------------------------------------
const MOCK_USERS = [
    {
        id: "INV-1042",
        name: "Ananya Sharma",
        email: "ananya.sharma@example.com",
        phone: "+91 98765 43210",
        joinedDate: "2023-04-12",
        kyc: "Verified",
        status: "Active",
        totalInvested: 485000,
        currentValue: 561200,
        schemes: [
            { id: "S-01", name: "Bluechip Growth Fund", category: "Equity", investedAmount: 250000, currentValue: 298500, returns: 19.4, enrolledOn: "2023-05-01", sip: true },
            { id: "S-02", name: "Steady Income Debt Fund", category: "Debt", investedAmount: 135000, currentValue: 142300, returns: 5.4, enrolledOn: "2023-06-14", sip: true },
            { id: "S-03", name: "Tax Saver ELSS", category: "ELSS", investedAmount: 100000, currentValue: 120400, returns: 20.4, enrolledOn: "2024-01-20", sip: false },
        ],
    },
    {
        id: "INV-1043",
        name: "Rohit Verma",
        email: "rohit.verma@example.com",
        phone: "+91 91234 56780",
        joinedDate: "2022-11-03",
        kyc: "Verified",
        status: "Active",
        totalInvested: 920000,
        currentValue: 1045800,
        schemes: [
            { id: "S-04", name: "Balanced Hybrid Fund", category: "Hybrid", investedAmount: 420000, currentValue: 468300, returns: 11.5, enrolledOn: "2022-12-01", sip: true },
            { id: "S-05", name: "Bluechip Growth Fund", category: "Equity", investedAmount: 500000, currentValue: 577500, returns: 15.5, enrolledOn: "2023-02-18", sip: true },
        ],
    },
    {
        id: "INV-1044",
        name: "Priya Nair",
        email: "priya.nair@example.com",
        phone: "+91 99887 65432",
        joinedDate: "2024-02-27",
        kyc: "Pending",
        status: "Active",
        totalInvested: 75000,
        currentValue: 78900,
        schemes: [
            { id: "S-06", name: "Tax Saver ELSS", category: "ELSS", investedAmount: 75000, currentValue: 78900, returns: 5.2, enrolledOn: "2024-03-02", sip: false },
        ],
    },
    {
        id: "INV-1045",
        name: "Karan Mehta",
        email: "karan.mehta@example.com",
        phone: "+91 90000 11223",
        joinedDate: "2021-07-19",
        kyc: "Verified",
        status: "Inactive",
        totalInvested: 1650000,
        currentValue: 1498200,
        schemes: [
            { id: "S-07", name: "Small Cap Opportunities", category: "Equity", investedAmount: 900000, currentValue: 792000, returns: -12.0, enrolledOn: "2021-08-05", sip: false },
            { id: "S-08", name: "Steady Income Debt Fund", category: "Debt", investedAmount: 750000, currentValue: 706200, returns: -5.8, enrolledOn: "2021-09-11", sip: true },
        ],
    },
    {
        id: "INV-1046",
        name: "Sneha Iyer",
        email: "sneha.iyer@example.com",
        phone: "+91 98123 45670",
        joinedDate: "2024-08-09",
        kyc: "Rejected",
        status: "Active",
        totalInvested: 25000,
        currentValue: 24100,
        schemes: [
            { id: "S-09", name: "Liquid Cash Fund", category: "Debt", investedAmount: 25000, currentValue: 24100, returns: -3.6, enrolledOn: "2024-08-10", sip: false },
        ],
    },
    {
        id: "INV-1047",
        name: "Vikram Rao",
        email: "vikram.rao@example.com",
        phone: "+91 97654 32109",
        joinedDate: "2023-09-15",
        kyc: "Verified",
        status: "Active",
        totalInvested: 610000,
        currentValue: 665400,
        schemes: [
            { id: "S-10", name: "Bluechip Growth Fund", category: "Equity", investedAmount: 300000, currentValue: 336000, returns: 12.0, enrolledOn: "2023-10-01", sip: true },
            { id: "S-11", name: "Balanced Hybrid Fund", category: "Hybrid", investedAmount: 310000, currentValue: 329400, returns: 6.3, enrolledOn: "2024-02-11", sip: false },
        ],
    },
];

const KYC_STYLES = {
    Verified: { icon: ShieldCheck, classes: "text-emerald-400 bg-emerald-400/10 ring-emerald-400/20" },
    Pending: { icon: ShieldAlert, classes: "text-amber-400 bg-amber-400/10 ring-amber-400/20" },
    Rejected: { icon: ShieldX, classes: "text-rose-400 bg-rose-400/10 ring-rose-400/20" },
};

const CATEGORY_DOT = {
    Equity: "bg-[#C9A66B]",
    Debt: "bg-sky-400",
    Hybrid: "bg-violet-400",
    ELSS: "bg-teal-400",
};

export default function Reports({ users = MOCK_USERS }) {
    const [view, setView] = useState("all"); // "all" | "scheme"
    const [selectedScheme, setSelectedScheme] = useState("");
    const [query, setQuery] = useState("");
    const [kycFilter, setKycFilter] = useState("All");
    const [expandedId, setExpandedId] = useState(null);
    const [exporting, setExporting] = useState(null); // "pdf" | "xlsx" | null

    // Every distinct scheme across all investors, for the dropdown.
    const schemeOptions = useMemo(() => {
        const map = new Map();
        users.forEach((u) =>
            u.schemes.forEach((s) => {
                if (!map.has(s.name)) map.set(s.name, s.category);
            })
        );
        return Array.from(map.entries()).map(([name, category]) => ({ name, category }));
    }, [users]);

    // Investors relevant to the active view, after search + KYC filter.
    const filteredUsers = useMemo(() => {
        const q = query.trim().toLowerCase();

        return users
            .filter((u) => (view === "scheme" ? u.schemes.some((s) => s.name === selectedScheme) : true))
            .filter((u) => {
                const matchesQuery =
                    !q ||
                    u.name.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q) ||
                    u.id.toLowerCase().includes(q) ||
                    u.schemes.some((s) => s.name.toLowerCase().includes(q));
                const matchesKyc = kycFilter === "All" || u.kyc === kycFilter;
                return matchesQuery && matchesKyc;
            });
    }, [users, query, kycFilter, view, selectedScheme]);

    // In scheme view, this is the one enrollment record each filtered user has.
    const schemeEntryFor = useCallback((u) => u.schemes.find((s) => s.name === selectedScheme), [selectedScheme]);

    const totals = useMemo(() => {
        if (view === "scheme" && selectedScheme) {
            const entries = filteredUsers.map((u) => schemeEntryFor(u)).filter(Boolean);
            return {
                primaryLabel: "Investors in scheme",
                primaryValue: filteredUsers.length,
                secondaryLabel: "SIPs active",
                secondaryValue: entries.filter((e) => e.sip).length,
                totalInvested: entries.reduce((sum, e) => sum + e.investedAmount, 0),
                totalCurrent: entries.reduce((sum, e) => sum + e.currentValue, 0),
            };
        }
        return {
            primaryLabel: "Investors",
            primaryValue: filteredUsers.length,
            secondaryLabel: "Active schemes",
            secondaryValue: filteredUsers.reduce((sum, u) => sum + u.schemes.length, 0),
            totalInvested: filteredUsers.reduce((sum, u) => sum + u.totalInvested, 0),
            totalCurrent: filteredUsers.reduce((sum, u) => sum + u.currentValue, 0),
        };
    }, [view, selectedScheme, filteredUsers, schemeEntryFor]);

    // ---- rows for export: scoped to whichever view is on screen ----
    const flattenRows = () => {
        if (view === "scheme" && selectedScheme) {
            return filteredUsers.map((u) => {
                const s = schemeEntryFor(u);
                return {
                    "Investor ID": u.id,
                    Name: u.name,
                    Email: u.email,
                    Phone: u.phone,
                    "KYC Status": u.kyc,
                    Scheme: s.name,
                    Category: s.category,
                    "Invested Amount": s.investedAmount,
                    "Current Value": s.currentValue,
                    "Returns (%)": s.returns,
                    "Enrolled On": s.enrolledOn,
                    SIP: s.sip ? "Active" : "No",
                };
            });
        }
        return filteredUsers.flatMap((u) =>
            u.schemes.map((s) => ({
                "Investor ID": u.id,
                Name: u.name,
                Email: u.email,
                Phone: u.phone,
                "KYC Status": u.kyc,
                "Account Status": u.status,
                "Joined On": u.joinedDate,
                Scheme: s.name,
                Category: s.category,
                "Invested Amount": s.investedAmount,
                "Current Value": s.currentValue,
                "Returns (%)": s.returns,
                "Enrolled On": s.enrolledOn,
                SIP: s.sip ? "Active" : "No",
            }))
        );
    };

    async function handleExportPDF() {
        setExporting("pdf");
        try {
            const { default: jsPDF } = await import("jspdf");
            await import("jspdf-autotable");
            const rows = flattenRows();
            const doc = new jsPDF({ orientation: "landscape" });

            const title =
                view === "scheme" && selectedScheme
                    ? `Investors Enrolled — ${selectedScheme}`
                    : "Investor & Scheme Enrollment Report";

            doc.setFontSize(14);
            doc.text(title, 14, 14);
            doc.setFontSize(9);
            doc.setTextColor(120);
            doc.text(`Generated on ${new Date().toLocaleString("en-IN")} · ${rows.length} record(s)`, 14, 20);

            doc.autoTable({
                startY: 26,
                head: [Object.keys(rows[0] ?? { "No data": "" })],
                body: rows.map((r) => Object.values(r).map((v) => (typeof v === "number" ? v.toLocaleString("en-IN") : v))),
                styles: { fontSize: 7, cellPadding: 2 },
                headStyles: { fillColor: [16, 24, 39] },
                alternateRowStyles: { fillColor: [245, 247, 250] },
            });

            doc.save(`investor-report-${Date.now()}.pdf`);
        } catch (err) {
            console.error("PDF export failed:", err);
            alert("Couldn't generate the PDF. Check the console for details.");
        } finally {
            setExporting(null);
        }
    }

    async function handleExportExcel() {
        setExporting("xlsx");
        try {
            const XLSX = await import("xlsx");
            const rows = flattenRows();
            const worksheet = XLSX.utils.json_to_sheet(rows);
            worksheet["!cols"] = Object.keys(rows[0] ?? {}).map(() => ({ wch: 18 }));
            const workbook = XLSX.utils.book_new();
            const sheetName = view === "scheme" && selectedScheme ? "Scheme Enrollments" : "Enrollments";
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            XLSX.writeFile(workbook, `investor-report-${Date.now()}.xlsx`);
        } catch (err) {
            console.error("Excel export failed:", err);
            alert("Couldn't generate the spreadsheet. Check the console for details.");
        } finally {
            setExporting(null);
        }
    }

    const exportDisabled = exporting !== null || filteredUsers.length === 0 || (view === "scheme" && !selectedScheme);

    return (
        <div className="min-h-screen bg-[#0A0D13] text-slate-200">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {/* Header */}
                {/* <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[#C9A66B]/90">Admin · Investors</p>
                        <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">Investor directory</h1>
                        <p className="mt-1 text-sm text-slate-400">
                            View every investor, their KYC status, and the schemes they've enrolled in.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleExportExcel}
                            disabled={exportDisabled}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:border-[#C9A66B]/50 hover:text-[#C9A66B] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <FileSpreadsheet size={16} />
                            {exporting === "xlsx" ? "Exporting…" : "Export Excel"}
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={exportDisabled}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#C9A66B] px-3.5 py-2 text-sm font-medium text-[#1C1506] transition hover:bg-[#D8BC82] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <FileText size={16} />
                            {exporting === "pdf" ? "Exporting…" : "Export PDF"}
                        </button>
                    </div>
                </div> */}

                {/* Nav: All Users / Scheme */}
                <div className="mt-6 flex flex-col gap-3 border-b border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-1">
                        <button
                            onClick={() => {
                                setView("all");
                                setExpandedId(null);
                            }}
                            className={`relative px-3.5 py-2.5 text-sm font-medium transition ${view === "all" ? "text-white" : "text-slate-500 hover:text-slate-300"
                                }`}
                        >
                            All Users
                            {view === "all" && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#C9A66B]" />}
                        </button>
                        <button
                            onClick={() => setView("scheme")}
                            className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition ${view === "scheme" ? "text-white" : "text-slate-500 hover:text-slate-300"
                                }`}
                        >
                            <Layers size={14} />
                            Scheme
                            {view === "scheme" && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#C9A66B]" />}
                        </button>
                    </div>

                    {view === "scheme" && (
                        <div className="pb-2.5 sm:pb-0">
                            <div className="relative">
                                <select
                                    value={selectedScheme}
                                    onChange={(e) => setSelectedScheme(e.target.value)}
                                    className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900 py-2 pl-3 pr-9 text-sm text-slate-200 outline-none transition focus:border-[#C9A66B]/60 focus:ring-1 focus:ring-[#C9A66B]/40 sm:w-64"
                                >
                                    <option value="">Select a scheme…</option>
                                    {schemeOptions.map((s) => (
                                        <option key={s.name} value={s.name}>
                                            {s.name} · {s.category}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Stat cards
                <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    <StatCard icon={Users} label={totals.primaryLabel} value={totals.primaryValue} />
                    <StatCard icon={TrendingUp} label={totals.secondaryLabel} value={totals.secondaryValue} />
                    <StatCard icon={Wallet} label="Total invested" value={currency(totals.totalInvested)} />
                    <StatCard
                        icon={Wallet}
                        label="Current value"
                        value={currency(totals.totalCurrent)}
                        trendUp={totals.totalCurrent >= totals.totalInvested}
                    />
                </div> */}

                {/* Filters */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name, email, or investor ID…"
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-9 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition focus:border-[#C9A66B]/60 focus:ring-1 focus:ring-[#C9A66B]/40"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                aria-label="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                        {["All", "Verified", "Pending", "Rejected"].map((k) => (
                            <button
                                key={k}
                                onClick={() => setKycFilter(k)}
                                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium ring-1 transition ${kycFilter === k
                                    ? "bg-[#C9A66B]/15 text-[#D8BC82] ring-[#C9A66B]/40"
                                    : "bg-slate-900 text-slate-400 ring-slate-700 hover:text-slate-200"
                                    }`}
                            >
                                {k}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Empty state: scheme view, nothing picked yet */}
                {view === "scheme" && !selectedScheme && (
                    <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-14 text-center">
                        <Layers size={22} className="text-[#C9A66B]" />
                        <p className="mt-3 text-sm font-medium text-slate-200">Pick a scheme to see who's enrolled</p>
                        <p className="mt-1 max-w-sm text-xs text-slate-500">
                            Use the dropdown above to choose a scheme — the list will show only investors holding it, with
                            figures specific to that scheme.
                        </p>
                    </div>
                )}

                {/* ---------------- ALL USERS VIEW ---------------- */}
                {view === "all" && (
                    <>
                        {/* Table — desktop / tablet */}
                        <div className="mt-5 hidden overflow-hidden rounded-xl border border-slate-800 sm:block">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-900/60 text-xs uppercase tracking-wide text-slate-400">
                                            <th className="w-8 px-4 py-3"></th>
                                            <th className="px-2 py-3 font-medium">Investor</th>
                                            <th className="px-2 py-3 font-medium">KYC</th>
                                            <th className="px-2 py-3 font-medium">Schemes</th>
                                            <th className="px-2 py-3 font-medium text-right">Invested</th>
                                            <th className="px-2 py-3 font-medium text-right">Current value</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((u) => {
                                            const isOpen = expandedId === u.id;
                                            const KycIcon = KYC_STYLES[u.kyc]?.icon ?? ShieldAlert;
                                            return (
                                                <UserRow
                                                    key={u.id}
                                                    user={u}
                                                    isOpen={isOpen}
                                                    KycIcon={KycIcon}
                                                    onToggle={() => setExpandedId(isOpen ? null : u.id)}
                                                />
                                            );
                                        })}
                                        {filteredUsers.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                                                    No investors match your search.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Card list — mobile */}
                        <div className="mt-5 flex flex-col gap-3 sm:hidden">
                            {filteredUsers.map((u) => {
                                const isOpen = expandedId === u.id;
                                const kycStyle = KYC_STYLES[u.kyc];
                                const KycIcon = kycStyle?.icon ?? ShieldAlert;
                                const gain = u.currentValue - u.totalInvested;
                                return (
                                    <div key={u.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-medium text-white">{u.name}</p>
                                                <p className="text-xs text-slate-500">{u.email}</p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1 ${kycStyle?.classes}`}>
                                                <KycIcon size={12} />
                                                {u.kyc}
                                            </span>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                            <div className="rounded-lg bg-slate-950/60 p-2">
                                                <p className="text-slate-500">Invested</p>
                                                <p className="mt-0.5 font-medium text-slate-200">{currency(u.totalInvested)}</p>
                                            </div>
                                            <div className="rounded-lg bg-slate-950/60 p-2">
                                                <p className="text-slate-500">Current value</p>
                                                <p className={`mt-0.5 font-medium ${gain >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                    {currency(u.currentValue)}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setExpandedId(isOpen ? null : u.id)}
                                            className="mt-3 flex w-full items-center justify-between rounded-lg border border-slate-800 px-3 py-2 text-xs font-medium text-slate-300"
                                        >
                                            {u.schemes.length} scheme{u.schemes.length !== 1 ? "s" : ""} enrolled
                                            <ChevronDown size={14} className={`transition ${isOpen ? "rotate-180" : ""}`} />
                                        </button>

                                        {isOpen && (
                                            <div className="mt-2 space-y-2">
                                                {u.schemes.map((s) => (
                                                    <SchemeRowMobile key={s.id} scheme={s} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <p className="py-10 text-center text-sm text-slate-500">No investors match your search.</p>
                            )}
                        </div>
                    </>
                )}

                {/* ---------------- SCHEME VIEW ---------------- */}
                {view === "scheme" && selectedScheme && (
                    <>
                        {/* Table — desktop / tablet */}
                        <div className="mt-5 hidden overflow-hidden rounded-xl border border-slate-800 sm:block">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-900/60 text-xs uppercase tracking-wide text-slate-400">
                                            <th className="px-4 py-3 font-medium">Investor</th>
                                            <th className="px-2 py-3 font-medium">KYC</th>
                                            <th className="px-2 py-3 font-medium text-right">Invested</th>
                                            <th className="px-2 py-3 font-medium text-right">Current value</th>
                                            <th className="px-2 py-3 font-medium text-right">Returns</th>
                                            <th className="px-2 py-3 font-medium">SIP</th>
                                            <th className="px-4 py-3 font-medium">Enrolled on</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((u) => {
                                            const s = schemeEntryFor(u);
                                            const kycStyle = KYC_STYLES[u.kyc];
                                            const KycIcon = kycStyle?.icon ?? ShieldAlert;
                                            return (
                                                <tr key={u.id} className="border-b border-slate-800/70 transition hover:bg-slate-900/50">
                                                    <td className="px-4 py-3.5">
                                                        <p className="font-medium text-white">{u.name}</p>
                                                        <p className="text-xs text-slate-500">{u.email}</p>
                                                    </td>
                                                    <td className="px-2 py-3.5">
                                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1 ${kycStyle?.classes}`}>
                                                            <KycIcon size={12} />
                                                            {u.kyc}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-3.5 text-right tabular-nums text-slate-300">{currency(s.investedAmount)}</td>
                                                    <td className="px-2 py-3.5 text-right tabular-nums font-medium text-slate-200">{currency(s.currentValue)}</td>
                                                    <td className={`px-2 py-3.5 text-right tabular-nums font-medium ${s.returns >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                        {s.returns >= 0 ? "+" : ""}
                                                        {s.returns}%
                                                    </td>
                                                    <td className="px-2 py-3.5 text-slate-400">{s.sip ? "Active" : "—"}</td>
                                                    <td className="px-4 py-3.5 text-slate-400">{s.enrolledOn}</td>
                                                </tr>
                                            );
                                        })}
                                        {filteredUsers.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                                                    No investors are enrolled in this scheme yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Card list — mobile */}
                        <div className="mt-5 flex flex-col gap-3 sm:hidden">
                            {filteredUsers.map((u) => {
                                const s = schemeEntryFor(u);
                                const kycStyle = KYC_STYLES[u.kyc];
                                const KycIcon = kycStyle?.icon ?? ShieldAlert;
                                return (
                                    <div key={u.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-medium text-white">{u.name}</p>
                                                <p className="text-xs text-slate-500">{u.email}</p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1 ${kycStyle?.classes}`}>
                                                <KycIcon size={12} />
                                                {u.kyc}
                                            </span>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                            <div className="rounded-lg bg-slate-950/60 p-2">
                                                <p className="text-slate-500">Invested</p>
                                                <p className="mt-0.5 font-medium text-slate-200">{currency(s.investedAmount)}</p>
                                            </div>
                                            <div className="rounded-lg bg-slate-950/60 p-2">
                                                <p className="text-slate-500">Current value</p>
                                                <p className={`mt-0.5 font-medium ${s.returns >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                    {currency(s.currentValue)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                            <span>{s.sip ? "SIP active" : "One-time"} · Enrolled {s.enrolledOn}</span>
                                            <span className={`font-medium ${s.returns >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                {s.returns >= 0 ? "+" : ""}
                                                {s.returns}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <p className="py-10 text-center text-sm text-slate-500">No investors are enrolled in this scheme yet.</p>
                            )}
                        </div>
                    </>
                )}

                <p className="mt-4 text-xs text-slate-600">
                    Showing {filteredUsers.length} of {users.length} investors
                    {view === "scheme" && selectedScheme ? ` enrolled in ${selectedScheme}` : ""} · exports match what's on
                    screen.
                </p>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, trendUp }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
                <span className="rounded-lg bg-[#C9A66B]/10 p-1.5 text-[#C9A66B]">
                    <Icon size={16} />
                </span>
                {trendUp !== undefined && (
                    <span className={`text-[11px] font-medium ${trendUp ? "text-emerald-400" : "text-rose-400"}`}>
                        {trendUp ? "▲ gain" : "▼ loss"}
                    </span>
                )}
            </div>
            <p className="mt-3 text-lg font-semibold text-white sm:text-xl">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
        </div>
    );
}

function UserRow({ user: u, isOpen, KycIcon, onToggle }) {
    const kycStyle = KYC_STYLES[u.kyc];
    return (
        <>
            <tr
                onClick={onToggle}
                className="cursor-pointer border-b border-slate-800/70 transition hover:bg-slate-900/50"
            >
                <td className="px-4 py-3.5">
                    <ChevronDown size={14} className={`text-slate-500 transition ${isOpen ? "rotate-180" : ""}`} />
                </td>
                <td className="px-2 py-3.5">
                    <p className="font-medium text-white">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                </td>
                <td className="px-2 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1 ${kycStyle?.classes}`}>
                        <KycIcon size={12} />
                        {u.kyc}
                    </span>
                </td>
                <td className="px-2 py-3.5 text-slate-300">
                    {u.schemes.length} scheme{u.schemes.length !== 1 ? "s" : ""}
                </td>
                <td className="px-2 py-3.5 text-right tabular-nums text-slate-300">{currency(u.totalInvested)}</td>
                <td
                    className={`px-2 py-3.5 text-right tabular-nums font-medium ${u.currentValue >= u.totalInvested ? "text-emerald-400" : "text-rose-400"
                        }`}
                >
                    {currency(u.currentValue)}
                </td>
                <td className="px-4 py-3.5">
                    <span
                        className={`inline-block rounded-full px-2 py-1 text-[11px] font-medium ${u.status === "Active" ? "bg-slate-700/50 text-slate-200" : "bg-slate-800 text-slate-500"
                            }`}
                    >
                        {u.status}
                    </span>
                </td>
            </tr>
            {isOpen && (
                <tr className="border-b border-slate-800/70 bg-slate-950/50">
                    <td colSpan={7} className="px-4 py-3 sm:px-10">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-slate-500">
                                    <th className="py-1.5 text-left font-medium">Scheme</th>
                                    <th className="py-1.5 text-left font-medium">Category</th>
                                    <th className="py-1.5 text-right font-medium">Invested</th>
                                    <th className="py-1.5 text-right font-medium">Current</th>
                                    <th className="py-1.5 text-right font-medium">Returns</th>
                                    <th className="py-1.5 text-left font-medium">SIP</th>
                                    <th className="py-1.5 text-left font-medium">Enrolled on</th>
                                </tr>
                            </thead>
                            <tbody>
                                {u.schemes.map((s) => (
                                    <tr key={s.id} className="border-t border-slate-800/60">
                                        <td className="py-2 text-slate-200">
                                            <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[s.category]}`} />
                                            {s.name}
                                        </td>
                                        <td className="py-2 text-slate-400">{s.category}</td>
                                        <td className="py-2 text-right tabular-nums text-slate-300">{currency(s.investedAmount)}</td>
                                        <td className="py-2 text-right tabular-nums text-slate-300">{currency(s.currentValue)}</td>
                                        <td className={`py-2 text-right tabular-nums font-medium ${s.returns >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                            {s.returns >= 0 ? "+" : ""}
                                            {s.returns}%
                                        </td>
                                        <td className="py-2 text-slate-400">{s.sip ? "Active" : "—"}</td>
                                        <td className="py-2 text-slate-400">{s.enrolledOn}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </td>
                </tr>
            )}
        </>
    );
}

function SchemeRowMobile({ scheme: s }) {
    return (
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-2.5 text-xs">
            <div className="flex items-center justify-between">
                <p className="font-medium text-slate-200">
                    <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[s.category]}`} />
                    {s.name}
                </p>
                <span className={`font-medium ${s.returns >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {s.returns >= 0 ? "+" : ""}
                    {s.returns}%
                </span>
            </div>
            <div className="mt-1.5 flex justify-between text-slate-500">
                <span>{s.category} · {s.sip ? "SIP active" : "One-time"}</span>
                <span>{currency(s.currentValue)}</span>
            </div>
        </div>
    );
}