"use client";

import React, { use, useEffect, useState } from "react";
import { remitterContext } from "@/context/RemitterContext";
// getRecipients: GET /remitters/{remitterId}/recipients -> Recipient[]
// Each Recipient already includes totalAmount, transactionCount, paymentMethod,
// and the full `transfers` list — no separate "details" call needed.
import { MoreVertical, X, Send, Wallet, ArrowUpRight } from "lucide-react";
import { getRecipient } from "../../../../../services/remitterService";

function formatAmount(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
}

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function RecipientDetailsModal({ recipient, onClose }) {
  const transfers = recipient.transfers ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm bg-blue-50 text-blue-700">
              {initials(recipient.name)}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{recipient.name}</h3>
              <p className="text-xs text-gray-500">{recipient.paymentMethod}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-blue-50 p-4">
              <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                <Send className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Transfers sent</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {recipient.transactionCount}
              </p>
            </div>
            <div className="rounded-xl bg-green-50 p-4">
              <div className="flex items-center gap-1.5 text-green-600 mb-1">
                <Wallet className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Total sent</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {formatAmount(recipient.totalAmount)}
              </p>
            </div>
          </div>

          {transfers.length > 0 ? (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Transfer History
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {transfers.map((t) => (
                  <div
                    key={t.transactionId}
                    className="rounded-lg border border-gray-100 px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                        {formatDate(t.date)}
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {formatAmount(t.amount)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {t.bankName}
                      {t.accountNumber ? ` • ${t.accountNumber}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-2">
              No transfers sent to this recipient yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecipientsView() {
  const { authRemitter } = use(remitterContext);
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await getRecipient(authRemitter?.id);
        if (!cancelled) setRecipients(response ?? []);
      } catch (err) {
        console.error("Failed to fetch recipients:", err);
        if (!cancelled) setRecipients([]);
      }
    };

    if (authRemitter?.id) {
      load();
    } else {
      setRecipients([]);
    }

    return () => {
      cancelled = true;
    };
  }, [authRemitter?.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Verified Beneficiaries
          </h2>
          <p className="text-xs text-gray-500">
            Manage payment channels and destination delivery rails
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all">
          + Add Recipient
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recipients.length === 0 ? (
          <div className="md:col-span-2 rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            No recipients available yet.
          </div>
        ) : (
          recipients.map((rec) => (
            <div
              key={rec.userId}
              onClick={() => setSelectedRecipient(rec)}
              className="cursor-pointer bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-start justify-between hover:border-blue-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm bg-blue-50 text-blue-700">
                  {initials(rec.name)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{rec.name}</h4>
                  <p className="text-sm font-semibold text-gray-700">
                    {formatAmount(rec.totalAmount)}
                  </p>
                  <p className="text-xs text-gray-500">{rec.paymentMethod}</p>
                </div>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(
                      openMenuId === rec.userId ? null : rec.userId,
                    );
                  }}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {openMenuId === rec.userId && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-7 z-10 w-40 rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecipient(rec);
                        setOpenMenuId(null);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      View Details
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedRecipient && (
        <RecipientDetailsModal
          recipient={selectedRecipient}
          onClose={() => setSelectedRecipient(null)}
        />
      )}
    </div>
  );
}
