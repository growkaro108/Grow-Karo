"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  FileSpreadsheet,
  HandCoins,
  Clock,
} from "lucide-react";
import * as XLSX from "xlsx";
import Image from "next/image";
import TablePagination from "@/components/TablePagination";
import { getAllMaturityUserScheme } from "../../../../../../services/malikService";
import { resolveMediaUrl } from "@/api/apiClient";
import { storage } from "../../../../../../services/storageService";
import SettlementForm from "./SettleByAdminForm";
import PanelToolbar from "./PanelToolbar";
import { PanelContentSkeleton } from "./PanelSkeleton";

const FIRST_PAGE = 1;

export default function WithdrawalPaymentsPanel() {
  const [daysThreshold, setDaysThreshold] = useState(15);
  const [schemes, setSchemes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportLimit] = useState("50");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(FIRST_PAGE);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalElement, setTotalElements] = useState(0);
  const [openForm, setOpenForm] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);

  const filteredSchemes = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return schemes.filter((scheme) => {
      const matchesDays = scheme.daysRemaining <= daysThreshold;
      const matchesSearch =
        String(scheme.userName || "").toLowerCase().includes(query) ||
        String(scheme.schemeName || "").toLowerCase().includes(query) ||
        String(scheme.bondNumber || "").toLowerCase().includes(query);
      return matchesDays && matchesSearch;
    });
  }, [schemes, daysThreshold, searchTerm]);

  const paginatedSchemes = useMemo(() => {
    const start = (currentPage - FIRST_PAGE) * itemsPerPage;
    return filteredSchemes.slice(start, start + itemsPerPage);
  }, [filteredSchemes, currentPage, itemsPerPage]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 700);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchSchemes = async () => {
      try {
        setLoading(true);
        setError("");
        const result = await getAllMaturityUserScheme(
          debouncedSearch,
          daysThreshold,
          currentPage,
          itemsPerPage,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        if (!result) {
          setSchemes([]);
          setTotalElements(0);
          setError("Unable to load schemes due for withdrawal.");
          return;
        }

        const content = Array.isArray(result?.content) ? result.content : [];
        const total = result?.totalElements ?? 0;
        if (content.length === 0 && total > 0 && currentPage > FIRST_PAGE) {
          setCurrentPage(FIRST_PAGE + Math.ceil(total / itemsPerPage) - 1);
          return;
        }

        content.sort((left, right) => left.daysRemaining - right.daysRemaining);
        setSchemes(content);
        setTotalElements(total);
        try {
          storage.setWithTTL("maturityUserSchemes", content, 2);
        } catch (storageError) {
          console.warn("Could not cache maturity schemes:", storageError);
        }
      } catch (fetchError) {
        if (
          controller.signal.aborted ||
          fetchError?.name === "AbortError" ||
          fetchError?.name === "CanceledError"
        ) {
          return;
        }
        console.error("Error fetching maturity user schemes:", fetchError);
        setError("Unable to load schemes due for withdrawal.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchSchemes();
    return () => controller.abort();
  }, [debouncedSearch, currentPage, itemsPerPage, daysThreshold]);

  const handleExportXLSX = () => {
    let dataToExport = [...filteredSchemes];
    if (exportLimit !== "all") {
      dataToExport = dataToExport.slice(0, Number.parseInt(exportLimit, 10));
    }

    const formatDaysRemaining = (days) => {
      if (days < 0) return `${Math.abs(days)}d overdue`;
      if (days === 0) return "Due today";
      if (days === 1) return "1d left";
      return `${days}d left`;
    };
    const formattedData = dataToExport.map((item) => ({
      "Customer ID": item.cust_id,
      "User Name": item.userName,
      "User Email": item.userEmail,
      "Scheme Name": item.schemeName,
      "Plan Type": item.planType,
      "UserScheme ID": item.id,
      "Bond Number": item.bondNumber,
      "Investment Amount (INR)": item.investmentAmount,
      [item.planType === "PENSION"
        ? "Principal Due (INR)"
        : "Maturity Amount (INR)"]: item.maturityAmount,
      "Maturity Date": item.maturityDate,
      "Days Remaining": formatDaysRemaining(item.daysRemaining),
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

  const handleSettlementSuccess = (action, settlementType, settledAmount) => {
    if (action === "SEND_TO_REMITTER") {
      setSchemes((current) =>
        current.map((scheme) =>
          scheme.userSchemId === selectedScheme?.userSchemId
            ? { ...scheme, settlementPending: true }
            : scheme,
        ),
      );
    } else if (settlementType === "FULL") {
      setSchemes((current) =>
        current.filter(
          (scheme) => scheme.userSchemId !== selectedScheme?.userSchemId,
        ),
      );
      setTotalElements((current) => Math.max(0, current - 1));
    } else {
      setSchemes((current) =>
        current.map((scheme) => {
          if (scheme.userSchemId !== selectedScheme?.userSchemId) return scheme;
          const amount = Number(settledAmount) || 0;
          const isPension = scheme.planType === "PENSION";
          return {
            ...scheme,
            maturityAmount:
              settlementType === "PROFIT_ONLY"
                ? Number(scheme.maturityAmount) || 0
                : Math.max(0, Number(scheme.maturityAmount) - amount),
            totalRedeemed: Number(scheme.totalRedeemed || 0) + amount,
            profitAvailable:
              isPension && settlementType === "PARTIAL"
                ? Number(scheme.profitAvailable) || 0
                : Math.max(0, Number(scheme.profitAvailable || 0) - amount),
          };
        }),
      );
    }
    setOpenForm(false);
    setSelectedScheme(null);
  };

  return (
    <div>
      <PanelToolbar
        searchTerm={searchTerm}
        onSearchTermChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(FIRST_PAGE);
        }}
      >
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-indigo-400" />
          <label
            htmlFor="maturity-days-threshold"
            className="whitespace-nowrap text-sm font-medium text-slate-300"
          >
            Maturity Within:
          </label>
          <div className="flex items-center gap-1">
            <input
              id="maturity-days-threshold"
              type="number"
              min="1"
              max="365"
              value={daysThreshold}
              onChange={(event) => {
                setDaysThreshold(Number(event.target.value));
                setCurrentPage(FIRST_PAGE);
              }}
              className="w-16 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-center font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-slate-400">Days</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExportXLSX}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-emerald-950/50 transition hover:bg-emerald-500"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export
        </button>
      </PanelToolbar>

      {loading ? (
        <PanelContentSkeleton kind="withdrawal" />
      ) : error ? (
        <div className="rounded-xl border border-rose-900/70 bg-rose-950/30 p-6 text-center text-rose-300">
          {error}
        </div>
      ) : (
        <>
          <WithdrawalTable
            schemes={paginatedSchemes}
            daysThreshold={daysThreshold}
            onSettle={(scheme) => {
              setSelectedScheme(scheme);
              setOpenForm(true);
            }}
          />
          <WithdrawalCards
            schemes={filteredSchemes}
            daysThreshold={daysThreshold}
            onSettle={(scheme) => {
              setSelectedScheme(scheme);
              setOpenForm(true);
            }}
          />
          <TablePagination
            currentPage={currentPage}
            pageSize={itemsPerPage}
            totalItems={totalElement}
            onPageChange={setCurrentPage}
            onPageSizeChange={(pageSize) => {
              setItemsPerPage(pageSize);
              setCurrentPage(FIRST_PAGE);
            }}
            darkMode
          />
        </>
      )}

      {openForm && selectedScheme && (
        <SettlementForm
          userScheme={selectedScheme}
          onClose={() => {
            setOpenForm(false);
            setSelectedScheme(null);
          }}
          onSuccess={handleSettlementSuccess}
        />
      )}
    </div>
  );
}

function WithdrawalTable({ schemes, daysThreshold, onSettle }) {
  return (
    <div className="hidden overflow-hidden rounded-t-xl border border-slate-800 bg-slate-900/60 shadow-xl md:block">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-800/40 text-xs font-semibold uppercase text-slate-400">
            <th className="px-4 py-3.5">Bond Image</th>
            <th className="px-4 py-3.5">User Details</th>
            <th className="px-4 py-3.5">Scheme & Bond ID</th>
            <th className="px-4 py-3.5">Amount Due</th>
            <th className="px-4 py-3.5">Maturity Date</th>
            <th className="px-4 py-3.5">Days Left</th>
            <th className="px-4 py-3.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-sm">
          {schemes.length ? (
            schemes.map((scheme) => (
              <tr key={scheme.id} className="transition-colors hover:bg-slate-800/30">
                <td className="px-4 py-3">
                  <Image
                    src={resolveMediaUrl(scheme.bondImage) || "/logo.png"}
                    alt={scheme.schemeName}
                    className="h-10 w-14 rounded border border-slate-700 object-cover shadow-sm transition-all duration-700 hover:z-50 hover:h-full hover:w-full"
                    width={50}
                    height={50}
                    unoptimized
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-100">{scheme.userName}</div>
                  <div className="text-xs text-slate-400">{scheme.userEmail}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-200">{scheme.schemeName}</div>
                  <div className="font-mono text-xs text-indigo-400">{scheme.bondNumber}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-100">
                    ₹{Number(scheme.maturityAmount || 0).toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-slate-500">
                    {scheme.planType === "PENSION"
                      ? "Principal due"
                      : `Inv: ₹${Number(scheme.investmentAmount || 0).toLocaleString("en-IN")}`}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-slate-300">
                  {scheme.maturityDate}
                </td>
                <td className="px-4 py-3">
                  <DaysRemaining days={scheme.daysRemaining} />
                </td>
                <td className="px-4 py-3 text-right">
                  {scheme.settlementPending ? (
                    <span className="text-xs text-amber-300">Pending with remitter</span>
                  ) : scheme.daysRemaining < 0 ? (
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-lg p-2 text-cyan-400 transition-all hover:scale-95 hover:bg-slate-800 hover:text-emerald-400"
                      title="Settle scheme"
                      onClick={() => onSettle(scheme)}
                    >
                      <HandCoins className="h-4 w-4" /> Settle
                    </button>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="py-8 text-center text-slate-500">
                No schemes maturing within {daysThreshold} days.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function WithdrawalCards({ schemes, daysThreshold, onSettle }) {
  return (
    <div className="space-y-4 md:hidden">
      {schemes.length ? (
        schemes.map((scheme) => (
          <div
            key={scheme.id}
            className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-md"
          >
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Image
                src={resolveMediaUrl(scheme.bondImage) || "/logo.png"}
                alt={scheme.schemeName}
                width={100}
                height={100}
                className="h-12 w-16 rounded-md border border-slate-700 object-cover"
                loading="lazy"
                decoding="async"
                unoptimized
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-slate-100">{scheme.schemeName}</h3>
                <p className="font-mono text-xs text-indigo-400">{scheme.bondNumber}</p>
              </div>
              <DaysRemaining days={scheme.daysRemaining} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Field label="Investor">{scheme.userName}</Field>
              <Field label="Maturity Date">{scheme.maturityDate}</Field>
              <Field label="Invested">
                ₹{Number(scheme.investmentAmount || 0).toLocaleString("en-IN")}
              </Field>
              <Field label={scheme.planType === "PENSION" ? "Principal due" : "Payout"}>
                <span className="text-sm font-bold text-emerald-400">
                  ₹{Number(scheme.maturityAmount || 0).toLocaleString("en-IN")}
                </span>
              </Field>
            </div>
            <div className="border-t border-slate-800 pt-3">
              {scheme.settlementPending ? (
                <p className="text-center text-xs text-amber-300">
                  Pending with remitter
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => onSettle(scheme)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 py-2 text-xs font-medium text-cyan-400 hover:bg-slate-800"
                >
                  <HandCoins className="h-4 w-4" /> Settle
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 text-center text-slate-500">
          No schemes maturing within {daysThreshold} days.
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className="truncate font-medium text-slate-200">{children}</p>
    </div>
  );
}

function DaysRemaining({ days }) {
  const className =
    days <= 3
      ? "border-rose-800/50 bg-rose-950/80 text-rose-300"
      : "border-amber-800/50 bg-amber-950/80 text-amber-300";
  const label =
    days < 0
      ? `${Math.abs(days)}d overdue`
      : days === 0
        ? "Due today"
        : days === 1
          ? "Tomorrow"
          : `${days}d left`;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}
    >
      <AlertTriangle className="h-3 w-3" />
      {label}
    </span>
  );
}
