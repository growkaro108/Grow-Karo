"use client";

import { remitterContext } from "@/context/RemitterContext";
import TabLoader from "@/loader/TabLoader";
import dynamic from "next/dynamic";
import React, { use, useEffect, useMemo, useState } from "react";
import {
  getRemittersPendingRequests,
  submitSettlement,
} from "../../../../../services/remitterService";
import { errorMessage } from "@/components/Message";
import { resolveMediaUrl } from "@/api/apiClient";
// import { SettlementForm } from "./SettlementForm";

const SettlementForm = dynamic(() => import("./SettlementForm"), {
  loading: () => <TabLoader message="Loading settlement form..." />,
  ssr: false,
});

const MAX_FILE_SIZE = 3 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

function sanitizeText(value, maxLength = 100) {
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
  const [previewImage, setPreviewImage] = useState(null);
  const { authRemitter } = use(remitterContext);
  const [pendingRemittanceRequests, setPendingRemittanceRequests] =
    useState(null);
  useEffect(() => {
    const getPendingRemittanceRequests = async () => {
      const response = await getRemittersPendingRequests(authRemitter?.id);
      // console.log(response);
      if (response) setPendingRemittanceRequests(response);
      return;
    };
    getPendingRemittanceRequests();
  }, [authRemitter]);

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

  const safeRequests = useMemo(
    () =>
      Array.isArray(pendingRemittanceRequests) ? pendingRemittanceRequests : [],
    [pendingRemittanceRequests],
  );

  const handleOpenSettlement = (req) => {
    if (!req?.txnId || !req?.username) return;

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
      errorMessage("Only JPG, PNG, WEBP, or PDF files are supported.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setProofFile(null);
      setFormError("Proof file must be 3MB or smaller.");
      return;
    }

    setProofFile({
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      url: URL.createObjectURL(selectedFile),
      file: selectedFile,
    });
    setFormError("");
  };

  const handleSubmitSettlement = async (e) => {
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
    if (sanitizedMessage.length > 100) {
      setFormError(
        "Your message is too long. Please keep it under 100 characters.",
      );
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    const formData = new FormData();
    formData.append("remitterId", authRemitter?.id);
    formData.append("txnId", activeSettlement.txnId);
    formData.append("amount", parsedAmount);
    formData.append("file", proofFile?.file);
    // formData.append("remitterMessage", sanitizedMessage);

    // const settlementPayload = {
    //   remitterId: authRemitter?.id,
    //   txnId: activeSettlement.txnId,
    //   amount: parsedAmount,
    //   file: proofFile?.file,
    //   // remitterMessage: sanitizedMessage,
    // };

    console.log("settlementPayload", formData); //pending⏱️
    const res = await submitSettlement(formData);
    if (res) {
      //add image url to table row
      const updatedRequests = pendingRemittanceRequests.map((req) =>
        req.txnId === activeSettlement.txnId
          ? { ...req, proofImage: res }
          : req,
      );
      setPendingRemittanceRequests(updatedRequests);
      // toast.success("Settlement submitted successfully");
      window.setTimeout(() => {
        setIsSubmitting(false);
        handleCloseSettlement();
      }, 300);
    }
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
                key={req.txnId}
                className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-gray-200"
              >
                <div className="flex items-center gap-3">
                  {req.proofImage && (
                    <img
                      src={resolveMediaUrl(req.proofImage)}
                      alt="Payment proof"
                      onClick={() => setPreviewImage(req.proofImage)}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                      loading="lazy"
                    />
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900 text-sm">
                        {sanitizeText(req.username)}
                      </span>
                      <span className="text-xs text-gray-400">
                        • {sanitizeText(req.time)}
                      </span>
                    </div>
                    {/* <p className="text-xs text-gray-600 mt-0.5 italic">"{sanitizeText(req.note)}"</p> */}
                    <p className="text-sm font-bold text-blue-600 mt-1">
                      {sanitizeText(req.amount)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 self-end sm:self-center">
                  {/* <button
                    type="button"
                    className="px-3.5 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-100 transition-all"
                  >
                    Decline
                  </button> */}
                  {!req.proofImage && (
                    <button
                      type="button"
                      onClick={() => handleOpenSettlement(req)}
                      className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm transition-all duration-300 cursor-pointer"
                    >
                      Settle Request
                    </button>
                  )}
                </div>
              </div>
            ))}

            {previewImage && (
              <div
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                onClick={() => setPreviewImage(null)}
              >
                <img
                  src={resolveMediaUrl(previewImage)}
                  alt="Payment proof full view"
                  className="max-w-full max-h-full rounded-xl shadow-2xl"
                />
              </div>
            )}
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
          setProofFile={setProofFile}
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
