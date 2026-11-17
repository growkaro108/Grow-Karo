"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import TablePagination from "@/components/TablePagination";
import {
  getDuePensionProfits,
  markPensionProfitPaid,
} from "../../../../../../services/malikService";
import { formatDate } from "@/app/dashboard/grahak/Portfolio/portfolioUtils";
import PanelToolbar from "./PanelToolbar";
import { PanelContentSkeleton } from "./PanelSkeleton";

const isProfitDateUpcoming = (profitDate) =>
  profitDate >
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const formatAmount = (amount) =>
  Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function ProfitDuePanel({ onTotalChange }) {
  const [profitDue, setProfitDue] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [daysThreshold, setDaysThreshold] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionId, setActionId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 700);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchDueProfits = async () => {
      try {
        setLoading(true);
        setError("");
        const result = await getDuePensionProfits(
          debouncedSearch,
          daysThreshold,
          page,
          pageSize,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        if (!result) {
          setProfitDue([]);
          setTotal(0);
          onTotalChange(0);
          setError("Unable to load due pension profits.");
          return;
        }

        const content = Array.isArray(result.content) ? result.content : [];
        const nextTotal = result.totalElements ?? 0;
        setProfitDue(content);
        setTotal(nextTotal);
        onTotalChange(nextTotal);

        if (content.length === 0 && nextTotal > 0 && page > 1) {
          setPage(Math.max(1, Math.ceil(nextTotal / pageSize)));
        }
      } catch (fetchError) {
        if (
          controller.signal.aborted ||
          fetchError?.name === "AbortError" ||
          fetchError?.name === "CanceledError"
        ) {
          return;
        }
        console.error("Error fetching due pension profits:", fetchError);
        setError("Unable to load due pension profits.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchDueProfits();
    return () => controller.abort();
  }, [
    debouncedSearch,
    daysThreshold,
    onTotalChange,
    page,
    pageSize,
    refreshKey,
  ]);

  const handleMarkPaid = async (ledgerId) => {
    try {
      setActionId(ledgerId);
      setActionError("");
      const succeeded = await markPensionProfitPaid(ledgerId);
      if (!succeeded) {
        setActionError("Unable to mark this pension profit as paid.");
        return;
      }
      setRefreshKey((current) => current + 1);
    } catch (actionError) {
      console.error("Error marking pension profit as paid:", actionError);
      setActionError("Unable to mark this pension profit as paid.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <PanelToolbar
        searchTerm={searchTerm}
        onSearchTermChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
      >
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-indigo-400" />
          <label
            htmlFor="profit-days-threshold"
            className="whitespace-nowrap text-sm font-medium text-slate-300"
          >
            Payment Due Within:
          </label>
          <div className="flex items-center gap-1">
            <input
              id="profit-days-threshold"
              type="number"
              min="1"
              max="365"
              value={daysThreshold}
              onChange={(event) => {
                setDaysThreshold(Number(event.target.value));
                setPage(1);
              }}
              className="w-16 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-center font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-slate-400">Days</span>
          </div>
        </div>
      </PanelToolbar>

      {actionError && (
        <p className="mb-3 rounded-lg border border-rose-900/70 bg-rose-950/30 px-3 py-2 text-sm text-rose-300">
          {actionError}
        </p>
      )}

      {loading ? (
        <PanelContentSkeleton kind="profitDue" />
      ) : error ? (
        <div className="rounded-xl border border-rose-900/70 bg-rose-950/30 p-6 text-center text-rose-300">
          {error}
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/40 text-xs font-semibold uppercase text-slate-400">
                  <th className="px-4 py-3.5">Pension User</th>
                  <th className="px-4 py-3.5">Required Scheme</th>
                  <th className="px-4 py-3.5">Bond Number</th>
                  <th className="px-4 py-3.5">Payment Date</th>
                  <th className="px-4 py-3.5 text-right">Profit Due</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {profitDue.length ? (
                  profitDue.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-100">
                          {entry.userName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {entry.userEmail}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-200">
                        {entry.schemeName}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-indigo-300">
                        {entry.bondNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {formatDate(entry.profitDate)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-300">
                        ₹{formatAmount(entry.profitAmount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <PaymentAction
                          entry={entry}
                          actionId={actionId}
                          onMarkPaid={handleMarkPaid}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      No unpaid pension profits are due within {daysThreshold} days.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {profitDue.length ? (
              profitDue.map((entry) => (
                <div
                  key={entry.id}
                  className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-100">{entry.userName}</p>
                    <p className="text-xs text-slate-400">{entry.userEmail}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <Field label="Required Scheme">{entry.schemeName}</Field>
                    <Field label="Bond Number">{entry.bondNumber || "—"}</Field>
                    <Field label="Payment Date">{formatDate(entry.profitDate)}</Field>
                    <Field label="Profit Due">₹{formatAmount(entry.profitAmount)}</Field>
                  </div>
                  <PaymentAction
                    entry={entry}
                    actionId={actionId}
                    onMarkPaid={handleMarkPaid}
                    fullWidth
                  />
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 text-center text-slate-500">
                No unpaid pension profits are due within {daysThreshold} days.
              </div>
            )}
          </div>

          <TablePagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={total}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
            darkMode
          />
        </>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className="font-medium text-slate-200">{children}</p>
    </div>
  );
}

function PaymentAction({ entry, actionId, onMarkPaid, fullWidth = false }) {
  const upcoming = isProfitDateUpcoming(entry.profitDate);
  const className = fullWidth
    ? "flex w-full items-center justify-center rounded-lg border border-emerald-800 bg-emerald-950/40 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-900/60 disabled:cursor-not-allowed disabled:opacity-50"
    : "rounded-lg bg-emerald-700 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-60";

  return (
    <button
      type="button"
      disabled={upcoming || actionId !== null}
      onClick={() => onMarkPaid(entry.id)}
      className={className}
    >
      {actionId === entry.id
        ? "Saving..."
        : upcoming
          ? "Not due yet"
          : "Mark as paid"}
    </button>
  );
}
