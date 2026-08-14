import { Check, Copy, ImageUp, Landmark, X } from "lucide-react";
import React from "react";

export default function SettlementForm({
  activeSettlement,
  handleCloseSettlement,
  handleFileChange,
  handleSubmitSettlement,
  settlementAmount,
  setSettlementAmount,
  proofFile,
  formError,
  isSubmitting,
  copiedField,
  handleCopy,
  sanitizeText,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl border border-gray-100 shadow-2xl overflow-hidden transform transition-all scale-100 p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
              Settle Remittance Demand
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Fulfilling order request for{" "}
              <span className="font-semibold text-gray-700">
                {sanitizeText(activeSettlement.sender)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleCloseSettlement}
            className="text-gray-400 hover:text-gray-600 bg-gray-50 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <hr className="border-gray-100" />

        {/* Beneficiary bank details */}
        <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Landmark className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Beneficiary Bank Details
            </span>
          </div>

          <dl className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-400 font-medium shrink-0">
                Account Holder
              </dt>
              <dd className="font-semibold text-gray-800 text-right truncate">
                {sanitizeText(activeSettlement.accountHolderName) || "—"}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-400 font-medium shrink-0">Bank Name</dt>
              <dd className="font-semibold text-gray-800 text-right truncate">
                {sanitizeText(activeSettlement.bankName) || "—"}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-400 font-medium shrink-0">
                Account Number
              </dt>
              <dd className="flex items-center gap-1.5">
                <span className="font-mono font-semibold text-gray-800 tracking-wide">
                  {sanitizeText(activeSettlement.accountNumber) || "—"}
                </span>
                {activeSettlement.accountNumber && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        activeSettlement.accountNumber,
                        "accountNumber",
                      )
                    }
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    aria-label="Copy account number"
                  >
                    {copiedField === "accountNumber" ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-400 font-medium shrink-0">IFSC Code</dt>
              <dd className="flex items-center gap-1.5">
                <span className="font-mono font-semibold text-gray-800 tracking-wide">
                  {sanitizeText(activeSettlement.ifscCode) || "—"}
                </span>
                {activeSettlement.ifscCode && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(activeSettlement.ifscCode, "ifsc")
                    }
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    aria-label="Copy IFSC code"
                  >
                    {copiedField === "ifsc" ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <form onSubmit={handleSubmitSettlement} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">
              Confirm Settlement Amount
            </label>
            <div className="relative rounded-xl border border-gray-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-all px-3 py-2">
              <input
                type="number"
                step="0.01"
                min="1"
                max="100000"
                inputMode="decimal"
                required
                value={settlementAmount}
                onChange={(e) => setSettlementAmount(e.target.value)}
                className="w-full bg-transparent font-bold text-lg text-gray-900 outline-none"
              />
              <span className="absolute right-4 top-2.5 font-bold text-xs text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-md shadow-2xs">
                INR (₹)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">
              Payment Receipt / Screenshot
            </label>
            <div className="relative group border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl p-4 bg-gray-50/50 hover:bg-white transition-all text-center cursor-pointer">
              <input
                type="file"
                required
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-1">
                <ImageUp className="w-6 h-6 mx-auto text-gray-400 group-hover:text-blue-500 transition-colors" />
                <p className="text-xs font-medium text-gray-600 truncate">
                  {proofFile
                    ? `Attached: ${proofFile.name}`
                    : "Click or drag to upload transaction proof"}
                </p>
                <p className="text-[10px] text-gray-400">
                  Supports PNG, JPG, WEBP, PDF up to 5MB
                </p>
              </div>
            </div>
          </div>

          {formError ? (
            <p className="text-xs font-medium text-red-600">{formError}</p>
          ) : null}

          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={handleCloseSettlement}
              className="w-1/2 py-2.5 border border-gray-200 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-1/2 py-2.5 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 shadow-md hover:shadow transition-all disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Submitting…" : "Authorize Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
