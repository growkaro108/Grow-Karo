import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx"; // Import sheetjs for XLSX export
import Image from "next/image";
import TablePagination from "@/components/TablePagination";
import { TableRowLoader } from "@/loader/TableRowLoader";
import { getAllMaturityUserScheme } from "../../../../../../services/malikService";
import { resolveMediaUrl } from "@/api/apiClient";
import { storage } from "../../../../../../services/storageService";
// Mock Data Structure
const MOCK_SCHEMES = [
  {
    id: "SCH-001",
    userName: "Rajesh Kumar",
    userEmail: "rajesh@example.com",
    schemeName: "Guaranteed Growth Bond IX",
    bondNumber: "BND-883920",
    investmentAmount: 150000,
    maturityAmount: 210000,
    maturityDate: "2026-09-28",
    daysRemaining: 4,
    bondImage:
      "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?auto=format&fit=crop&q=80&w=200",
  },
];

export default function MaturingSchemesAdminDark() {
  // Config States
  const [daysThreshold, setDaysThreshold] = useState(15);
  const [schemes, setSchemes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportLimit, setExportLimit] = useState("50");
  const [loading, setLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalElement, setTotalElements] = useState(0);
  // Filter schemes based on threshold and search term
  const filteredSchemes = useMemo(() => {
    return schemes.filter((scheme) => {
      const matchesDays = scheme.daysRemaining <= daysThreshold;
      const matchesSearch =
        scheme.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scheme.schemeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scheme.bondNumber.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesDays && matchesSearch;
    });
  }, [schemes, daysThreshold, searchTerm]);

  // // Pagination Logic
  // const totalPages = Math.ceil(filteredSchemes.length / itemsPerPage);
  // const paginatedSchemes = useMemo(() => {
  //   const start = (currentPage - 1) * itemsPerPage;
  //   return filteredSchemes.slice(start, start + itemsPerPage);
  // }, [filteredSchemes, currentPage, itemsPerPage]);

  // XLSX Export Handler
  const handleExportXLSX = () => {
    let dataToExport = [...filteredSchemes];

    if (exportLimit !== "all") {
      const limit = Number.parseInt(exportLimit, 10);
      dataToExport = dataToExport.slice(0, limit);
    }

    const formattedData = dataToExport.map((item) => ({
      "Customer ID": item.cust_id,
      "User Name": item.userName,
      "User Email": item.userEmail,
      "Scheme Name": item.schemeName,
      "UserScheme ID": item.id,
      "Bond Number": item.bondNumber,
      "Investment Amount (INR)": item.investmentAmount,
      "Maturity Amount (INR)": item.maturityAmount,
      "Maturity Date": item.maturityDate,
      "Days Remaining": item.daysRemaining,
      "Enroll Date": item.enrollmentDate,
      "Account Number": item.accountNumber,
      "IFSC Code": item.ifsc,
      "Account Holder Name": item.accountHolderName,
      "Bank Name": item.bankName,

    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Maturing Schemes");
    XLSX.writeFile(
      workbook,
      `Maturing_Schemes_${daysThreshold}_Days_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };
  // First page index your API expects. Spring Data is 0-based.
  // If your pager UI is 1-based, keep FIRST_PAGE = 1 here and send `currentPage - 1` to the API.
  const FIRST_PAGE = 1;

  // Debounce the search term
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 700);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Any filter change must go back to the first page. Otherwise the server can return
  // { content: [], totalElements: 25 } for a page that no longer exists.
  useEffect(() => {
    setCurrentPage(FIRST_PAGE);
  }, [debouncedSearch, daysThreshold, itemsPerPage]);

  // Fetch data (AbortController prevents stale responses from overwriting newer ones)
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getAllMaturityUserScheme(
          debouncedSearch,
          daysThreshold,
          currentPage,
          itemsPerPage,
          { signal },
        );
        if (signal.aborted) return;

        const content = Array.isArray(res?.content) ? res.content : [];
        const total = res?.totalElements ?? 0;

        // Page is past the end: total > 0 but nothing on this page. Jump to the last real page.
        if (content.length === 0 && total > 0 && currentPage > FIRST_PAGE) {
          const lastPage = FIRST_PAGE + Math.ceil(total / itemsPerPage) - 1;
          if (lastPage !== currentPage) {
            setCurrentPage(lastPage); // this effect re-runs with the new page
            return;
          }
        }

        setSchemes(content);
        setTotalElements(total);

        // Caching must never block the UI update.
        try {
          storage.setWithTTL("maturityUserSchemes", content, 2);
        } catch (storageError) {
          console.warn("Could not cache maturity schemes:", storageError);
        }
      } catch (error) {
        if (
          signal.aborted ||
          error?.name === "AbortError" ||
          error?.name === "CanceledError"
        ) {
          return; // request was cancelled on purpose
        }
        console.error("Error fetching maturity user schemes:", error);
      } finally {
        // A cancelled request must not switch off the loader of the newer one.
        if (!signal.aborted) setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [currentPage, daysThreshold, itemsPerPage, debouncedSearch]);
  return (
    <div className="w-full max-w-7xl -m-7 mx-auto p-4 sm:p-6 lg:p-8 bg-slate-950 min-h-screen text-slate-100">
      {/* Control Bar: Search & Export Controls */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 shadow-md mb-6 flex flex-col md:flex-row gap-4 items-center justify-between backdrop-blur-sm">
        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by user, scheme, or bond #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {/* Days Threshold Config */}
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-indigo-400" />
          <label
            htmlFor="threshold"
            className="text-sm font-medium text-slate-300 whitespace-nowrap"
          >
            Maturity WithIn :
          </label>
          <div className="flex items-center gap-1">
            <input
              id="threshold"
              type="number"
              min="1"
              max="365"
              value={daysThreshold}
              onChange={(e) => {
                setDaysThreshold(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-16 px-2 py-1 text-center font-semibold bg-slate-800 border rounded-lg border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-400 font-medium">Days</span>
          </div>
        </div>
        {/* Export Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* <div className="flex items-center gap-2 border border-slate-800 rounded-lg px-3 py-1.5 bg-slate-800/50">
            <span className="text-xs font-semibold text-slate-400 uppercase">
              Export Limit:
            </span>
            <select
              value={exportLimit}
              onChange={(e) => setExportLimit(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-200 focus:outline-none cursor-pointer [&>option]:bg-slate-900"
            >
              <option value="100">100 Records</option>
              <option value="200">200 Records</option>
              <option value="300">300 Records</option>
              <option value="all">All Records</option>
            </select>
          </div> */}

          <button
            onClick={handleExportXLSX}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-150 shadow-md shadow-emerald-950/50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* --- MEDIUM & LARGE SCREENS: TABLE VIEW --- */}
      <div className="hidden md:block bg-slate-900/60 rounded-t-xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/40 border-b border-slate-800 text-xs font-semibold uppercase text-slate-400">
              <th className="py-3.5 px-4">Bond Image</th>
              <th className="py-3.5 px-4">User Details</th>
              <th className="py-3.5 px-4">Scheme & Bond ID</th>
              <th className="py-3.5 px-4">Maturity Amount</th>
              <th className="py-3.5 px-4">Maturity Date</th>
              <th className="py-3.5 px-4">Days Left</th>
              {/* <th className="py-3.5 px-4 text-right">Action</th> */}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {!loading && filteredSchemes.length > 0 ? (
              filteredSchemes.map((scheme) => (
                <tr
                  key={scheme.id}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <Image
                      src={resolveMediaUrl(scheme.bondImage)}
                      alt={scheme.schemeName}
                      className="w-14 h-10 object-cover rounded border border-slate-700 shadow-sm"
                      width={50}
                      height={50}
                      unoptimized
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-100">
                      {scheme.userName}
                    </div>
                    <div className="text-xs text-slate-400">
                      {scheme.userEmail}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-200">
                      {scheme.schemeName}
                    </div>
                    <div className="text-xs text-indigo-400 font-mono">
                      {scheme.bondNumber}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-100">
                      ₹{scheme.maturityAmount.toLocaleString("en-IN")}
                    </div>
                    <div className="text-xs text-slate-500">
                      Inv: ₹{scheme.investmentAmount.toLocaleString("en-IN")}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-medium">
                    {scheme.maturityDate}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${scheme.daysRemaining <= 3
                        ? "bg-rose-950/80 text-rose-300 border border-rose-800/50"
                        : "bg-amber-950/80 text-amber-300 border border-amber-800/50"
                        }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {scheme.daysRemaining}{" "}
                      {scheme.daysRemaining === 1 ? "Day" : "Days"}
                    </span>
                  </td>
                  {/* <td className="py-3 px-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td> */}
                </tr>
              ))
            ) : loading ? (
              <TableRowLoader
                colSpan={6}
                loading={`maturing within ${daysThreshold} days.`}
              />
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-8 text-slate-500">
                  No schemes maturing within {daysThreshold} days.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- SMALL SCREENS: CARDS VIEW --- */}
      <div className="block md:hidden space-y-4">
        {filteredSchemes.length > 0 ? (
          filteredSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 shadow-md space-y-3"
            >
              {/* Card Header */}
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <img
                  src={scheme.bondImage}
                  alt={scheme.schemeName}
                  className="w-16 h-12 object-cover rounded-md border border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-100 truncate">
                    {scheme.schemeName}
                  </h3>
                  <p className="text-xs text-indigo-400 font-mono">
                    {scheme.bondNumber}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold ${scheme.daysRemaining <= 3
                    ? "bg-rose-950 text-rose-300 border border-rose-800/40"
                    : "bg-amber-950 text-amber-300 border border-amber-800/40"
                    }`}
                >
                  {scheme.daysRemaining}d left
                </span>
              </div>

              {/* Card Body */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-500">Investor</p>
                  <p className="font-medium text-slate-200 truncate">
                    {scheme.userName}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Maturity Date</p>
                  <p className="font-medium text-slate-200">
                    {scheme.maturityDate}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Invested</p>
                  <p className="font-medium text-slate-300">
                    ₹{scheme.investmentAmount.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Payout</p>
                  <p className="font-bold text-emerald-400 text-sm">
                    ₹{scheme.maturityAmount.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Card Footer 
              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button className="w-full py-2 bg-slate-800/50 hover:bg-slate-800 text-indigo-400 font-medium text-xs rounded-lg border border-slate-700/60 flex items-center justify-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> View Details
                </button>
              </div>*/}
            </div>
          ))
        ) : (
          <div className="bg-slate-900/80 p-6 text-center text-slate-500 rounded-xl border border-slate-800">
            No schemes maturing within {daysThreshold} days.
          </div>
        )}
      </div>

      <TablePagination
        currentPage={currentPage}
        pageSize={itemsPerPage}
        totalItems={totalElement}
        onPageChange={setCurrentPage}
        onPageSizeChange={setItemsPerPage}
        darkMode={true}
      />
      {/* --- PAGINATION FOOTER --- */}
      {/* <div className="mt-6 bg-slate-900/60 p-4 rounded-xl border border-slate-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm"> */}

      {/* Info */}
      {/* <div className="text-xs text-slate-400 text-center sm:text-left">
          Showing <span className="font-semibold text-slate-200">
            {filteredSchemes.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
          </span> to <span className="font-semibold text-slate-200">
            {Math.min(currentPage * itemsPerPage, filteredSchemes.length)}
          </span> of <span className="font-semibold text-slate-200">{filteredSchemes.length}</span> entries
        </div> */}

      {/* Page Nav */}
      {/* <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 border border-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed bg-slate-800/40 hover:bg-slate-800 text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-semibold px-3 py-1.5 bg-slate-800 rounded-md text-slate-300 border border-slate-700/50">
            Page {currentPage} of {totalPages || 1}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 border border-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed bg-slate-800/40 hover:bg-slate-800 text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div> */}

      {/* </div> */}
    </div>
  );
}
