"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { TableRowLoader } from "@/loader/TableRowLoader";
import { resolveMediaUrl } from "@/api/apiClient";
import { StatusBadge } from "../../malik/components/StatusBadge";
import BondThumb from "./BondThumb";

const headers = "px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap";
const cells = "px-4 py-4 text-sm text-slate-600 whitespace-nowrap";
const PAGE_SIZE = 8;

export default function PortfolioTable({ holdings, loading, onOpenDetails, onOpenLightbox }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return holdings;
    return holdings.filter((bond) =>
      [bond.bondNumber, bond.schemeName, bond.status, bond.payoutFrequency]
        .some((value) => String(value || "").toLowerCase().includes(normalized)),
    );
  }, [holdings, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const renderRows = () => {
    if (loading) return <TableRowLoader loading="Joined Scheme.." colSpan={7} />;
    if (rows.length === 0) {
      return <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">{query ? "No holdings match your search." : "No holdings available."}</td></tr>;
    }
    return rows.map((bond) => (
      <tr key={bond.userSchemeId} onClick={() => onOpenDetails(bond)} className="cursor-pointer hover:bg-slate-50">
        <td className={cells}><BondThumb src={resolveMediaUrl(bond.bondImageURL)} alt={bond.bondNumber || "Proof"} onExpand={() => onOpenLightbox(bond)} /></td>
        <td className={`${cells} font-semibold text-slate-800`}>{bond.bondNumber || (bond.isApproved ? "Approved" : "Pending")}</td>
        <td className={cells}>{bond.schemeName}</td>
        <td className={cells}>{bond.payoutFrequency}</td>
        <td className={`${cells} text-[#397299]`}>{bond.profitPercentage}</td>
        <td className={`${cells} text-[#397299]`}>{bond.profit === 0 ? "Pending" : bond.profit}</td>
        <td className={cells}><StatusBadge status={(bond.status || "pending").toLowerCase()} /></td>
      </tr>
    ));
  };

  const changeQuery = (value) => { setQuery(value); setPage(1); };
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="text-lg font-semibold text-slate-800">Your Bond Holdings</h3><p className="text-sm mt-1 text-slate-500">Click a row for full details, or click the image to view it full-size</p></div><label className="relative w-full sm:w-64"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Search holdings" aria-label="Search holdings" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></label></div>
      <div className="mt-4 overflow-x-auto"><table className="w-full border-collapse text-left"><thead><tr className="border-b-2 border-slate-100"><th className={headers}>Bond</th><th className={headers}>Bond No.</th><th className={headers}>Scheme Name</th><th className={headers}>Payout Cycle</th><th className={headers}>Yield %</th><th className={headers}>Profit</th><th className={headers}>Status</th></tr></thead><tbody className="divide-y divide-slate-100">{renderRows()}</tbody></table></div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-xs text-slate-500">{filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}</span><div className="flex items-center gap-2"><button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => value - 1)} aria-label="Previous page" className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-40"><ChevronLeft size={16} /></button><span className="text-xs font-medium text-slate-600">Page {currentPage} of {totalPages}</span><button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => value + 1)} aria-label="Next page" className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-40"><ChevronRight size={16} /></button></div></div>
    </div>
  );
}
