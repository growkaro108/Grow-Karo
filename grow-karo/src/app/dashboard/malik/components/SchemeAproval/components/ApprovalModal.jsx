import React, { useCallback, useEffect, useRef, useState } from "react";
import { currency } from "./constants";

export default function ApprovalModal({
  selectedRequest,
  setSelectedRequest,
  paidAmount,
  setPaidAmount,
  paidDate,
  setPaidDate,
  submitting,
  handleConfirmApproval,
  inputRef,
}) {
  const [amountFrom, setAmountFrom] = useState("");
  const [submitTo, setSubmitTo] = useState("");
  const [totalInterestPercentage, setTotalInterestPercentage] = useState(
    selectedRequest?.profitPercentage == null
      ? ""
      : String(selectedRequest.profitPercentage),
  );
  const [tenureMonths, setTenureMonths] = useState(
    selectedRequest?.tenureMonths == null
      ? ""
      : String(selectedRequest.tenureMonths),
  );

  const modalRef = useRef(null);
  const today = new Date().toISOString().split("T")[0];
  // // const existingPaidAmount = selectedRequest?.paidAmount || 0;
  // const totalAmount =
  //   selectedRequest?.investmentAmount - existingPaidAmount || 0;
  const numericPaid = Number(paidAmount) || 0;
  // // const remainingAmount = Math.max(0, totalAmount - numericPaid);
  // const isOverpaid = numericPaid > totalAmount;
  const isValidAmount = paidAmount !== "" && numericPaid >= 0;
  const isPension = selectedRequest?.planType === "PENSION";
  const isValidPensionTerms =
    !isPension ||
    (totalInterestPercentage !== "" &&
      Number.isFinite(Number(totalInterestPercentage)) &&
      Number(totalInterestPercentage) >= 0 &&
      tenureMonths !== "" &&
      Number.isInteger(Number(tenureMonths)) &&
      Number(tenureMonths) > 0);
  const canConfirm =
    isValidAmount &&
    isValidPensionTerms &&
    amountFrom.trim() !== "" &&
    submitTo.trim() !== "";

  const closeModal = useCallback(() => {
    if (!submitting) setSelectedRequest(null);
  }, [setSelectedRequest, submitting]);

  // Escape to close, Enter (outside a textarea) to confirm
  useEffect(() => {
    if (!selectedRequest) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeModal();
      } else if (
        e.key === "Enter" &&
        !submitting &&
        canConfirm
      ) {
        // Avoid hijacking Enter from a textarea if one is ever added
        if (e.target.tagName !== "TEXTAREA") {
          handleConfirmApproval(
            submitTo,
            amountFrom,
            totalInterestPercentage,
            tenureMonths,
          );
        }
      } else if (e.key === "Tab") {
        // Basic focus trap
        const focusable = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedRequest,
    submitting,
    canConfirm,
    submitTo,
    amountFrom,
    totalInterestPercentage,
    tenureMonths,
    handleConfirmApproval,
    closeModal,
  ]);

  function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  // Lock background scroll while modal is open
  useEffect(() => {
    if (!selectedRequest) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [selectedRequest]);

  if (!selectedRequest) return null;

  return (
    <div
      className="sea-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div
        className="sea-modal gap-y-0.5"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sea-modal-heading"
      >
        <h3 className="sea-modal-title" id="sea-modal-heading">
          Confirm approval
        </h3>
        <p className="sea-modal-sub">
          {selectedRequest.name} &middot; {selectedRequest.schemeName}
          {!selectedRequest.isApproved ? (
            <>
              <br />
              {"Requset on. "}
              {formatDateTime(selectedRequest.requestDate)}
            </>
          ) : (
            <>
              <br />
              {"Last Payment on. "}
              {selectedRequest?.paymentDates &&
                selectedRequest.paymentDates.length > 0 &&
                (() => {
                  const lastDate =
                    selectedRequest.paymentDates[
                    selectedRequest.paymentDates.length - 1
                    ];
                  return lastDate
                    ? new Date(lastDate).toLocaleDateString()
                    : "";
                })()}
            </>
          )}
        </p>

        <div className="sea-row-line">
          {/* <span>Required {existingPaidAmount && "to fill the "}capital</span> */}
          <span className="sea-mono">
            Requested Amount: {currency(paidAmount)}
          </span>
        </div>

        <div className="sea-field">
          <label className="sea-label" htmlFor="sea-paid-amount">
            Amount paid (₹)
          </label>
          <input
            id="sea-paid-amount"
            ref={inputRef}
            className="sea-input"
            type="number"
            min="0"
            inputMode="decimal"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            placeholder="0"
            disabled={submitting}
          />
        </div>

        <div className="sea-field">
          <label className="sea-label" htmlFor="sea-paid-amount-date">
            Amount paid Date
          </label>
          <input
            id="sea-paid-amount-date"
            className="sea-input"
            type="date"
            value={paidDate}
            max={today}
            onChange={(e) => setPaidDate(e.target.value)}
            disabled={submitting}
          />
        </div>
        {isPension && (
          <>
            <div className="sea-field">
              <label className="sea-label" htmlFor="sea-monthly-interest">
                Monthly interest rate (%)
              </label>
              <input
                id="sea-monthly-interest"
                className="sea-input"
                type="number"
                min="0"
                step="0.01"
                value={totalInterestPercentage}
                onChange={(e) => setTotalInterestPercentage(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            <div className="sea-field">
              <label className="sea-label" htmlFor="sea-tenure-months">
                Bond term (months)
              </label>
              <input
                id="sea-tenure-months"
                className="sea-input"
                type="number"
                min="1"
                step="1"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            <p className="sea-modal-sub">
              Monthly interest:{" "}
              {currency((numericPaid * Number(totalInterestPercentage || 0)) / 100)}
              {" · Total over term: "}
              {currency(
                (numericPaid * Number(totalInterestPercentage || 0) *
                  Number(tenureMonths || 0)) /
                  100,
              )}
              . Interest is scheduled monthly; principal is returned separately
              at maturity.
            </p>
          </>
        )}
        <div className="sea-field">
          <label className="sea-label" htmlFor="sea-paid-amount-from">
            Amount From
          </label>
          <input
            id="sea-paid-amount-from"
            className="sea-input"
            type="text"
            placeholder="e.g: Sonu Sah"
            value={amountFrom}
            onChange={(e) => setAmountFrom(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="sea-field">
          <label className="sea-label" htmlFor="sea-paid-submit-to">
            Amount submitted to
          </label>
          <input
            id="sea-paid-submit-to"
            className="sea-input"
            type="text"
            placeholder="e.g: Prince Kumar"
            value={submitTo}
            onChange={(e) => setSubmitTo(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="sea-field">
          {/* <label className="sea-label" htmlFor="sea-remaining-balance">
            Remaining balance
          </label>
          <input
            id="sea-remaining-balance"
            className="sea-input"
            disabled
            readOnly
            value={currency(remainingAmount)}
          /> */}
          {/* {isOverpaid && (
            <p className="sea-warning" role="alert">
              Paid amount is {currency(numericPaid - totalAmount)} over the
              required capital.
            </p>
          )} */}
        </div>

        <div className="sea-modal-actions">
          <button
            className="sea-btn sea-btn-ghost"
            onClick={closeModal}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="sea-btn sea-btn-primary"
            onClick={() =>
              handleConfirmApproval(
                submitTo,
                amountFrom,
                totalInterestPercentage,
                tenureMonths,
              )
            }
            disabled={submitting || !canConfirm}
          >
            {submitting ? "Approving..." : "Confirm approval"}
          </button>
        </div>
      </div>
    </div>
  );
}
