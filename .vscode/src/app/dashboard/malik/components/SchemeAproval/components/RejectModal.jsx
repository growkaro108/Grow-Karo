import React from "react";

export default function RejectModal({
  rejectTarget,
  setRejectTarget,
  handleConfirmReject,
}) {
  if (!rejectTarget) return null;

  return (
    <div
      className="sea-overlay"
      onMouseDown={(e) =>
        e.target === e.currentTarget && setRejectTarget(null)
      }
    >
      <div
        className="sea-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sea-reject-heading"
      >
        <h3 className="sea-modal-title" id="sea-reject-heading">
          Reject this request?
        </h3>
        <p className="sea-modal-sub">
          {rejectTarget.name}&apos;s enrollment in {rejectTarget.schemeName}{" "}
          will be marked as rejected. This can&apos;t be undone from here.
        </p>
        <div className="sea-modal-actions">
          <button
            className="sea-btn sea-btn-ghost"
            onClick={() => setRejectTarget(null)}
          >
            Cancel
          </button>
          <button
            className="sea-btn sea-btn-danger"
            onClick={handleConfirmReject}
          >
            Reject request
          </button>
        </div>
      </div>
    </div>
  );
}
