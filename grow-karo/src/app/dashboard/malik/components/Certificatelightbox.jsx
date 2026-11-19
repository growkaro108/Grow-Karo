import React, {
  lazy,
  memo,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { X, FileText, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { resolveMediaUrl } from "../../../../api/apiClient";

// certRef is passed as a normal prop and the button uses browser-only libs,
// so skip SSR.
const BondDownloadButton = dynamic(() => import("./BondDownloadButton.jsx"), {
  ssr: false,
  loading: () => null,
});

const CERTIFICATES = {
  PENSION: {
    Component: lazy(() => import("@/certificate/PensionCertificate.jsx")),
    props: { profilePhoto: "/profile.jpg", stampUrl: "/stamp.png" },
  },
  SIP: {
    Component: lazy(() => import("./SIPBondCertificate.jsx")),
    props: { profilePhoto: "/profile.jpg", stampUrl: "/stamp.png" },
  },
  DAILY_DEPOSIT: {
    Component: lazy(() => import("@/certificate/DailyDepositCertificate.jsx")),
    props: { stampUrl: "/stamp-removebg.png" },
    needsUserInfo: true,
  },
  QUARTERLY: {
    Component: lazy(() => import("@/certificate/QuaterlyplanCertificate.jsx")),
    props: { stampUrl: "/stamp-removebg.png" },
    needsUserInfo: true,
  },
  DEFAULT: {
    Component: lazy(() => import("./Bondcertificate.jsx")),
    props: { stampUrl: "/stamp.png" },
    needsUserInfo: true,
  },
};

const getCertType = (bond) => {
  const { planType, schemeType,payoutCycle } = bond || {};
  if (planType === "SIP" || schemeType === "SIP") return "SIP";
  if (planType === "PENSION" || schemeType === "PENSION") return "PENSION";
  if (planType === "DAILY_DEPOSIT") return "DAILY_DEPOSIT";
  if (planType === "FD" && payoutCycle === "Quarterly") return "QUARTERLY";
  return "DEFAULT";
};

// Hoisted: static elements are created once instead of on every render.
const POP_IN_STYLE = (
  <style>{`@keyframes popIn { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }`}</style>
);

const CertificateSkeleton = () => (
  <div className="aspect-4/5 w-full animate-pulse bg-slate-800/60" />
);

const tabClass = (active) =>
  `flex items-center gap-1.5 rounded px-2.5 py-1 transition ${
    active
      ? "bg-teal-600 text-white font-medium"
      : "text-slate-400 hover:text-slate-200"
  }`;

const OFFSCREEN =
  "pointer-events-none absolute -left-[10000px] top-0 w-100 opacity-0";

function CertificateLightbox({ bond, userName, userData, scheme, onClose }) {
  const certRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // "image" = uploaded bond (default when one exists), "system" = generated.
  // Derived, so it stays correct if `bond` changes while mounted.
  const [view, setView] = useState("image");
  const [failedSrc, setFailedSrc] = useState(null);

  // Stable listener, bound once
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCloseRef.current?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Prevent background scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!bond) return null;

  const hasUploadedImage = Boolean(bond.bondUrl);
  const imageSrc = hasUploadedImage ? resolveMediaUrl(bond.bondUrl) : null;
  // Fall back to the system certificate if the uploaded image fails to load
  const imageFailed = failedSrc !== null && failedSrc === imageSrc;
  const showImage =
    hasUploadedImage && view === "image" && Boolean(imageSrc) && !imageFailed;

  const certType = getCertType(bond);
  const {
    Component: Certificate,
    props: certProps,
    needsUserInfo,
  } = CERTIFICATES[certType];
  const showDownload = certType !== "SIP";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bond certificate"
      className="fixed inset-0 z-60 mt-16 flex items-center justify-center p-4 sm:p-8"
    >
      {POP_IN_STYLE}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl animate-[popIn_.2s_ease-out]">
        <div className="absolute -top-11 right-0 flex items-center gap-2">
          {hasUploadedImage && (
            <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900/90 p-1 text-xs">
              <button
                type="button"
                onClick={() => setView("system")}
                aria-pressed={!showImage}
                className={tabClass(!showImage)}
              >
                <FileText className="h-3.5 w-3.5" /> System Bond
              </button>
              <button
                type="button"
                onClick={() => setView("image")}
                aria-pressed={showImage}
                className={tabClass(showImage)}
              >
                <ImageIcon className="h-3.5 w-3.5" /> Uploaded Bond
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            aria-label="Close certificate"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="relative mx-auto w-100 max-w-full overflow-hidden rounded-md shadow-2xl shadow-black/50 ring-1 ring-white/10">
          {showImage && (
            <Image
              src={imageSrc}
              alt={`Bond certificate for ${userName || "user"}`}
              width={800}
              height={1000}
              priority
              unoptimized
              onError={() => setFailedSrc(imageSrc)}
              className="h-auto max-h-[80vh] w-full bg-slate-950 object-contain"
            />
          )}

          {/*
            Single Certificate instance (previously two). When the uploaded image
            is shown it stays mounted off-screen so certRef is still available for
            PDF capture, and toggling views no longer remounts it.
          */}
          <div
            aria-hidden={showImage || undefined}
            className={showImage ? OFFSCREEN : undefined}
          >
            <Suspense fallback={showImage ? null : <CertificateSkeleton />}>
              <Certificate
                ref={certRef}
                bond={bond}
                userData={userData}
                {...(needsUserInfo && { userName, scheme })}
                className="h-auto w-full"
                logoUrl="/logo.png"
                watermarkUrl="/logo.png"
                {...certProps}
              />
            </Suspense>
          </div>

          {showDownload && (
            <Suspense fallback={null}>
              <BondDownloadButton
                className="absolute bottom-2 right-2"
                certRef={certRef}
                pdfUrl={bond.bondPdfUrl}
                filename={`bond-${bond.userSchemeId || "certificate"}`}
                systemAvailable
              />
            </Suspense>
          )}
        </div>

        <p className="mt-3 text-center font-mono text-xs text-slate-400">
          Serial {bond.userSchemeId || bond.id || ""}
        </p>
      </div>
    </div>
  );
}

export default memo(CertificateLightbox);