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
  {
    id: "SCH-002",
    userName: "Ananya Sharma",
    userEmail: "ananya@example.com",
    schemeName: "High Yield Corporate Bond",
    bondNumber: "BND-492011",
    investmentAmount: 500000,
    maturityAmount: 720000,
    maturityDate: "2026-10-02",
    daysRemaining: 8,
    bondImage:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "SCH-003",
    userName: "Vikram Mehta",
    userEmail: "vikram@example.com",
    schemeName: "Infrastructure Development Fund",
    bondNumber: "BND-109283",
    investmentAmount: 250000,
    maturityAmount: 340000,
    maturityDate: "2026-10-08",
    daysRemaining: 14,
    bondImage:
      "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "SCH-004",
    userName: "Priya Patel",
    userEmail: "priya@example.com",
    schemeName: "Fixed Return Sovereign Bond",
    bondNumber: "BND-771204",
    investmentAmount: 100000,
    maturityAmount: 135000,
    maturityDate: "2026-09-25",
    daysRemaining: 1,
    bondImage:
      "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "SCH-005",
    userName: "Amitav Sengupta",
    userEmail: "amitav.s@example.com",
    schemeName: "National Highways Growth Bond",
    bondNumber: "BND-302918",
    investmentAmount: 300000,
    maturityAmount: 415000,
    maturityDate: "2026-09-26",
    daysRemaining: 2,
    bondImage:
      "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "SCH-006",
    userName: "Sneha Reddy",
    userEmail: "sneha.reddy@example.com",
    schemeName: "Green Energy Sustainability Fund",
    bondNumber: "BND-554109",
    investmentAmount: 450000,
    maturityAmount: 610000,
    maturityDate: "2026-09-29",
    daysRemaining: 5,
    bondImage:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "SCH-007",
    userName: "Rohan Kapoor",
    userEmail: "rohan.k@example.com",
    schemeName: "Capital Protection Trust Bond",
    bondNumber: "BND-901234",
    investmentAmount: 200000,
    maturityAmount: 270000,
    maturityDate: "2026-09-30",
    daysRemaining: 6,
    bondImage:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "SCH-008",
    userName: "Kavita Rao",
    userEmail: "kavita.rao@example.com",
    schemeName: "Municipal Infrastructure Note",
    bondNumber: "BND-642189",
    investmentAmount: 180000,
    maturityAmount: 235000,
    maturityDate: "2026-10-01",
    daysRemaining: 7,
    bondImage:
      "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "SCH-009",
    userName: "Deepak Verma",
    userEmail: "deepak.v@example.com",
    schemeName: "Tech Ventures Convertible Bond",
    bondNumber: "BND-118239",
    investmentAmount: 600000,
    maturityAmount: 890000,
    maturityDate: "2026-10-03",
    daysRemaining: 9,
    bondImage:
      "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "SCH-010",
    userName: "Neha Joshi",
    userEmail: "neha.j@example.com",
    schemeName: "Secure Treasury Plus",
    bondNumber: "BND-830291",
    investmentAmount: 350000,
    maturityAmount: 480000,
    maturityDate: "2026-10-04",
    daysRemaining: 10,
    bondImage:
      "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "SCH-011",
    userName: "Sanjay Singhania",
    userEmail: "sanjay.s@example.com",
    schemeName: "Banking Sector Subordinated Bond",
    bondNumber: "BND-472910",
    investmentAmount: 1000000,
    maturityAmount: 1420000,
    maturityDate: "2026-10-05",
    daysRemaining: 11,
    bondImage:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "SCH-012",
    userName: "Pooja Hegde",
    userEmail: "pooja.h@example.com",
    schemeName: "Sovereign Gold Linked Bond",
    bondNumber: "BND-629104",
    investmentAmount: 400000,
    maturityAmount: 560000,
    maturityDate: "2026-10-06",
    daysRemaining: 12,
    bondImage:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "SCH-013",
    userName: "Arjun Nair",
    userEmail: "arjun.nair@example.com",
    schemeName: "Logistics Expansion Debenture",
    bondNumber: "BND-782019",
    investmentAmount: 220000,
    maturityAmount: 295000,
    maturityDate: "2026-10-07",
    daysRemaining: 13,
    bondImage:
      "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "SCH-014",
    userName: "Meera Deshmukh",
    userEmail: "meera.d@example.com",
    schemeName: "Fixed Yield Floating Rate Note",
    bondNumber: "BND-920183",
    investmentAmount: 275000,
    maturityAmount: 365000,
    maturityDate: "2026-10-09",
    daysRemaining: 15,
    bondImage:
      "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?auto=format&fit=crop&q=80&w=200",
  },
];

