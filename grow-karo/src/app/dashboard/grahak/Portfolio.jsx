import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';

// Plain inline SVG icons — no external icon library dependency,
// so the component can't silently fail to render if a package is missing.
const XIcon = (props) => (
  <svg viewBox="0 0 24 24" width={props.size ?? 18} height={props.size ?? 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const DownloadIcon = (props) => (
  <svg viewBox="0 0 24 24" width={props.size ?? 16} height={props.size ?? 16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ImageOffIcon = (props) => (
  <svg viewBox="0 0 24 24" width={props.size ?? 16} height={props.size ?? 16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="2" x2="22" y2="22" />
    <path d="M10.41 10.41a2 2 0 1 1-2.83-2.83" />
    <line x1="13.5" y1="13.5" x2="6" y2="21" />
    <path d="M21 15V5a2 2 0 0 0-2-2H9" />
    <path d="M5 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10" />
  </svg>
);

const ArrowLeftIcon = (props) => (
  <svg viewBox="0 0 24 24" width={props.size ?? 18} height={props.size ?? 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const ExpandIcon = (props) => (
  <svg viewBox="0 0 24 24" width={props.size ?? 14} height={props.size ?? 14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

// Fallback sample data — swap this out for the `holdings` prop in real usage


const currency = (val) => {
  const n = parseFloat(val);
  return Number.isFinite(n) ? `₹${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—';
};

const formatDate = (val) => {
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? val : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const tableHeaderStyle = "px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap";
const tableCellStyle = "px-4 py-4 text-sm text-slate-600 whitespace-nowrap";

// Thumbnail used in the table — click opens the large lightbox (not the details page)
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
        <ImageOffIcon size={Math.round(size * 0.4)} />
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
      {loading && <div className="absolute inset-0 animate-pulse bg-slate-200" />}
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
        className={`object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
        <ExpandIcon size={Math.round(size * 0.35)} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
    </button>
  );
}

// Full-size image lightbox with a download action
function ImageLightbox({ bond, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    setImgError(false);
    setImgLoading(true);
  }, [bond.bondimage]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await fetch(bond.bondimage);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${bond.bondnumber}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.open(bond.bondimage, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  }, [bond]);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${bond.bondnumber} image preview`}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>{bond.bondnumber}</p>
            <p className="text-xs" style={{ color: '#64748b' }}>{bond.plan}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="p-6 flex items-center justify-center bg-slate-50 min-h-[280px]">
          {imgError ? (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <ImageOffIcon size={32} />
              <span className="text-xs">Image unavailable</span>
            </div>
          ) : (
            <div className="relative w-full h-[320px] max-h-[50vh]">
              {imgLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              )}
              <Image
                src={bond.bondimage}
                alt={bond.bondnumber}
                fill
                unoptimized
                sizes="(max-width: 640px) 100vw, 500px"
                onLoad={() => setImgLoading(false)}
                onError={() => {
                  setImgError(true);
                  setImgLoading(false);
                }}
                className={`object-contain rounded-lg transition-opacity duration-300 ${imgLoading ? 'opacity-0' : 'opacity-100'}`}
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
            disabled={imgError || downloading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <DownloadIcon size={16} />
            {downloading ? 'Downloading…' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  );
}


// Refactored Field using a clean grid card layout
function DetailField({ label, value, highlight = false }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <span className={`text-sm font-semibold tracking-tight ${highlight ? 'text-emerald-600 font-bold' : 'text-slate-700'}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

// Senior-Designed Detail View via pure Tailwind CSS
function BondDetailsPage({ bond, onBack, onExpandImage }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out">

      {/* Action Header bar */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-sm font-semibold text-indigo-600 transition-colors duration-200 hover:text-indigo-700"
        >
          <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
          Back to holdings
        </button>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <ShieldCheck size={14} /> Active Asset
        </span>
      </div>

      <div className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">

          {/* Enhanced Interactive Image Frame */}
          <div
            onClick={onExpandImage}
            className="group relative h-28 w-28 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-transform duration-300 hover:scale-[1.02] self-center sm:self-start"
          >
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-indigo-950/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <ArrowUpRight size={20} className="text-white drop-shadow" />
            </div>
            <img
              src={bond.bondimage}
              alt={bond.bondnumber}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          {/* Typography Header & Details Grid */}
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              {bond.bondnumber}
            </h3>
            <p className="mt-0.5 text-sm font-medium text-slate-400">
              {bond.plan}
            </p>

            {/* Clean 4-Column Metric Grid */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <DetailField label="Invest Amount" value={currency(bond.investamount)} />
              <DetailField label="Tenure" value={bond.tenure} />
              <DetailField label="Payout Frequency" value={bond.payoutcycle} />
              <DetailField label="Profit %" value={bond.profitpercentage != null ? `${bond.profitpercentage}%` : '—'} highlight={true} />
              <DetailField label="Investment Date" value={formatDate(bond.investementdate)} />
              <DetailField label="Maturity Date" value={formatDate(bond.maturitydate)} />
              <DetailField label="Next Profit Date" value={formatDate(bond.profitdate)} />
              <DetailField label="Per Annum Est." value={currency(bond.perannum)} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function Portfolio({ holdings }) {
  const [selectedBond, setSelectedBond] = useState(null); // drives the details page
  const [lightboxBond, setLightboxBond] = useState(null); // drives the full-image overlay

  const sortedHoldings = useMemo(
    () => [...holdings].sort((a, b) => parseFloat(b.investamount) - parseFloat(a.investamount)),
    [holdings]
  );

  const openDetails = useCallback((bond) => setSelectedBond(bond), []);
  const closeDetails = useCallback(() => setSelectedBond(null), []);
  const openLightbox = useCallback((bond) => setLightboxBond(bond), []);
  const closeLightbox = useCallback(() => setLightboxBond(null), []);

  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-50 min-h-screen font-sans">
      {selectedBond ? (
        <BondDetailsPage
          bond={selectedBond}
          onBack={closeDetails}
          onExpandImage={() => openLightbox(selectedBond)}
        />
      ) : (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold" style={{ color: '#1e293b' }}>Your Bond Holdings</h3>
          <p className="text-sm mt-1 mb-4" style={{ color: '#64748b' }}>
            Click a row for full details, or click the image to view it full-size
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className={tableHeaderStyle}>Bond Image</th>
                  <th className={tableHeaderStyle}>Bond No.</th>
                  <th className={tableHeaderStyle}>Plan</th>
                  <th className={tableHeaderStyle}>Invest Amount</th>
                  <th className={tableHeaderStyle}>Maturity Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedHoldings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                      No holdings available.
                    </td>
                  </tr>
                ) : sortedHoldings.map((bond, index) => (
                  <tr
                    key={bond.bondnumber ?? index}
                    onClick={() => openDetails(bond)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openDetails(bond)}
                    tabIndex={0}
                    role="button"
                    aria-label={`View details for bond ${bond.bondnumber}`}
                    className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 outline-none transition-colors duration-150"
                  >
                    <td className={tableCellStyle} style={{ color: '#475569' }}>
                      <BondThumb src={bond.bondimage} alt={bond.bondnumber} onExpand={() => openLightbox(bond)} />
                    </td>
                    <td className={`${tableCellStyle} font-semibold`} style={{ color: '#1e293b' }}>{bond.bondnumber}</td>
                    <td className={tableCellStyle} style={{ color: '#475569' }}>{bond.plan}</td>
                    <td className={`${tableCellStyle} font-semibold`} style={{ color: '#334155' }}>{currency(bond.investamount)}</td>
                    <td className={tableCellStyle} style={{ color: '#475569' }}>{formatDate(bond.maturitydate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lightboxBond && <ImageLightbox bond={lightboxBond} onClose={closeLightbox} />}
    </div>
  );
}