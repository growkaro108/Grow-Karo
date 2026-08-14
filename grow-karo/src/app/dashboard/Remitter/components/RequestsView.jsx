"use client";

import TabLoader from "@/loader/TabLoader";
import dynamic from "next/dynamic";
import React, { useState } from "react";
// import { SettlementForm } from "./SettlementForm";

const SettlementForm = dynamic(() => import("./SettlementForm"), {
  loading: () => <TabLoader />,
  ssr: false,
});

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

function sanitizeText(value, maxLength = 240) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export default function RequestsView({ requests = [] }) {
  const [activeSettlement, setActiveSettlement] = useState(null);
  const [settlementAmount, setSettlementAmount] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [remitterMessage, setRemitterMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = async (value, field) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const safeRequests = Array.isArray(requests) ? requests : [];

  const handleOpenSettlement = (req) => {
    if (!req?.id || !req?.sender) return;

    setActiveSettlement(req);
    const numericAmount = Number.parseFloat(
      String(req.amount ?? "").replace(/[^0-9.]/g, ""),
    );
    setSettlementAmount(
      Number.isFinite(numericAmount) ? numericAmount.toString() : "",
    );
    setFormError("");
    setProofFile(null);
    setRemitterMessage("");
  };

  const handleCloseSettlement = () => {
    setActiveSettlement(null);
    setSettlementAmount("");
    setProofFile(null);
    setRemitterMessage("");
    setFormError("");
    setIsSubmitting(false);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setProofFile(null);
      setFormError("Please choose a valid proof file.");
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setProofFile(null);
      setFormError("Only JPG, PNG, WEBP, or PDF files are supported.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setProofFile(null);
      setFormError("Proof file must be 5MB or smaller.");
      return;
    }

    setProofFile({
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
    });
    setFormError("");
  };

  const handleSubmitSettlement = (e) => {
    e.preventDefault();

    if (!activeSettlement) {
      setFormError("No request selected.");
      return;
    }

    const parsedAmount = Number(settlementAmount);
    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0 ||
      parsedAmount > 1000000
    ) {
      setFormError(
        "Enter a valid settlement amount between ₹0.01 and ₹1,000,000.",
      );
      return;
    }

    if (!proofFile) {
      setFormError("Please upload payment proof before submitting.");
      return;
    }

    const sanitizedMessage = sanitizeText(remitterMessage);
    if (sanitizedMessage.length > 240) {
      setFormError(
        "Your message is too long. Please keep it under 240 characters.",
      );
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    window.setTimeout(() => {
      setIsSubmitting(false);
      handleCloseSettlement();
    }, 600);
  };

  return (
    <div className="relative">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6">
        <div className="pb-6">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Pending Remittance Demands
          </h2>
          <p className="text-xs text-gray-500">
            Incoming counterparty calls requesting matching secure liquidation.
          </p>
        </div>

        {safeRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-400 font-medium">
            No active pending remittance invoices found.
          </div>
        ) : (
          <div className="space-y-4">
            {safeRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-gray-200"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-900 text-sm">
                      {sanitizeText(req.sender)}
                    </span>
                    <span className="text-xs text-gray-400">
                      • {sanitizeText(req.date)}
                    </span>
                  </div>
                  {/* <p className="text-xs text-gray-600 mt-0.5 italic">"{sanitizeText(req.note)}"</p> */}
                  <p className="text-sm font-bold text-blue-600 mt-1">
                    {sanitizeText(req.amount)}
                  </p>
                </div>
                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button
                    type="button"
                    className="px-3.5 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-100 transition-all"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenSettlement(req)}
                    className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm transition-all"
                  >
                    Settle Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeSettlement && (
        <SettlementForm
          activeSettlement={activeSettlement}
          handleCloseSettlement={handleCloseSettlement}
          handleFileChange={handleFileChange}
          handleSubmitSettlement={handleSubmitSettlement}
          settlementAmount={settlementAmount}
          setSettlementAmount={setSettlementAmount}
          proofFile={proofFile}
          formError={formError}
          isSubmitting={isSubmitting}
          copiedField={copiedField}
          handleCopy={handleCopy}
          sanitizeText={sanitizeText}
        />
      )}
    </div>
  );
}
