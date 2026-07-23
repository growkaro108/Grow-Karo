import React, { useEffect, useRef } from "react";
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
  const modalRef = useRef(null);
  const today = new Date().toISOString().split("T")[0];

  const totalAmount = selectedRequest?.investmentAmount || 0;
  const numericPaid = Number(paidAmount) || 0;
  const remainingAmount = Math.max(0, totalAmount - numericPaid);
  const isOverpaid = numericPaid > totalAmount;
  const isValidAmount = paidAmount !== "" && numericPaid >= 0;

  const closeModal = () => {
    if (!submitting) setSelectedRequest(null);
  };

  // Escape to close, Enter (outside a textarea) to confirm
  useEffect(() => {
    if (!selectedRequest) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeModal();
      } else if (e.key === "Enter" && !submitting && isValidAmount) {
        // Avoid hijacking Enter from a textarea if one is ever added
        if (e.target.tagName !== "TEXTAREA") {
          handleConfirmApproval();
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
    isValidAmount,
    handleConfirmApproval,
    closeModal,
  ]);

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
        className="sea-modal"
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
          <br />
          {"Requset on. "}
          {selectedRequest.requestDate}
        </p>

        <div className="sea-row-line">
          <span>Required capital</span>
          <span className="sea-mono">{currency(totalAmount)}</span>
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

        <div className="sea-field">
          <label className="sea-label" htmlFor="sea-remaining-balance">
            Remaining balance
          </label>
          <input
            id="sea-remaining-balance"
            className="sea-input"
            disabled
            readOnly
            value={currency(remainingAmount)}
          />
          {isOverpaid && (
            <p className="sea-warning" role="alert">
              Paid amount is {currency(numericPaid - totalAmount)} over the
              required capital.
            </p>
          )}
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
            onClick={handleConfirmApproval}
            disabled={submitting || !isValidAmount}
          >
            {submitting ? "Approving..." : "Confirm approval"}
          </button>
        </div>
      </div>
    </div>
  );
}
