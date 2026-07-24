import React from "react";
import { STATUS_STYLES, FILTER_TABS, currency, initials } from "./constants";

function ActionButton({
  status,
  handleOpenApproval,
  setRejectTarget,
  handleOpenAddBond,
  req,
}) {
  const isfullPaid = req.investmentAmount - req.paidAmount === 0;
  if (status === "pending") {
    return (
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          className="sea-btn sea-btn-approve"
          onClick={() => handleOpenApproval(req)}
        >
          Approve
        </button>
        <button
          className="sea-btn sea-btn-reject"
          onClick={() => setRejectTarget(req)}
        >
          Reject
        </button>
      </div>
    );
  }

  if (status === "active") {
    return (
      <div style={{ display: "flex", gap: "8px" }}>
        {!isfullPaid && (
          <button
            className="sea-btn sea-btn-addbond"
            onClick={() => handleOpenApproval(req)}
          >
            Add amount
          </button>
        )}
        <button
          className="sea-btn sea-btn-approve"
          onClick={() => handleOpenAddBond(req)}
        >
          Add Bond
        </button>
      </div>
    );
  }

  return (
    <span
      style={{
        color: "var(--text-muted)",
        fontSize: "13px",
      }}
    >
      &mdash;
    </span>
  );
}

export default function SchemeTable({
  loading,
  filteredRequests,
  query,
  statusFilter,
  handleOpenApproval,
  setRejectTarget,
  handleOpenAddBond,
}) {
  return (
    <div className="sea-card">
      <table className="sea-table">
        <thead>
          <tr>
            <th></th>
            <th>Applicant</th>
            <th>Scheme</th>
            <th>Capital required</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading &&
            [1, 2, 3].map((i) => (
              <tr className="sea-skel-row" key={i}>
                <td colSpan={6}>
                  <div
                    className="sea-skel"
                    style={{ width: `${70 - i * 8}%` }}
                  />
                </td>
              </tr>
            ))}

          {!loading && filteredRequests.length === 0 && (
            <tr>
              <td colSpan={6}>
                <div className="sea-empty">
                  <p className="sea-empty-title">No requests here</p>
                  <p>
                    {query
                      ? "No requests match your search. Try a different name or scheme."
                      : statusFilter === "all"
                        ? "New enrollment requests will appear here for review."
                        : `No ${FILTER_TABS.find((t) => t.key === statusFilter)?.label.toLowerCase()} requests right now.`}
                  </p>
                </div>
              </td>
            </tr>
          )}

          {!loading &&
            filteredRequests.map((req, idx) => {
              const status =
                STATUS_STYLES[req.status.toLowerCase()] ||
                STATUS_STYLES.pending;
              return (
                <tr key={req?.userSchemeId}>
                  <td className="sea-index">
                    No. {String(idx + 1).padStart(3, "0")}
                  </td>
                  <td>
                    <div className="sea-user-row">
                      <div className="sea-avatar">{initials(req.name)}</div>
                      <div>
                        <div className="sea-user-name">{req.name}</div>
                        <div className="sea-user-meta">+91 {req.phone}</div>
                        <div className="sea-user-meta">{req.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{req.schemeName}</td>
                  <td className="sea-mono">{currency(req.investmentAmount)}</td>
                  <td>
                    <span
                      className="sea-badge"
                      style={{ color: status.color, background: status.bg }}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td>
                    <ActionButton
                      req={req}
                      status={req.status.toLowerCase()}
                      handleOpenApproval={handleOpenApproval}
                      setRejectTarget={setRejectTarget}
                      handleOpenAddBond={handleOpenAddBond}
                    />
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
