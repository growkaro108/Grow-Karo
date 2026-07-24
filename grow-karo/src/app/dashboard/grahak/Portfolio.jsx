import React, { useState, useMemo, useCallback, useEffect, use } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowUpRight,
  ShieldCheck,
  X,
  Download,
  ImageOff,
  Maximize2,
  Trash2,
  Loader2,
} from "lucide-react";
import { TableRowLoader } from "@/loader/TableRowLoader";
import {
  getAllUsersScheme,
  withdrawUserScheme,
} from "../../../../services/grahakService";
import {
  allRounderMessage,
  confirmMessage,
  errorMessage,
} from "@/components/Message";
import { userContext } from "@/context/UserContext";

const currency = (val) => {
  const n = Number.parseFloat(val);
  return Number.isFinite(n)
    ? `₹ ${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    : "—";
};

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return Number.isNaN(d.getTime())
    ? val
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

const tableHeaderStyle =
  "px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap";
const tableCellStyle = "px-4 py-4 text-sm text-slate-600 whitespace-nowrap";

function BondThumb({ src, alt, size = 40, onExpand }) {
  const [errored, setErrored] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setErrored(false);
    setLoading(true);
  }, [src]);

  const dim = { width: size, height: size };

  if (errored || !src) {
    return (
      <div
        className="rounded-md bg-slate-100 flex items-center justify-center text-slate-400"
        style={dim}
      >
        <ImageOff size={Math.round(size * 0.4)} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onExpand?.();
      }}
      aria-label="View full-size image"
      className="relative rounded-md overflow-hidden border border-slate-100 bg-slate-100 group focus:outline-none focus:ring-2 focus:ring-indigo-400"
      style={dim}
    >
      {loading && (
        <div className="absolute inset-0 animate-pulse bg-slate-200" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        sizes={`${size}px`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setErrored(true);
          setLoading(false);
        }}
        className={`object-cover transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
        <Maximize2
          size={Math.round(size * 0.35)}
          className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        />
      </div>
    </button>
  );
}

