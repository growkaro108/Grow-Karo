"use client";

import React, { use, useEffect, useState } from "react";
import Image from "next/image";
import { remitterContext } from "@/context/RemitterContext";
import { getRemittersAllTransactions } from "../../../../../services/remitterService";
import { resolveMediaUrl } from "@/api/apiClient";
import { TableRowLoader } from "@/loader/TableRowLoader";

const PAGE_SIZE = 5;

export default function TransactionsView() {
  const { authRemitter } = use(remitterContext);
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // 1-based for UI
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchTransactions = async () => {
      if (!authRemitter?.id) return;
      setIsLoading(true);
      setError("");
      try {
        const offset = (currentPage - 1) * PAGE_SIZE;
        const response = await getRemittersAllTransactions(
          authRemitter.id,
          offset,
          PAGE_SIZE,
        );
        if (mounted && response) {
          setTransactions(response.content ?? []);
          setTotalPages(response.totalPages ?? 1);
          setTotalElements(response.totalElements ?? 0);
        }
      } catch (err) {
        if (mounted) {
          console.error("Failed to fetch transactions:", err);
          setError("Could not load transactions.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchTransactions();

    return () => {
      mounted = false;
    };
  }, [authRemitter, currentPage]);

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const goToPage = (page) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Historical Ledger</h2>
          <p className="text-xs text-gray-500">
            A comprehensive chronological index of all outbound assets.
          </p>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 mb-4">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase">
              <th className="pb-3">Reference / Beneficiary</th>
              <th className="pb-3">Value</th>
              <th className="pb-3">Execution Date</th>
              <th className="pb-3">Proof</th>
              <th className="pb-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {isLoading ? (
              <TableRowLoader colSpan={5} loading={"transactions"} />
            ) : safeTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="py-8 text-center text-sm text-gray-500"
                >
                  No transactions available.
                </td>
              </tr>
            ) : (
              safeTransactions.map((tx) => (
                <tr key={tx.txnId}>
                  <td className="py-4">
                    <p className="font-semibold text-gray-900">{tx.username}</p>
                    <p className="text-xs text-gray-400">
                      {tx.txnId}
                      {/* • {tx.method} */}
                    </p>
                  </td>
                  <td className="py-4">
                    <p className="font-semibold text-gray-900">{tx.amount}</p>
                    {/* <p className="text-xs text-gray-400">{tx.foreign}</p> */}
                  </td>
                  <td className="py-4 text-gray-500">{tx.settlementDate}</td>
                  <td className="py-4">
                    {tx.proofUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(tx.proofUrl)}
                        className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 cursor-pointer transition-all duration-300 ease-in-out hover:scale-110"
                      >
                        <img
                          src={
                            tx.proofUrl ? resolveMediaUrl(tx.proofUrl) : null
                          }
                          alt="Payment proof"
                          fill
                          className="object-fit"
                        />
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tx.proofUrl ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                    >
                      {tx.proofUrl ? "completed" : "pending"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalElements > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 gap-3">
          <p className="text-xs text-gray-500">
            Showing {startIndex + 1}–
            {Math.min(startIndex + PAGE_SIZE, totalElements)} of {totalElements}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => goToPage(page)}
                disabled={isLoading}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  page === currentPage
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative flex items-center justify-center max-h-[80vh] max-w-full overflow-auto"
            onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside the image area
          >
            <img
              src={resolveMediaUrl(previewImage)}
              alt="Payment proof full view"
              className="max-h-[80vh] w-auto object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
