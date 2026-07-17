import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { allRounderMessage } from "@/components/Message";
import { ListFilterPlus } from "lucide-react";
import { getAllUserRequests } from "../../../../../services/malikService";

// Mock API calls - replace these with your actual services/axios instances
const mockFetchRequests = async () =>
    new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                {
                    id: "req_001",
                    userName: "Fatima Sheikh",
                    userEmail: "fatima@example.com",
                    phone: "9812345670",
                    schemeName: "Sarthi Deposit",
                    capitalThreshold: 25999,
                    status: "pending",
                },
                {
                    id: "req_002",
                    userName: "Marcus Vance",
                    userEmail: "marcus@example.com",
                    phone: "9874653470",
                    schemeName: "Dhirghayu",
                    capitalThreshold: 60000,
                    status: "pending",
                },
                {
                    id: "req_003",
                    userName: "Ananya Rao",
                    userEmail: "ananya@example.com",
                    phone: "9900011223",
                    schemeName: "Sarthi Deposit",
                    capitalThreshold: 15000,
                    status: "approved",
                },
                {
                    id: "req_004",
                    userName: "Devika Kulkarni",
                    userEmail: "devika@example.com",
                    phone: "9765432109",
                    schemeName: "Dhirghayu",
                    capitalThreshold: 40000,
                    status: "withdrawn",
                },
            ]);
        }, 900);
    });

const STATUS_STYLES = {
    pending: { label: "Pending", color: "var(--pending)", bg: "var(--pending-soft)" },
    approved: { label: "Approved", color: "var(--success)", bg: "var(--success-soft)" },
    rejected: { label: "Rejected", color: "var(--danger)", bg: "var(--danger-soft)" },
    withdrawn: { label: "Withdrawn", color: "var(--text-muted)", bg: "rgba(140,150,172,0.14)" },
};

const FILTER_TABS = [
    { key: "all", label: "All", color: "var(--gold)", bg: "var(--gold-soft)" },
    { key: "pending", label: "Pending", ...STATUS_STYLES.pending },
    { key: "approved", label: "Approved", ...STATUS_STYLES.approved },
    { key: "rejected", label: "Rejected", ...STATUS_STYLES.rejected },
    { key: "withdrawn", label: "Withdraw request", ...STATUS_STYLES.withdrawn },
];

const currency = (n) => `\u20b9${Number(n || 0).toLocaleString("en-IN")}`;

const initials = (name) =>
    name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