export default function MaturingSchemesAdminDark() {
  // Config States
  const [daysThreshold, setDaysThreshold] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportLimit, setExportLimit] = useState("100");
  const [loading, setLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Filter schemes based on threshold and search term
  const filteredSchemes = useMemo(() => {
    return MOCK_SCHEMES.filter((scheme) => {
      const matchesDays = scheme.daysRemaining <= daysThreshold;
      const matchesSearch =
        scheme.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scheme.schemeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scheme.bondNumber.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesDays && matchesSearch;
    });
  }, [daysThreshold, searchTerm]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredSchemes.length / itemsPerPage);
  const paginatedSchemes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSchemes.slice(start, start + itemsPerPage);
  }, [filteredSchemes, currentPage, itemsPerPage]);

  // XLSX Export Handler
  const handleExportXLSX = () => {
    let dataToExport = [...filteredSchemes];

    if (exportLimit !== "all") {
      const limit = NUmber.parseInt(exportLimit, 10);
      dataToExport = dataToExport.slice(0, limit);
    }

    const formattedData = dataToExport.map((item) => ({
      "Scheme ID": item.id,
      "User Name": item.userName,
      "User Email": item.userEmail,
      "Scheme Name": item.schemeName,
      "Bond Number": item.bondNumber,
      "Investment Amount (INR)": item.investmentAmount,
      "Maturity Amount (INR)": item.maturityAmount,
      "Maturity Date": item.maturityDate,
      "Days Remaining": item.daysRemaining,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Maturing Schemes");
    XLSX.writeFile(
      workbook,
      `Maturing_Schemes_${daysThreshold}_Days_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };
  //  Debounce the search term (e.g., 400ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);
  //  Fetch data safely with cleanup (AbortController to prevent race conditions)
  // useEffect(() => {
  //   let isMounted = true;
  //   const controller = new AbortController();

  //   const fetchData = async () => {
  //     try {
  //       // Pass controller signal if your API function supports Axios / fetch cancellation
  //       const res = await getAllMaturityUserScheme(
  //         debouncedSearch,
  //         daysThreshold,
  //         currentPage,
  //         itemsPerPage,
  //         { signal: controller.signal },
  //       );

  //       if (res && isMounted) {
  //         console.log(res);
  //         // setMaturityData(res.data); // Update state here
  //       }
  //     } catch (error) {
  //       if (isMounted) {
  //         console.error("Error fetching maturity user schemes:", error);
  //       }
  //     }
  //   };

  //   fetchData();

  //   return () => {
  //     isMounted = false;
  //     controller.abort(); // Cancels pending API requests if dependencies change fast
  //   };
  // }, [currentPage, daysThreshold, itemsPerPage, debouncedSearch]);
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
          <div className="flex items-center gap-2 border border-slate-800 rounded-lg px-3 py-1.5 bg-slate-800/50">
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
          </div>

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
            {!loading && paginatedSchemes.length > 0 ? (
              paginatedSchemes.map((scheme) => (
                <tr
                  key={scheme.id}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <Image
                      src={scheme.bondImage}
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
        {paginatedSchemes.length > 0 ? (
          paginatedSchemes.map((scheme) => (
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
        totalItems={filteredSchemes?.length ?? 0}
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