function ImageLightbox({ bond, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  const mainImage = bond.bondImageURL?.[0] || "";

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    setImgError(false);
    setImgLoading(true);
  }, [mainImage]);

  const handleDownload = useCallback(async () => {
    if (!mainImage) return;
    setDownloading(true);
    try {
      const res = await fetch(mainImage);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${bond.bondNumber || "bond-image"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.log(`Exception while doing something: ${err}`);
      // window.open(mainImage, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  }, [mainImage, bond.bondNumber]);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${bond.bondNumber || "Bond"} image preview`}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1e293b" }}>
              {bond.bondNumber || "N/A"}
            </p>
            <p className="text-xs" style={{ color: "#64748b" }}>
              {bond.schemeName}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex items-center justify-center bg-slate-50 min-h-70">
          {imgError || !mainImage ? (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <ImageOff size={32} />
              <span className="text-xs">Image unavailable</span>
            </div>
          ) : (
            <div className="relative w-full h-80 max-h-[50vh]">
              {imgLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              )}
              <Image
                src={mainImage}
                alt={bond.bondNumber || "Bond Proof"}
                fill
                unoptimized
                sizes="(max-width: 640px) 100vw, 500px"
                onLoad={() => setImgLoading(false)}
                onError={() => {
                  setImgError(true);
                  setImgLoading(false);
                }}
                className={`object-contain rounded-lg transition-opacity duration-300 ${imgLoading ? "opacity-0" : "opacity-100"}`}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={imgError || !mainImage || downloading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Download size={16} />
            {downloading ? "Downloading…" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value, highlight = false }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <span
        className={`text-sm font-semibold tracking-tight ${highlight ? "text-emerald-600 font-bold" : "text-slate-700"}`}
      >
        {/* in case of payment date show each date in */}
        {value.constructor === Array
          ? value.map((date) => (
              <div key={date} className="flex flex-col justify-center">
                <span className="text-sm font-semibold tracking-tight">
                  {formatDate(date)}
                </span>
              </div>
            ))
          : (value ?? "—")}
      </span>
    </div>
  );
}

function BondDetailsPage({ bond, onBack, onExpandImage, onWithdraw }) {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const mainImage = bond.bondImageURL?.[0] || "";
  const isApproved = bond.isApproved;
  const handleWithdrawClick = async () => {
    const confirmed = await confirmMessage(
      "you want to withdraw this application?",
    );
    if (!confirmed) return;
    else {
      setIsWithdrawing(true);
      await onWithdraw(bond.userSchemeId);
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-sm font-semibold text-indigo-600 transition-colors duration-200 hover:text-indigo-700"
        >
          <ArrowLeft
            size={16}
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          />
          Back to holdings
        </button>

        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${bond.isApproved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
        >
          <ShieldCheck size={14} />{" "}
          {bond.isApproved ? "Active Asset" : "Pending Approval"}
        </span>
      </div>

      <div className="p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div
            onClick={onExpandImage}
            className="group relative h-28 w-28 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-transform duration-300 hover:scale-[1.02] self-center sm:self-start bg-slate-100 flex items-center justify-center"
          >
            {mainImage ? (
              <>
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-indigo-950/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <ArrowUpRight size={20} className="text-white drop-shadow" />
                </div>
                <img
                  src={mainImage}
                  alt={bond.bondNumber}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </>
            ) : (
              <ImageOff size={24} className="text-slate-400" />
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h3
              className={`text-xl tracking-tight text-slate-900 ${bond.bondNumber ? "font-bold" : "text-red-600 font-light"}`}
            >
              {isApproved && (bond.bondNumber || "Bond Not Generated Yet")}
            </h3>
            <div className="flex flex-col sm:flex-row md:justify-between justify-center mt-1">
              <p className="mt-0.5 text-sm font-medium text-slate-400">
                {bond.schemeName}
              </p>
              <span className="text-xs font-semibold text-emerald-600 border border-emerald-500 bg-emerald-50 rounded-xl px-2 py-1">
                + ₹ 7,978 profit
              </span>
            </div>

            <div
              className={`mt-6 grid grid-cols-2 gap-3 sm:grid-cols-${isApproved ? "4" : "3"}`}
            >
              {isApproved && (
                <DetailField
                  label="Paid Amount"
                  value={currency(bond.paidAmount)}
                />
              )}
              <DetailField
                label={isApproved ? "Remaining Amount" : "Amount Applied"}
                value={
                  isApproved
                    ? currency(bond.investmentAmount - bond.paidAmount)
                    : currency(bond.investmentAmount)
                }
              />
              <DetailField label="Tenure" value={`${bond.tenure} Days`} />
              <DetailField
                label="Profit %"
                value={
                  bond.profitPercentage != null
                    ? `${bond.profitPercentage}%`
                    : "—"
                }
                highlight={true}
              />
              <DetailField
                label="Payout Frequency"
                value={bond.payoutFrequency}
              />
              {isApproved && (
                <DetailField
                  label="Enrollment Date"
                  value={formatDate(bond.enrollmentDate)}
                />
              )}
              {!isApproved && !bond.paymentDates ? (
                <DetailField
                  label="Request Date"
                  value={formatDate(bond.requestDate)}
                />
              ) : (
                <DetailField
                  label="Payment Dates"
                  value={bond.paymentDates.map((date) => formatDate(date))}
                />
              )}
              <DetailField
                label="Maturity Value"
                value={currency(bond.maturityValue)}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Withdraw Actions Bar */}
        {!isApproved && (
          <div className="mt-8 flex justify-between items-center border-t border-slate-100 pt-6">
            {/* //request how much long ago was it made */}
            <p className="text-sm font-medium text-slate-400">
              Request on: {formatDate(bond.requestDate)}
            </p>
            <button
              onClick={handleWithdrawClick}
              disabled={isWithdrawing}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {isWithdrawing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              {isWithdrawing ? "Withdrawing..." : "Withdraw Request"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Portfolio({ holdings = [] }) {
  const [holding, setHolding] = useState(holdings);
  const [loading, setLoading] = useState(false);
  const [selectedBond, setSelectedBond] = useState(null);
  const [lightboxBond, setLightboxBond] = useState(null);
  const { authUser } = use(userContext);

  const sortedHoldings = useMemo(
    () =>
      [...holding].sort(
        (a, b) =>
          Number.parseFloat(b.investmentAmount || 0) -
          Number.parseFloat(a.investmentAmount || 0),
      ),
    [holding],
  );

  const openDetails = useCallback((bond) => setSelectedBond(bond), []);
  const closeDetails = useCallback(() => setSelectedBond(null), []);
  const openLightbox = useCallback((bond) => setLightboxBond(bond), []);
  const closeLightbox = useCallback(() => setLightboxBond(null), []);
  const fetchHoldings = useCallback(async () => {
    const userId = authUser?.id;
    if (!userId) return;
    try {
      setLoading(true);
      const response = await getAllUsersScheme(userId);
      // console.log(response);
      if (response.status === "success" && response.data) {
        setHolding(response.data);
      } else {
        allRounderMessage(response);
        setHolding([]);
      }
    } catch (error) {
      errorMessage("something went wrong");
      setHolding([]);
      console.error("Error fetching holdings:", error);
    } finally {
      setLoading(false);
    }
  }, [authUser?.id]); // Fixed dependency here

  useEffect(() => {
    let isMounted = true;

    // Only update state if the component hasn't unmounted or user hasn't switched mid-request
    if (isMounted) {
      fetchHoldings();
    }

    return () => {
      isMounted = false;
    };
  }, [fetchHoldings]);
  // Handle asset withdrawal
  const handleWithdrawRequest = useCallback(
    async (userSchemeId) => {
      try {
        const response = await withdrawUserScheme(userSchemeId, authUser?.id);
        console.log(response);
        allRounderMessage(response);

        if (response.status === "success") {
          // 2. Refresh local data set views cleanly
          await fetchHoldings();
          setSelectedBond(null);
        }
      } catch (error) {
        console.error("Failed to withdraw application:", error);
      }
    },
    [fetchHoldings, authUser?.id],
  );

  return (
    <div className="flex flex-col gap-6 p-1 sm:p-6 bg-slate-50 min-h-screen font-sans">
      {selectedBond ? (
        <BondDetailsPage
          bond={selectedBond}
          onBack={closeDetails}
          onExpandImage={() => openLightbox(selectedBond)}
          onWithdraw={handleWithdrawRequest}
        />
      ) : (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold" style={{ color: "#1e293b" }}>
            Your Bond Holdings
          </h3>
          <p className="text-sm mt-1 mb-4" style={{ color: "#64748b" }}>
            Click a row for full details, or click the image to view it
            full-size
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className={tableHeaderStyle}>Bond</th>
                  <th className={tableHeaderStyle}>Bond No.</th>
                  <th className={tableHeaderStyle}>Scheme Name</th>
                  <th className={tableHeaderStyle}>Invest Amount</th>
                  <th className={tableHeaderStyle}>Payout Cycle</th>
                  <th className={tableHeaderStyle}>Total Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <TableRowLoader loading={"Joined Scheme.."} colSpan={6} />
                ) : sortedHoldings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      No holdings available.
                    </td>
                  </tr>
                ) : (
                  sortedHoldings.map((bond, index) => (
                    <tr
                      key={bond.userSchemeId || index}
                      onClick={() => openDetails(bond)}
                      onKeyDown={(e) =>
                        (e.key === "Enter" || e.key === " ") &&
                        openDetails(bond)
                      }
                      tabIndex={0}
                      role="button"
                      aria-label={`View details for bond ${bond.bondNumber}`}
                      className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 outline-none transition-colors duration-150"
                    >
                      <td
                        className={tableCellStyle}
                        style={{ color: "#475569" }}
                      >
                        {
                          <BondThumb
                            src={bond.bondImageURL?.[0] || "./pending.png"}
                            alt={bond.bondNumber || "Proof"}
                            onExpand={() => openLightbox(bond)}
                          />
                        }
                      </td>
                      <td
                        className={`${tableCellStyle} font-semibold`}
                        style={{ color: "#1e293b" }}
                      >
                        {bond.bondNumber ||
                          (bond.isApproved ? "Approved" : "Pending")}
                      </td>
                      <td
                        className={tableCellStyle}
                        style={{ color: "#475569" }}
                      >
                        {bond.schemeName}
                      </td>
                      <td
                        className={`${tableCellStyle} font-semibold`}
                        style={{ color: "#334155" }}
                      >
                        {currency(bond.investmentAmount)}
                      </td>
                      <td
                        className={tableCellStyle}
                        style={{ color: "#475569" }}
                      >
                        {bond.payoutFrequency}
                      </td>
                      <td
                        className={tableCellStyle}
                        style={{ color: "#397299" }}
                      >
                        {/* show how much user pay for scheme in % */}
                        {(
                          (bond.paidAmount / bond.investmentAmount) *
                          100
                        ).toFixed(1)}{" "}
                        %
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lightboxBond && (
        <ImageLightbox bond={lightboxBond} onClose={closeLightbox} />
      )}
    </div>
  );
}