export default function SchemeApproval() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [paidAmount, setPaidAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const [showFilter, setShowFilter] = useState(false)
    const inputRef = useRef(null);
    const toastTimer = useRef(null);

    const showToast = useCallback((type, text) => {
        clearTimeout(toastTimer.current);
        setToast({ type, text });
        toastTimer.current = setTimeout(() => setToast(null), 3200);
    }, []);

    const loadRequests = useCallback(async () => {
        try {
            setLoading(true);
            // const data = await mockFetchRequests();
            const response = await getAllUserRequests();
            if (response.status !== "success") {
                allRounderMessage(response)
                console.log(response)
            } else {
                setRequests(response.data);
            }
        } catch (error) {
            console.error("Error loading enrollment requests:", error);
            showToast("error", "Couldn't load requests. Try again.");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadRequests();
        return () => clearTimeout(toastTimer.current);
    }, [loadRequests]);

    // Close modals on Escape, autofocus the amount field on open
    useEffect(() => {
        if (!selectedRequest) return;
        const onKey = (e) => e.key === "Escape" && setSelectedRequest(null);
        window.addEventListener("keydown", onKey);
        inputRef.current?.focus();
        return () => window.removeEventListener("keydown", onKey);
    }, [selectedRequest]);

    const handleOpenApproval = (request) => {
        setSelectedRequest(request);
        setPaidAmount("");
    };

    const totalAmount = selectedRequest ? selectedRequest.investmentAmount : 0;
    const numericPaid = Number(paidAmount) || 0;
    const remainingAmount = selectedRequest ? Math.max(0, totalAmount - numericPaid) : 0;
    const isOverpaid = selectedRequest ? numericPaid > totalAmount : false;
    const isValidAmount = paidAmount !== "" && numericPaid >= 0;

    const handleConfirmApproval = async () => {
        if (!selectedRequest || !isValidAmount) {
            showToast("error", "Enter a valid paid amount first.");
            return;
        }
        if (!selectedRequest.userSchemeId) {
            showToast("error", "User scheme ID not found.");
            return;
        }
        if (isOverpaid) {
            showToast("error", "Amount cannot be greater than total amount.");
            return;
        }

        const payload = {
            userSchemeId: selectedRequest.userSchemeId,
            amount: numericPaid,
        };
        let response = null;
        try {
            setSubmitting(true);
            // response = await approveUserScheme(payload);
            // console.log(response);
            // if (response?.status !== "success") {
            //     return;
            // }

            setRequests((prev) =>
                prev.map((r) =>
                    r.userSchemeId === selectedRequest.userSchemeId ? { ...r, status: "approved" } : r
                )
            );
            showToast("success", `${selectedRequest.name}'s enrollment was approved.`);
            setSelectedRequest(null);
        } catch (error) {
            console.error("Approval action failed:", error);
            showToast("error", "Approval failed. Please try again.");
        } finally {
            allRounderMessage(response);
            setSubmitting(false);
        }
    };

    const handleConfirmReject = async () => {
        if (!rejectTarget) return;
        try {
            // await rejectUserScheme(rejectTarget.id);
            setRequests((prev) =>
                prev.map((r) => (r.id === rejectTarget.id ? { ...r, status: "rejected" } : r))
            );
            showToast("success", `Request from ${rejectTarget.name} was rejected.`);
        } catch (error) {
            console.error("Rejection failed:", error);
            showToast("error", "Rejection failed. Please try again.");
        } finally {
            setRejectTarget(null);
        }
    };

    const filteredRequests = useMemo(() => {
        const q = query.trim().toLowerCase();
        return requests?.filter((r) => {
            const matchesStatus = statusFilter === "all" || r.status.toLowerCase() === statusFilter;
            const matchesQuery =
                !q || r.name.toLowerCase().includes(q) || r.schemeName.toLowerCase().includes(q);
            return matchesStatus && matchesQuery;
        });
    }, [requests, query, statusFilter]);

    const pendingCount = requests.filter((r) => r.status.toLowerCase() === "pending").length;

    const statusCounts = useMemo(() => {
        const counts = { all: requests.length };
        requests.forEach((r) => {
            counts[r.status.toLowerCase()] = (counts[r.status.toLowerCase()] || 0) + 1;
        });
        return counts;
    }, [requests]);

    return (
        <div className="sea-root">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');

                .sea-root {
                    --bg: #0b1120;
                    --surface: #121b2e;
                    --surface-alt: #17233b;
                    --border: #26314a;
                    --text: #e7eaf2;
                    --text-muted: #8c96ac;
                    --gold: #cb9b3e;
                    --gold-soft: rgba(203,155,62,0.14);
                    --success: #3fa796;
                    --success-soft: rgba(63,167,150,0.14);
                    --danger: #e15544;
                    --danger-soft: rgba(225,85,68,0.14);
                    --pending: #d9a441;
                    --pending-soft: rgba(217,164,65,0.14);

                    background: var(--bg);
                    color: var(--text);
                    font-family: 'Inter', sans-serif;
                    min-height: 100vh;
                    padding: 32px 28px 60px;
                    box-sizing: border-box;
                }
                .sea-root *, .sea-root *::before, .sea-root *::after { box-sizing: border-box; }
                .sea-root ::selection { background: var(--gold-soft); color: var(--text); }

                .sea-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }

                .sea-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 28px; flex-wrap: wrap; }
                .sea-title { font-family: 'Fraunces', serif; font-weight: 600; font-size: 28px; letter-spacing: -0.01em; margin: 0 0 6px; }
                .sea-subtitle { color: var(--text-muted); font-size: 12px; margin-top: -3px; }
                .sea-pill-count { display: inline-flex; align-items: center; gap: 6px; background: var(--gold-soft); color: var(--gold); border: 1px solid rgba(203,155,62,0.35); padding: 5px 12px; border-radius: 100px; font-size: 12.5px; font-weight: 600; }

                .sea-search { background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 9px 14px; border-radius: 8px; font-size: 13.5px; min-width: 240px; font-family: 'Inter', sans-serif; }
                .sea-search::placeholder { color: var(--text-muted); }
                .sea-search:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-soft); }

                .sea-filter-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
                .sea-filter-btn { display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: 100px; border: 1px solid var(--border); background: transparent; color: var(--text-muted); font-size: 12.5px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.15s ease; }
                .sea-filter-btn:hover { color: var(--text); border-color: var(--text-muted); }
                .sea-filter-count { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--text-muted); background: rgba(255,255,255,0.06); padding: 1px 6px; border-radius: 100px; }

                .sea-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }

                table.sea-table { width: 100%; border-collapse: collapse; text-align: left; }
                .sea-table thead th { padding: 14px 16px; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); font-weight: 600; border-bottom: 1px solid var(--border); background: var(--surface-alt); }
                .sea-table tbody td { padding: 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
                .sea-table tbody tr:last-child td { border-bottom: none; }
                .sea-table tbody tr { transition: background 0.15s ease; }
                .sea-table tbody tr:hover { background: rgba(255,255,255,0.02); }

                .sea-index { font-family: 'Fraunces', serif; color: var(--text-muted); font-size: 13px; width: 46px; }

                .sea-avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--gold-soft); color: var(--gold); display: inline-flex; align-items: center; justify-content: center; font-size: 12.5px; font-weight: 600; flex-shrink: 0; }
                .sea-user-row { display: flex; align-items: center; gap: 12px; }
                .sea-user-name { font-weight: 600; font-size: 14px; }
                .sea-user-meta { color: var(--text-muted); font-size: 12px; margin-top: 2px; }

                .sea-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 100px; font-size: 11.5px; font-weight: 600; letter-spacing: 0.02em; }
                .sea-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

                .sea-btn { border: none; padding: 8px 14px; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: filter 0.15s ease, transform 0.1s ease; }
                .sea-btn:hover { filter: brightness(1.08); }
                .sea-btn:active { transform: translateY(1px); }
                .sea-btn:disabled { opacity: 0.5; cursor: not-allowed; filter: none; }
                .sea-btn-approve { background: var(--success); color: #062420; }
                .sea-btn-reject { background: transparent; color: var(--danger); border: 1px solid rgba(225,85,68,0.4); }
                .sea-btn-reject:hover { background: var(--danger-soft); }
                .sea-btn-primary { background: var(--gold); color: #241a05; }
                .sea-btn-ghost { background: transparent; color: var(--text-muted); border: 1px solid var(--border); }
                .sea-btn-ghost:hover { color: var(--text); border-color: var(--text-muted); }
                .sea-btn-danger { background: var(--danger); color: #2a0904; }

                .sea-empty { padding: 64px 24px; text-align: center; color: var(--text-muted); }
                .sea-empty-title { font-family: 'Fraunces', serif; color: var(--text); font-size: 18px; margin: 0 0 6px; }

                .sea-skel-row td { padding: 16px; }
                .sea-skel { height: 14px; border-radius: 4px; background: linear-gradient(90deg, var(--surface-alt) 25%, rgba(255,255,255,0.05) 50%, var(--surface-alt) 75%); background-size: 200% 100%; animation: sea-shimmer 1.4s ease-in-out infinite; }
                @keyframes sea-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

                .sea-overlay { position: fixed; inset: 0; background: rgba(5,8,16,0.72); backdrop-filter: blur(2px); display: flex; justify-content: center; align-items: center; padding: 20px; z-index: 50; animation: sea-fade-in 0.15s ease; }
                @keyframes sea-fade-in { from { opacity: 0; } to { opacity: 1; } }
                .sea-modal { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; width: 420px; max-width: 100%; padding: 26px; }
                .sea-modal-title { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 600; margin: 0 0 4px; }
                .sea-modal-sub { color: var(--text-muted); font-size: 13px; margin: 0 0 18px; }
                .sea-row-line { display: flex; justify-content: space-between; align-items: baseline; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 13.5px; }
                .sea-row-line span:first-child { color: var(--text-muted); }

                .sea-field { margin: 18px 0 6px; }
                .sea-label { display: block; font-size: 12.5px; color: var(--text-muted); margin-bottom: 7px; font-weight: 500; }
                .sea-input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 14.5px; font-family: 'IBM Plex Mono', monospace; }
                .sea-input:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-soft); }
                .sea-input[disabled] { color: var(--text-muted); background: var(--surface-alt); }
                .sea-warning { color: var(--pending); font-size: 12px; margin-top: 8px; }

                .sea-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }

                .sea-toast { position: fixed; bottom: 24px; right: 24px; padding: 13px 18px; border-radius: 10px; font-size: 13.5px; font-weight: 500; color: var(--text); border: 1px solid var(--border); background: var(--surface-alt); box-shadow: 0 8px 24px rgba(0,0,0,0.35); z-index: 60; animation: sea-toast-in 0.2s ease; max-width: 320px; }
                @keyframes sea-toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .sea-toast-success { border-color: rgba(63,167,150,0.4); }
                .sea-toast-error { border-color: rgba(225,85,68,0.4); }

                @media (max-width: 720px) {
                    .sea-table thead { display: none; }
                    .sea-table, .sea-table tbody, .sea-table tr, .sea-table td { display: block; width: 100%; }
                    .sea-table tr { padding: 14px 16px; border-bottom: 1px solid var(--border); }
                    .sea-table td { padding: 4px 0; border: none; }
                    .sea-index { display: none; }
                }
            `}</style>

            <div className="sea-header">
                <div>
                    <h2 className="sea-title">Scheme Enrollment Ledger</h2>
                    <p className="sea-subtitle">Review capital commitments and confirm enrollments.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {pendingCount > 0 && (
                        <span className="sea-pill-count">{pendingCount} awaiting review</span>
                    )}
                    {/* //filter button */}
                    <button className="sea-btn sea-btn-success hover:scale-105 transition-all duration-200 ease-in-out cursor-pointer " title="Filter By Statuses"
                        onClick={() => setShowFilter(!showFilter)}>
                        {/* <Filter size={15} /> */}
                        <ListFilterPlus size={17} />
                    </button>
                    <input
                        className="sea-search"
                        placeholder="Search name or scheme..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search requests"
                    />

                </div>
            </div>

            {showFilter && <div className="sea-filter-bar " role="tablist" aria-label="Filter by status">
                {FILTER_TABS.map((tab) => {
                    const isActive = statusFilter === tab.key;
                    const count = statusCounts[tab.key] || 0;
                    return (
                        <button
                            key={tab.key}
                            role="tab"
                            aria-selected={isActive}
                            className="sea-filter-btn"
                            onClick={() => setStatusFilter(tab.key)}
                            style={
                                isActive
                                    ? { color: tab.color, background: tab.bg, borderColor: tab.color }
                                    : undefined
                            }
                        >
                            {tab.label}
                            <span className="sea-filter-count" style={isActive ? { color: tab.color } : undefined}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>}

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
                                        <div className="sea-skel" style={{ width: `${70 - i * 8}%` }} />
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
                                const status = STATUS_STYLES[req.status.toLowerCase()] || STATUS_STYLES.pending;
                                return (
                                    <tr key={idx + 1}>
                                        <td className="sea-index">No. {String(idx + 1).padStart(3, "0")}</td>
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
                                            {req.status.toLowerCase() === "pending" || req.status.toLowerCase() === "PENDING" ? (
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
                                            ) : (
                                                <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                                                    &mdash;
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>

            {/* Approval & calculation modal */}
            {selectedRequest && (
                <div
                    className="sea-overlay"
                    onMouseDown={(e) => e.target === e.currentTarget && setSelectedRequest(null)}
                >
                    <div className="sea-modal" role="dialog" aria-modal="true" aria-labelledby="sea-modal-heading">
                        <h3 className="sea-modal-title" id="sea-modal-heading">
                            Confirm approval
                        </h3>
                        <p className="sea-modal-sub">
                            {selectedRequest.name} &middot; {selectedRequest.schemeName}
                        </p>

                        <div className="sea-row-line">
                            <span>Required capital</span>
                            <span className="sea-mono">{currency(totalAmount)}</span>
                        </div>

                        <div className="sea-field">
                            <label className="sea-label" htmlFor="sea-paid-amount">
                                Amount paid (\u20b9)
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
                            />
                        </div>

                        <div className="sea-field">
                            <label className="sea-label">Remaining balance</label>
                            <input className="sea-input" disabled value={currency(remainingAmount)} />
                            {isOverpaid && (
                                <p className="sea-warning">
                                    Paid amount is {currency(numericPaid - totalAmount)} over the required capital.
                                </p>
                            )}
                        </div>

                        <div className="sea-modal-actions">
                            <button
                                className="sea-btn sea-btn-ghost"
                                onClick={() => setSelectedRequest(null)}
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
            )}

            {/* Reject confirmation modal */}
            {rejectTarget && (
                <div
                    className="sea-overlay"
                    onMouseDown={(e) => e.target === e.currentTarget && setRejectTarget(null)}
                >
                    <div className="sea-modal" role="dialog" aria-modal="true" aria-labelledby="sea-reject-heading">
                        <h3 className="sea-modal-title" id="sea-reject-heading">
                            Reject this request?
                        </h3>
                        <p className="sea-modal-sub">
                            {rejectTarget.name}&apos;s enrollment in {rejectTarget.schemeName} will be marked as
                            rejected. This can&apos;t be undone from here.
                        </p>
                        <div className="sea-modal-actions">
                            <button className="sea-btn sea-btn-ghost" onClick={() => setRejectTarget(null)}>
                                Cancel
                            </button>
                            <button className="sea-btn sea-btn-danger" onClick={handleConfirmReject}>
                                Reject request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className={`sea-toast sea-toast-${toast.type}`} role="status">
                    {toast.text}
                </div>
            )}
        </div>
    );
}