"use client";

import { useEffect, useState } from "react";
import {
  getActiveRemitters,
  settleMaturedScheme,
} from "../../../../../../services/malikService";

const PROOF_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_PROOF_BYTES = 3 * 1024 * 1024;

function localToday() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function formatInr(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function Summary({ label, amount }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">
        {formatInr(amount)}
      </p>
    </div>
  );
}

export default function SettleByAdminForm({ userScheme, onClose, onSuccess }) {
  const [action, setAction] = useState("SEND_TO_REMITTER");
  const [remitters, setRemitters] = useState([]);
  const [remittersLoading, setRemittersLoading] = useState(true);
  const [remitterError, setRemitterError] = useState("");
  const [remitterId, setRemitterId] = useState("");
  const [settlementType, setSettlementType] = useState("FULL");
  const [partialAmount, setPartialAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("BANK_TRANSFER");
  const [paymentDate, setPaymentDate] = useState(localToday);
  const [transactionRef, setTransactionRef] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [remarks, setRemarks] = useState("");
  const [proof, setProof] = useState(null);
  const [proofError, setProofError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (action !== "SEND_TO_REMITTER") return undefined;

    let active = true;
    getActiveRemitters()
      .then((items) => {
        if (!active) return;
        if (!items) {
          setRemitterError("Could not load remitters. Please try again.");
          return;
        }
        setRemitters(items);
        setRemitterId((current) => current || items[0]?.id || "");
        if (items.length === 0) {
          setRemitterError("There are no active remitters available.");
        }
      })
      .catch((loadError) => {
        if (active)
          setRemitterError(loadError.message || "Could not load remitters.");
      })
      .finally(() => {
        if (active) setRemittersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [action]);

  const settleable = Math.max(0, Number(userScheme.maturityAmount) || 0);
  const investedAmount = userScheme.investmentAmount;
  const profitEarned =
    userScheme.totalProfit > 1
      ? userScheme.totalProfit
      : settleable - userScheme.investmentAmount;
  const redeemAmount = userScheme.totalRedeemed;
  const balanceDue = settleable;
  const profitAvailable =
    userScheme.planType === "PENSION"
      ? Math.max(0, Number(userScheme.profitAvailable) || 0)
      : Math.max(0, Number(profitEarned - redeemAmount) || 0);
  const settlementAmount =
    settlementType === "PARTIAL"
      ? Number(partialAmount) || 0
      : settlementType === "PROFIT_ONLY"
        ? profitAvailable
        : settleable;

  const changeAction = (nextAction) => {
    setAction(nextAction);
    setError("");
    setConfirmed(false);
    if (nextAction === "SEND_TO_REMITTER") {
      setRemittersLoading(true);
      setRemitterError("");
    } else {
      setRemittersLoading(false);
    }
  };

  const handleProofChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setProof(file);
    if (!file) {
      setProofError("");
    } else if (!PROOF_TYPES.includes(file.type)) {
      setProofError("Only JPG, PNG, WEBP, or PDF files are supported.");
    } else if (file.size === 0 || file.size > MAX_PROOF_BYTES) {
      setProofError("Proof must be a non-empty file no larger than 3 MB.");
    } else {
      setProofError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!confirmed) {
      setError("Please confirm this settlement action.");
      return;
    }
    if (settlementType === "PARTIAL") {
      if (!Number.isFinite(settlementAmount) || settlementAmount <= 0) {
        setError("Enter a valid partial settlement amount.");
        return;
      }
      if (settlementAmount > settleable) {
        setError(`Partial settlement cannot exceed ${formatInr(settleable)}.`);
        return;
      }
    } else if (settlementType === "PROFIT_ONLY" && settlementAmount <= 0) {
      setError("There is no profit available to settle.");
      return;
    }

    let payload;
    let proofFile = null;
    if (action === "SEND_TO_REMITTER") {
      if (!remitterId) {
        setError(remitterError || "Select an active remitter.");
        return;
      }
      payload = {
        action,
        remitterId,
        settlementType,
        amount: settlementAmount,
      };
    } else {
      if (!paymentDate || paymentDate > localToday()) {
        setError("Enter a valid payment date no later than today.");
        return;
      }
      if (!proof || proofError) {
        setError(
          proofError || "Upload payment proof before marking this done.",
        );
        return;
      }
      if (paymentMode === "CASH" && receivedBy.trim().length < 2) {
        setError("Enter the name of the person who received the cash.");
        return;
      }
      if (
        paymentMode !== "CASH" &&
        (transactionRef.trim().length < 4 || transactionRef.trim().length > 100)
      ) {
        setError("Enter a valid transaction / UTR reference.");
        return;
      }
      payload = {
        action: "MARK_DONE",
        settlementType,
        amount: settlementAmount,
        paymentMode,
        paymentDate,
        transactionRef: paymentMode === "CASH" ? null : transactionRef.trim(),
        receivedBy: paymentMode === "CASH" ? receivedBy.trim() : null,
        remarks: remarks.trim() || null,
      };
      proofFile = proof;
    }

    setSubmitting(true);
    try {
      const response = await settleMaturedScheme(
        userScheme.userSchemId,
        payload,
        proofFile,
      );
      if (response?.status !== "success") {
        throw new Error(response?.message || "Settlement could not be saved.");
      }
      onSuccess(
        action,
        response.data?.settlementType ?? settlementType,
        Number(response.data?.amount ?? settlementAmount),
      );
    } catch (submitError) {
      setError(submitError.message || "Settlement could not be saved.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settlement-title"
    >
      <form
        onSubmit={handleSubmit}
        className="my-auto w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4 sm:px-6">
          <div>
            <h2
              id="settlement-title"
              className="text-lg font-semibold text-white"
            >
              Settle matured scheme
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {userScheme.schemeName} · {userScheme.userName}
            </p>
            <p className="text-xs text-slate-500">
              Bond {userScheme.bondNumber} · Maturity date{" "}
              {userScheme.maturityDate}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settlement form"
            className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          {userScheme.planType === "PENSION" && (
            <p className="rounded-lg border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
              Pension principal is due within 30 days after maturity. Interest
              payouts are recorded separately.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Summary label="Invested" amount={investedAmount} />
            <Summary label="Profit earned" amount={profitEarned} />
            <Summary label="Redeemed" amount={redeemAmount} />
            <Summary
              label={
                userScheme.planType === "PENSION"
                  ? "Principal due"
                  : "Balance due"
              }
              amount={balanceDue}
            />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-300">
              Amount to settle
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [
                  "FULL",
                  userScheme.planType === "PENSION" ? "Return principal" : "Full",
                  userScheme.planType === "PENSION"
                    ? "Pay the remaining principal; interest is separate."
                    : "Pay the full remaining balance.",
                ],
                [
                  "PARTIAL",
                  "Partial",
                  userScheme.planType === "PENSION"
                    ? "Return part of the principal."
                    : "Choose an amount up to the balance.",
                ],
                // ["PROFIT_ONLY", "Profit Only", "Pay available profit only."],
              ].map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSettlementType(value);
                    setError("");
                    setConfirmed(false);
                  }}
                  className={`rounded-xl border p-3 text-left ${
                    settlementType === value
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
                  }`}
                >
                  <span className="block text-sm font-medium text-white">
                    {label}
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">
                    {hint}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          {settlementType === "PARTIAL" && (
            <div>
              <label
                htmlFor="partial-settlement-amount"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Amount to pay
              </label>
              <input
                id="partial-settlement-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                max={settleable}
                step="0.01"
                value={partialAmount}
                onChange={(event) => setPartialAmount(event.target.value)}
                placeholder={`Up to ${formatInr(settleable)}`}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
            <span className="text-sm text-slate-400">Settlement amount</span>
            <span className="text-lg font-semibold text-emerald-400">
              {formatInr(settlementAmount)}
            </span>
          </div>
          {settlementType === "PROFIT_ONLY" && (
            <p className="-mt-3 text-xs text-slate-500">
              Available profit: {formatInr(profitAvailable)}
            </p>
          )}

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-300">
              Choose how to settle
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => changeAction("SEND_TO_REMITTER")}
                className={`rounded-xl border p-3 text-left ${
                  action === "SEND_TO_REMITTER"
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
                }`}
              >
                <span className="block text-sm font-medium text-white">
                  Send to Remitter
                </span>
                <span className="mt-1 block text-xs text-slate-400">
                  Assign the payout. The remitter will add payment details and
                  proof after paying.
                </span>
              </button>
              <button
                type="button"
                onClick={() => changeAction("MARK_DONE")}
                className={`rounded-xl border p-3 text-left ${
                  action === "MARK_DONE"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
                }`}
              >
                <span className="block text-sm font-medium text-white">
                  Mark as Done
                </span>
                <span className="mt-1 block text-xs text-slate-400">
                  Record a completed payment. Partial payments leave the
                  remaining balance open.
                </span>
              </button>
            </div>
          </fieldset>

          {action === "SEND_TO_REMITTER" ? (
            <div>
              <label
                htmlFor="settlement-remitter"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Assign to remitter
              </label>
              <select
                id="settlement-remitter"
                value={remitterId}
                onChange={(event) => setRemitterId(event.target.value)}
                disabled={remittersLoading || remitters.length === 0}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-60"
              >
                <option value="">
                  {remittersLoading
                    ? "Loading remitters..."
                    : "Select a remitter"}
                </option>
                {remitters.map((remitter) => (
                  <option key={remitter.id} value={remitter.id}>
                    {remitter.organizationName} · {remitter.RemitterEmail}
                  </option>
                ))}
              </select>
              {remitterError && (
                <p role="alert" className="mt-1.5 text-xs text-amber-300">
                  {remitterError}
                </p>
              )}
              {userScheme.accountNumber ? (
                <p className="mt-2 text-xs text-slate-500">
                  Beneficiary: {userScheme.accountHolderName} ·{" "}
                  {userScheme.bankName} · A/C.{" "}
                  {String(userScheme.accountNumber)} · IFSC{" "}
                  {userScheme.ifsc}
                </p>
              ) : (
                <p role="alert" className="mt-2 text-xs text-rose-300">
                  Add the user&apos;s bank details before assigning this payout.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="payment-mode"
                    className="mb-1.5 block text-sm font-medium text-slate-300"
                  >
                    Payment mode
                  </label>
                  <select
                    id="payment-mode"
                    value={paymentMode}
                    onChange={(event) => setPaymentMode(event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="BANK_TRANSFER">Bank transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="payment-date"
                    className="mb-1.5 block text-sm font-medium text-slate-300"
                  >
                    Payment date
                  </label>
                  <input
                    id="payment-date"
                    type="date"
                    value={paymentDate}
                    max={localToday()}
                    onChange={(event) => setPaymentDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white [color-scheme:dark]"
                  />
                </div>
              </div>

              {paymentMode === "CASH" ? (
                <div>
                  <label
                    htmlFor="cash-recipient"
                    className="mb-1.5 block text-sm font-medium text-slate-300"
                  >
                    Cash received by
                  </label>
                  <input
                    id="cash-recipient"
                    value={receivedBy}
                    maxLength={100}
                    onChange={(event) => setReceivedBy(event.target.value)}
                    placeholder="Name of person who received the cash"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                  />
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="transaction-ref"
                    className="mb-1.5 block text-sm font-medium text-slate-300"
                  >
                    {paymentMode === "UPI"
                      ? "UPI transaction ID"
                      : "Transaction / UTR reference"}
                  </label>
                  <input
                    id="transaction-ref"
                    value={transactionRef}
                    maxLength={100}
                    onChange={(event) => setTransactionRef(event.target.value)}
                    placeholder="Enter the bank or UPI transaction reference"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="payment-proof"
                  className="mb-1.5 block text-sm font-medium text-slate-300"
                >
                  Payment proof <span className="text-rose-400">*</span>
                </label>
                <input
                  id="payment-proof"
                  type="file"
                  accept={PROOF_TYPES.join(",")}
                  onChange={handleProofChange}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                />
                <p className="mt-1 text-xs text-slate-500">
                  JPG, PNG, WEBP, or PDF. Maximum 3 MB.
                </p>
                {proof && !proofError && (
                  <p className="mt-1 text-xs text-emerald-300">{proof.name}</p>
                )}
                {proofError && (
                  <p role="alert" className="mt-1 text-xs text-rose-300">
                    {proofError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="settlement-remarks"
                  className="mb-1.5 block text-sm font-medium text-slate-300"
                >
                  Remarks (optional)
                </label>
                <textarea
                  id="settlement-remarks"
                  rows={2}
                  maxLength={300}
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          )}

          <label className="flex items-start gap-3 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-indigo-500"
            />
            <span>
              {action === "SEND_TO_REMITTER"
                ? `I confirm that ${formatInr(settlementAmount)} should be assigned to the selected remitter.`
                : `I confirm that ${formatInr(settlementAmount)} has already been paid and should be recorded.`}
            </span>
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-800 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              submitting ||
              !confirmed ||
              settlementAmount <= 0 ||
              (action === "SEND_TO_REMITTER" &&
                (remittersLoading ||
                  remitters.length === 0 ||
                  !userScheme.accountNumber))
            }
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Saving..."
              : action === "SEND_TO_REMITTER"
                ? "Send to Remitter"
                : "Mark as Done"}
          </button>
        </div>
      </form>
    </div>
  );
}
