"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  ChevronDown,
  X,
  Layers,
  RefreshCw,
  CircleAlert,
  Inbox,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  Phone,
  CalendarDays,
} from "lucide-react";
import { fetchAllUsersApi } from "@/api/adminApi";
import { currency } from "../../utils";
import {
  ACCOUNT_FILTERS,
  Avatar,
  EXPORT_OPTIONS,
  EmptyState,
  MAX_REPORT_USERS,
  PAGE_SIZE,
  ROWS_PER_PAGE_OPTIONS,
  ReturnBadge,
  StatusPill,
  displayStatus,
  formatPercent,
  normalizeUser,
  pageItems,
} from "./reportUtils";
import dynamic from "next/dynamic";
import UserRow from "./UserRow";
// import ReportControls from "./ReportControls";
// import ReportSummary from "./ReportSummary";

//lazy load with progressive loading
const ReportControls = dynamic(() => import("./ReportControls"), {
  loading: () =><ReportControlSkeleton />,
  ssr: false,
});
const ReportSummary = dynamic(() => import("./ReportSummary"), {
  loading: () => <ReportSummarySkeleton />,
  ssr: false,
});

const REPORT_PAGE_BATCH_SIZE = 4;

function validateReportPage(
  response,
  pageNumber,
  expectedTotal,
  expectedPages,
) {
  if (
    response?.status !== "success" ||
    !Array.isArray(response.data?.content)
  ) {
    throw new Error(
      response?.message || `Could not load report page ${pageNumber}.`,
    );
  }

  const pageTotal = Number(response.data.totalElements);
  if (!Number.isSafeInteger(pageTotal) || pageTotal < 0) {
    throw new Error(`Report page ${pageNumber} returned an invalid user count.`);
  }
  if (pageTotal !== expectedTotal) {
    throw new Error(
      `The user count changed while loading the report (${expectedTotal} to ${pageTotal}). Refresh and try again.`,
    );
  }
  const pageCount = Number(response.data.totalPages);
  if (Number.isSafeInteger(pageCount) && pageCount !== expectedPages) {
    throw new Error(
      `Report page ${pageNumber} returned inconsistent pagination metadata. Refresh and try again.`,
    );
  }
  return response.data.content;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Reports() {
  const [view, setView] = useState("all"); // "all" | "scheme"
  const [selectedScheme, setSelectedScheme] = useState("");
  const [query, setQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [exporting, setExporting] = useState(null); // "pdf" | "xlsx" | null
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [exportError, setExportError] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [exportScope, setExportScope] = useState("all");
  const requestSequence = useRef(0);
  const fetchPromiseRef = useRef(null);
  const hasLoadedRef = useRef(false);

  const fetchUsers = useCallback(async () => {
    if (fetchPromiseRef.current) return fetchPromiseRef.current;

    const fetchPromise = (async () => {
      const firstPage = await fetchAllUsersApi("", 1, PAGE_SIZE);
      if (
        firstPage?.status !== "success" ||
        !Array.isArray(firstPage.data?.content)
      ) {
        throw new Error(
          firstPage?.message || "The report data could not be loaded.",
        );
      }
      const totalElements = Number(firstPage?.data?.totalElements);
      if (!Number.isSafeInteger(totalElements) || totalElements < 0) {
        throw new Error("The report API returned an invalid user count.");
      }
      if (totalElements > MAX_REPORT_USERS) {
        throw new Error(
          `The report contains ${totalElements} users, exceeding the ${MAX_REPORT_USERS}-user limit.`,
        );
      }

      const totalPages = Math.ceil(totalElements / PAGE_SIZE);
      const records = validateReportPage(
        firstPage,
        1,
        totalElements,
        totalPages,
      );
      const expectedFirstPageRecords = Math.min(PAGE_SIZE, totalElements);
      if (records.length !== expectedFirstPageRecords) {
        throw new Error(
          `Report page 1 returned ${records.length} records; expected ${expectedFirstPageRecords}. Check the API page-size configuration and try again.`,
        );
      }

      const allRecords = [...records];
      for (
        let firstPageInBatch = 2;
        firstPageInBatch <= totalPages;
        firstPageInBatch += REPORT_PAGE_BATCH_SIZE
      ) {
        const lastPageInBatch = Math.min(
          firstPageInBatch + REPORT_PAGE_BATCH_SIZE - 1,
          totalPages,
        );
        const responses = await Promise.all(
          Array.from(
            { length: lastPageInBatch - firstPageInBatch + 1 },
            (_, index) => {
              const pageNumber = firstPageInBatch + index;
              return fetchAllUsersApi("", pageNumber, PAGE_SIZE).then(
                (response) => ({
                  pageNumber,
                  records: validateReportPage(
                    response,
                    pageNumber,
                    totalElements,
                    totalPages,
                  ),
                }),
              );
            },
          ),
        );
        responses.forEach(({ records: pageRecords, pageNumber }) => {
          const expectedPageRecords = Math.min(
            PAGE_SIZE,
            totalElements - (pageNumber - 1) * PAGE_SIZE,
          );
          if (pageRecords.length !== expectedPageRecords) {
            throw new Error(
              `Report page ${pageNumber} returned ${pageRecords.length} records; expected ${expectedPageRecords}. Refresh and try again.`,
            );
          }
          allRecords.push(...pageRecords);
        });
      }

      if (allRecords.length !== totalElements) {
        throw new Error(
          `The report API reports ${totalElements} users, but returned ${allRecords.length}. Refresh and try again.`,
        );
      }

      const userIds = new Set();
      for (const record of allRecords) {
        const userId = String(record?.userId ?? "").trim();
        if (!userId || userIds.has(userId)) {
          throw new Error(
            "The report API returned a missing or duplicate user ID. Refresh and try again.",
          );
        }
        userIds.add(userId);
      }

      return allRecords.map(normalizeUser);
    })();
    fetchPromiseRef.current = fetchPromise;
    try {
      return await fetchPromise;
    } finally {
      if (fetchPromiseRef.current === fetchPromise) {
        fetchPromiseRef.current = null;
      }
    }
  }, []);

  const loadUsers = useCallback(async () => {
    const requestId = ++requestSequence.current;
    if (!hasLoadedRef.current) setLoading(true);
    setRefreshing(true);
    setLoadError("");
    setRefreshError("");
    try {
      const reportUsers = await fetchUsers();
      if (requestId !== requestSequence.current) return;
      setUsers(reportUsers);
      hasLoadedRef.current = true;
      setHasLoaded(true);
    } catch (error) {
      console.warn("Failed to load investor report:", error);
      // if (requestId === requestSequence.current) {
      //   const message =
      //     error instanceof Error
      //       ? error.message
      //       : "Unable to load report data. Please try again.";
      //   if (hasLoadedRef.current) setRefreshError(message);
      //   else setLoadError(message);
      // }
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [fetchUsers]);

  useEffect(() => {
    const requestId = ++requestSequence.current;
    fetchUsers()
      .then((reportUsers) => {
        if (requestId !== requestSequence.current) return;
        setUsers(reportUsers);
        hasLoadedRef.current = true;
        setHasLoaded(true);
      })
      .catch((error) => {
        console.error("Failed to load investor report:", error);
        if (requestId === requestSequence.current) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load report data. Please try again.",
          );
        }
      })
      .finally(() => {
        if (requestId === requestSequence.current) setLoading(false);
      });
    return () => {
      requestSequence.current += 1;
    };
  }, [fetchUsers]);

  const changeView = (nextView) => {
    if (nextView === view) return;
    setView(nextView);
    setExpandedId(null);
    setPage(1);
  };

  const changeScheme = (nextScheme) => {
    if (nextScheme === selectedScheme) return;
    setSelectedScheme(nextScheme);
    setExpandedId(null);
    setPage(1);
  };

  const changeQuery = (nextQuery) => {
    setQuery(nextQuery);
    setPage(1);
    setExpandedId(null);
  };

  const changeAccountFilter = (nextFilter) => {
    setAccountFilter(nextFilter);
    setPage(1);
    setExpandedId(null);
  };

  const changeRowsPerPage = (nextRowsPerPage) => {
    setRowsPerPage(nextRowsPerPage);
    setPage(1);
  };

  const schemeOptions = useMemo(() => {
    const names = new Set();
    users.forEach((u) => u?.schemes.forEach((s) => names.add(s.name)));
    return Array.from(names, (name) => ({ name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();

    return users
      .filter((u) =>
        view === "scheme"
          ? u?.schemes.some((s) => s.name === selectedScheme)
          : true,
      )
      .filter((u) => {
        const matchesQuery =
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          u.schemes.some((s) => s.name.toLowerCase().includes(q));
        const matchesAccount =
          accountFilter === "All" || u.status === accountFilter;
        return matchesQuery && matchesAccount;
      });
  }, [users, query, accountFilter, view, selectedScheme]);

  const schemeEntryFor = useCallback(
    (u) => u.schemes.find((s) => s.name === selectedScheme),
    [selectedScheme],
  );

  const totals = useMemo(() => {
    if (view === "scheme" && selectedScheme) {
      const entries = filteredUsers
        .map((u) => schemeEntryFor(u))
        .filter(Boolean);
      return {
        primaryLabel: "Investors in scheme",
        primaryValue: filteredUsers.length,
        secondaryLabel: "Approved enrollments",
        secondaryValue: entries.filter((entry) => entry.status === "approved")
          .length,
        totalInvested: entries.reduce((sum, e) => sum + e.investedAmount, 0),
        totalCurrent: entries.reduce((sum, e) => sum + e.currentValue, 0),
      };
    }
    return {
      primaryLabel: "Investors",
      primaryValue: filteredUsers.length,
      secondaryLabel: "Scheme enrollments",
      secondaryValue: filteredUsers.reduce(
        (sum, u) => sum + u.schemes.length,
        0,
      ),
      totalInvested: filteredUsers.reduce((sum, u) => sum + u.totalInvested, 0),
      totalCurrent: filteredUsers.reduce((sum, u) => sum + u.currentValue, 0),
    };
  }, [view, selectedScheme, filteredUsers, schemeEntryFor]);

  const gain = totals.totalCurrent - totals.totalInvested;
  const gainPct = totals.totalInvested > 0 ? (gain / totals.totalInvested) * 100 : 0;
  const isGain = gain >= 0;

  // Capital by scheme (all-users view)
  const schemeBreakdown = useMemo(() => {
    const map = new Map();
    filteredUsers.forEach((u) =>
      u.schemes.forEach((s) => {
        const row = map.get(s.name) ?? {
          name: s.name,
          invested: 0,
          investors: 0,
        };
        row.invested += s.investedAmount;
        row.investors += 1;
        map.set(s.name, row);
      }),
    );
    const rows = Array.from(map.values())
      .sort((a, b) => b.invested - a.invested)
      .slice(0, 5);
    const max = rows[0]?.invested || 1;
    return rows.map((r) => ({
      ...r,
      width: Math.max(4, (r.invested / max) * 100),
    }));
  }, [filteredUsers]);

  /* ---- pagination ---- */
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageStartIndex = (safePage - 1) * rowsPerPage;
  const shownUsers = filteredUsers.slice(
    pageStartIndex,
    pageStartIndex + rowsPerPage,
  );

  /* ---- export scope ---- */
  const exportUsers = useMemo(() => {
    if (exportScope === "all") return filteredUsers;
    if (exportScope === "page")
      return filteredUsers.slice(pageStartIndex, pageStartIndex + rowsPerPage);
    return filteredUsers.slice(0, Number(exportScope));
  }, [exportScope, filteredUsers, pageStartIndex, rowsPerPage]);

  /* ---- export rows ---- */
  const flattenRows = () => {
    if (view === "scheme" && selectedScheme) {
      return exportUsers.map((u) => {
        const s = schemeEntryFor(u);
        return {
          "Investor ID": u.id,
          "Customer ID": u.customerId,
          "Bond Number": s.bondNumber,
          Name: u.name,
          Email: u.email,
          Phone: u.phone,
          "Account Status": u.status,
          Scheme: s.name,
          Tenure: s.tenure,
          "Profit %": formatPercent(s.profitPercentage),
          "Invested Amount": s.investedAmount,
          "Current Value": s.currentValue,
          "Enrolled On": s.enrolledOn,
          "Mature On": s.maturityDate,
          "Scheme Status": displayStatus(s.status),
          "Nominee Name": s.nomineeName,
          "Nominee Relation": s.nomineeRelation,
          "Nominee Phone": s.nomineePhone,
          "Nominee Aadhar": s.nomineeAadhar,
          "Bank Name": s.bankName,
          "Bank Account": s.bankAccount,
          "Bank IFSC": s.bankIfsc,
          "Account Holder Name": s.bankAccountHolder,
          "Update By": "Anand",
          "Verified By": "",
        };
      });
    }
    return exportUsers.flatMap((u) => {
      const schemes = u.schemes.length > 0 ? u.schemes : [null];
      return schemes.map((s) => ({
        "Investor ID": u.id,
        "Customer ID": u.customerId,
        // "Bond Number": s.bondNumber,
        Name: u.name,
        Email: u.email,
        Phone: u.phone,
        // "Account Status": u.status,
        // Scheme: s.name,
        // Tenure: s.tenure,
        // "Profit %": formatPercent(s.profitPercentage),
        // "Invested Amount": s.investedAmount,
        // "Current Value": s.currentValue,
        // "Maturity Amount": s.maturityAmount,
        // "Enrolled On": s.enrolledOn,
        // "Mature On": s.maturityDate,
        // "Scheme Status": displayStatus(s.status),
        "Nominee Name": s?.nomineeName || "",
        "Nominee Relation": s?.nomineeRelation || "",
        "Nominee Phone": s?.nomineePhone || "",
        "Nominee Aadhar": s?.nomineeAadhar || "",
        "Bank Name": u.bankName,
        "Bank Account": u.bankAccount,
        "Bank IFSC": u.bankIfsc,
        "Account Holder Name": u.bankAccountHolder,
        "Updated By": "Anand",
        "Verified By": "",
      }));
    });
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
      doc.text(
        `Generated on ${new Date().toLocaleString("en-IN")} · ${rows.length} record(s)`,
        14,
        20,
      );

      doc.autoTable({
        startY: 26,
        head: [Object.keys(rows[0] ?? { "No data": "" })],
        body: rows.map((r) =>
          Object.values(r).map((v) =>
            typeof v === "number" ? v.toLocaleString("en-IN") : v,
          ),
        ),
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [16, 24, 39] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      doc.save(`investor-report-${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      setExportError("Could not create the PDF. Please try again.");
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
      const sheetName =
        view === "scheme" && selectedScheme
          ? "Scheme Enrollments"
          : "Enrollments";
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `investor-report-${Date.now()}.xlsx`);
    } catch (err) {
      console.error("Excel export failed:", err);
      setExportError("Could not create the spreadsheet. Please try again.");
    } finally {
      setExporting(null);
    }
  }

  const exportDisabled =
    exporting !== null ||
    filteredUsers.length === 0 ||
    (view === "scheme" && !selectedScheme);
  const schemeReady = view === "scheme" && selectedScheme;

  return (
    <div className="relative isolate -m-4 min-h-full overflow-hidden bg-slate-950 text-slate-200">
      {/* ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-[#C9A66B]/10 blur-[120px]" />
        <div className="absolute -right-32 top-64 h-[360px] w-[360px] rounded-full bg-emerald-500/10 blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(ellipse at top, black 20%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at top, black 20%, transparent 70%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ReportControls
          view={view}
          onViewChange={changeView}
          selectedScheme={selectedScheme}
          onSchemeChange={changeScheme}
          schemeOptions={schemeOptions}
          refreshing={refreshing}
          onRefresh={loadUsers}
          exportScope={exportScope}
          onExportScopeChange={setExportScope}
          exportDisabled={exportDisabled}
          exporting={exporting}
          onExport={(format) => {
            setExportError("");
            if (format === "pdf") handleExportPDF();
            else handleExportExcel();
          }}
        />

        {/* ---------------- Body ---------------- */}
        {loading && !hasLoaded ? (
          <LoadingSkeleton />
        ) : loadError && !hasLoaded ? (
          <div
            role="alert"
            className="mt-8 flex flex-col items-center rounded-3xl border border-rose-400/20 bg-linear-to-b from-rose-400/[0.08] to-transparent px-6 py-14 text-center"
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-400/10 ring-1 ring-rose-400/30">
              <CircleAlert size={26} className="text-rose-300" />
            </span>
            <p className="mt-5 text-base font-semibold text-white">
              Report data is unavailable
            </p>
            <p className="mt-1.5 max-w-lg text-sm text-slate-400">
              {loadError}
            </p>
            <button
              onClick={loadUsers}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-rose-300/30 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-300/10"
            >
              <RefreshCw size={14} />
              Try again
            </button>
          </div>
        ) : (
          <>
            {exportError && (
              <p
                role="alert"
                className="mt-5 flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-200"
              >
                <CircleAlert size={15} />
                {exportError}
              </p>
            )}
            {refreshError && (
              <div
                role="alert"
                className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-200"
              >
                <span className="flex items-center gap-2">
                  <CircleAlert size={15} />
                  {refreshError}
                </span>
                <button
                  onClick={loadUsers}
                  className="font-medium underline underline-offset-2 hover:text-white"
                >
                  Retry
                </button>
              </div>
            )}
            {refreshing && hasLoaded && (
              <p
                role="status"
                className="mt-4 flex items-center gap-2 text-xs text-slate-400"
              >
                <LoaderCircle size={14} className="animate-spin" />
                Updating report data…
              </p>
            )}

            <ReportSummary
              totals={totals}
              gain={gain}
              gainPct={gainPct}
              isGain={isGain}
              view={view}
              schemeBreakdown={schemeBreakdown}
              Badge={ReturnBadge}
            />

            {/* Filters */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  value={query}
                  onChange={(e) => changeQuery(e.target.value)}
                  aria-label="Search investors and schemes"
                  placeholder="Search by name, email, phone, ID or scheme…"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 py-2.5 pl-10 pr-10 text-sm text-slate-100 outline-none backdrop-blur transition placeholder:text-slate-500 focus:border-[#C9A66B]/60 focus:ring-2 focus:ring-[#C9A66B]/20"
                />
                {query && (
                  <button
                    onClick={() => changeQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
                {ACCOUNT_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => changeAccountFilter(filter)}
                    className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                      accountFilter === filter
                        ? "bg-[#C9A66B]/15 text-[#E8D0A0] ring-1 ring-[#C9A66B]/40"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Scheme view, nothing picked */}
            {view === "scheme" && !selectedScheme && (
              <EmptyState
                icon={Layers}
                title="Pick a scheme to see who's enrolled"
                text="Use the selector above to choose a scheme. The list will show only investors holding it, with figures specific to that scheme."
                dashed
              />
            )}

            {/* ---------------- ALL USERS ---------------- */}
            {view === "all" && (
              <>
                <div className="mt-5 hidden overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur sm:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] uppercase tracking-wider text-slate-500">
                          <th className="w-10 px-4 py-3.5"></th>
                          <th className="px-2 py-3.5 font-medium">Investor</th>
                          <th className="px-2 py-3.5 font-medium">Account</th>
                          <th className="px-2 py-3.5 font-medium">Schemes</th>
                          <th className="px-2 py-3.5 text-right font-medium">
                            Invested
                          </th>
                          <th className="px-2 py-3.5 text-right font-medium">
                            Current value
                          </th>
                          <th className="px-2 py-3.5 text-right font-medium">
                            Returns
                          </th>
                          <th className="px-4 py-3.5 font-medium">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shownUsers.map((u, index) => {
                          const isOpen = expandedId === u.id;
                          return (
                            <UserRow
                              key={u.id || index + 1}
                              user={u}
                              isOpen={isOpen}
                              onToggle={() =>
                                setExpandedId(isOpen ? null : u.id)
                              }
                            />
                          );
                        })}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={8}>
                              <EmptyState
                                icon={Inbox}
                                title="No investors match"
                                text="Try a different search term or account filter."
                                bare
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* mobile cards */}
                <div className="mt-5 flex flex-col gap-3 sm:hidden">
                  {shownUsers.map((u, index) => {
                    const isOpen = expandedId === u.id;
                    const g = u.currentValue - u.totalInvested;
                    const pct =
                      u.totalInvested > 0 ? (g / u.totalInvested) * 100 : 0;
                    return (
                      <div
                        key={u.id || index + 1}
                        className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar name={u.name} seed={u.id} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-white">
                              {u.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {u.email}
                            </p>
                          </div>
                          <StatusPill status={u.status} />
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-xl bg-slate-950/60 p-2.5 ring-1 ring-white/5">
                            <p className="text-slate-500">Invested</p>
                            <p className="mt-0.5 font-medium text-slate-200">
                              {currency(u.totalInvested)}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-950/60 p-2.5 ring-1 ring-white/5">
                            <p className="text-slate-500">Current value</p>
                            <p
                              className={`mt-0.5 font-medium ${g >= 0 ? "text-emerald-300" : "text-rose-300"}`}
                            >
                              {currency(u.currentValue)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <ReturnBadge value={pct} />
                          <span className="text-[11px] text-slate-500">
                            {u.joinedDate ? `Joined ${u.joinedDate}` : ""}
                          </span>
                        </div>

                        <button
                          onClick={() => setExpandedId(isOpen ? null : u.id)}
                          className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/5"
                        >
                          {u.schemes.length} scheme
                          {u.schemes.length !== 1 ? "s" : ""} enrolled
                          <ChevronDown
                            size={14}
                            className={`transition ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        {isOpen && (
                          <div className="mt-2 space-y-2">
                            {u.schemes.map((s) => (
                              <SchemeCardMobile key={s.id} scheme={s} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <EmptyState
                      icon={Inbox}
                      title="No investors match"
                      text="Try a different search term or account filter."
                      bare
                    />
                  )}
                </div>
              </>
            )}

            {/* ---------------- SCHEME VIEW ---------------- */}
            {schemeReady && (
              <>
                <div className="mt-5 hidden overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur sm:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] uppercase tracking-wider text-slate-500">
                          <th className="px-5 py-3.5 font-medium">Investor</th>
                          <th className="px-2 py-3.5 font-medium">Account</th>
                          <th className="px-2 py-3.5 text-right font-medium">
                            Invested
                          </th>
                          <th className="px-2 py-3.5 text-right font-medium">
                            Current value
                          </th>
                          <th className="px-2 py-3.5 text-right font-medium">
                            Returns
                          </th>
                          <th className="px-4 py-3.5 font-medium">
                            Scheme status
                          </th>
                          <th className="px-4 py-3.5 font-medium">
                            Enrolled on
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {shownUsers.map((u) => {
                          const s = schemeEntryFor(u);
                          return (
                            <tr
                              key={u.id}
                              className="border-b border-white/5 transition hover:bg-white/4"
                            >
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <Avatar name={u.name} seed={u.id} />
                                  <div className="min-w-0">
                                    <p className="truncate font-medium text-white">
                                      {u.name}
                                    </p>
                                    <p className="truncate text-xs text-slate-500">
                                      {u.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-2 py-3.5">
                                <StatusPill status={u.status} />
                              </td>
                              <td className="px-2 py-3.5 text-right tabular-nums text-slate-300">
                                {currency(s.investedAmount)}
                              </td>
                              <td className="px-2 py-3.5 text-right font-medium tabular-nums text-slate-100">
                                {currency(s.currentValue)}
                              </td>
                              <td className="px-2 py-3.5 text-right">
                                <ReturnBadge value={s.returns} />
                              </td>
                              <td className="px-4 py-3.5">
                                <StatusPill
                                  status={s.status}
                                  label={displayStatus(s.status)}
                                />
                              </td>
                              <td className="px-4 py-3.5 text-slate-400">
                                {s.enrolledOn || "—"}
                              </td>
                            </tr>
                          );
                        })}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={7}>
                              <EmptyState
                                icon={Inbox}
                                title="No investors found"
                                text="No investors are enrolled in this scheme for the current filters."
                                bare
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:hidden">
                  {shownUsers.map((u) => {
                    const s = schemeEntryFor(u);
                    return (
                      <div
                        key={u.id}
                        className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar name={u.name} seed={u.id} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-white">
                              {u.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {u.email}
                            </p>
                          </div>
                          <StatusPill status={u.status} />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-xl bg-slate-950/60 p-2.5 ring-1 ring-white/5">
                            <p className="text-slate-500">Invested</p>
                            <p className="mt-0.5 font-medium text-slate-200">
                              {currency(s.investedAmount)}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-950/60 p-2.5 ring-1 ring-white/5">
                            <p className="text-slate-500">Current value</p>
                            <p
                              className={`mt-0.5 font-medium ${s.returns >= 0 ? "text-emerald-300" : "text-rose-300"}`}
                            >
                              {currency(s.currentValue)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <StatusPill
                              status={s.status}
                              label={displayStatus(s.status)}
                            />
                            {s.enrolledOn || "Date unavailable"}
                          </span>
                          <ReturnBadge value={s.returns} />
                        </div>
                      </div>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <EmptyState
                      icon={Inbox}
                      title="No investors found"
                      text="No investors are enrolled in this scheme for the current filters."
                      bare
                    />
                  )}
                </div>
              </>
            )}

            {/* Load more + footer */}
            {(view === "all" || schemeReady) && (
              <div className="mt-5 flex flex-col items-center gap-3">
                {filteredUsers.length > 0 && (
                  <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur sm:flex-row sm:justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <label
                        htmlFor="rows-per-page"
                        className="whitespace-nowrap"
                      >
                        Rows per page
                      </label>
                      <div className="relative">
                        <select
                          id="rows-per-page"
                          value={rowsPerPage}
                          onChange={(e) =>
                            changeRowsPerPage(Number(e.target.value))
                          }
                          className="appearance-none rounded-lg border border-white/10 bg-slate-900/80 py-1.5 pl-3 pr-8 text-xs text-slate-100 outline-none transition focus:border-[#C9A66B]/60 focus:ring-2 focus:ring-[#C9A66B]/20"
                        >
                          {ROWS_PER_PAGE_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={12}
                          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                      </div>
                      <span className="hidden tabular-nums sm:inline">
                        {pageStartIndex + 1}–
                        {Math.min(
                          pageStartIndex + rowsPerPage,
                          filteredUsers.length,
                        )}{" "}
                        of {filteredUsers.length}
                      </span>
                    </div>

                    <nav
                      aria-label="Pagination"
                      className="flex items-center gap-1"
                    >
                      <button
                        onClick={() => setPage(safePage - 1)}
                        disabled={safePage <= 1}
                        aria-label="Previous page"
                        className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:border-[#C9A66B]/40 hover:text-[#E8D0A0] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/10 disabled:hover:text-slate-300"
                      >
                        <ChevronLeft size={15} />
                      </button>
                      {pageItems(safePage, totalPages).map((item, i) =>
                        item === "…" ? (
                          <span
                            key={`gap-${i}`}
                            className="px-1.5 text-xs text-slate-600"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => setPage(item)}
                            aria-current={
                              item === safePage ? "page" : undefined
                            }
                            className={`h-8 min-w-8 rounded-lg px-2 text-xs font-medium tabular-nums transition ${
                              item === safePage
                                ? "bg-gradient-to-b from-[#E0C58F] to-[#C9A66B] text-[#1C1506] shadow-[0_6px_18px_-6px_rgba(201,166,107,0.6)]"
                                : "border border-white/10 text-slate-300 hover:border-white/25 hover:bg-white/5"
                            }`}
                          >
                            {item}
                          </button>
                        ),
                      )}
                      <button
                        onClick={() => setPage(safePage + 1)}
                        disabled={safePage >= totalPages}
                        aria-label="Next page"
                        className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:border-[#C9A66B]/40 hover:text-[#E8D0A0] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/10 disabled:hover:text-slate-300"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </nav>
                  </div>
                )}
                <p className="text-center text-xs text-slate-600">
                  {filteredUsers.length} matching of {users.length} investors
                  {schemeReady ? ` · enrolled in ${selectedScheme}` : ""} ·
                  export will include{" "}
                  <span className="text-slate-400">
                    {exportUsers.length} investor
                    {exportUsers.length !== 1 ? "s" : ""} (
                    {EXPORT_OPTIONS.find(
                      (o) => o.value === exportScope,
                    )?.label.toLowerCase()}
                    )
                  </span>
                  . Current value = paid amount + profit − redeemed profit.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="mt-6 animate-pulse" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-32 rounded-2xl border border-white/10 bg-white/4"
          />
        ))}
      </div>
      <div className="mt-4 h-52 rounded-2xl border border-white/10 bg-white/4" />
      <div className="mt-6 h-11 rounded-xl bg-white/4" />
      <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-white/5 px-5 py-4"
          >
            <div className="h-9 w-9 rounded-xl bg-white/6" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded bg-white/7" />
              <div className="h-2.5 w-56 rounded bg-white/4" />
            </div>
            <div className="h-3 w-20 rounded bg-white/6" />
          </div>
        ))}
      </div>
      <p className="mt-5 text-center text-xs text-slate-500">
        Fetching users and scheme activity…
      </p>
    </div>
  );
}
function ReportControlSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="h-10 w-full rounded-xl bg-white/4" />
      <div className="h-10 w-full rounded-xl bg-white/4" />
      <div className="h-10 w-full rounded-xl bg-white/4" />
    </div>
  );
}
function ReportSummarySkeleton() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="h-32 rounded-2xl border border-white/10 bg-white/4"
        />
      ))}
    </div>
  );
}

function SchemeCardMobile({ scheme: s }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-slate-100">{s.name}</p>
        <ReturnBadge value={s.returns} />
      </div>
      <div className="mt-2 flex items-center justify-between text-slate-500">
        <span className="flex items-center gap-1.5">
          <StatusPill status={s.status} label={displayStatus(s.status)} />
          {s.enrolledOn || "Date unavailable"}
        </span>
        <span className="tabular-nums text-slate-300">
          {currency(s.currentValue)}
        </span>
      </div>
    </div>
  );
}
