import React, {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { X, FileText, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { resolveMediaUrl } from "../../../../api/apiClient";
import dynamic from "next/dynamic";

// No ref needed (certRef is passed as a normal prop), and it likely
// uses browser-only libs, so skip SSR
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
  DEFAULT: {
    Component: lazy(() => import("./Bondcertificate.jsx")),
    props: { stampUrl: "/stamp.png" },
    needsUserInfo: true,
  },
};

const getCertType = (bond) => {
  const type = bond?.planType || bond?.schemeType;
  if (type === "SIP" || bond?.schemeType === "SIP") return "SIP";
  if (type === "PENSION" || bond?.schemeType === "PENSION") return "PENSION";
  if (bond?.planType === "DAILY_DEPOSIT") return "DAILY_DEPOSIT";
  return "DEFAULT";
};

const CertificateSkeleton = () => (
  <div className="aspect-4/5 w-full animate-pulse bg-slate-800/60" />
);

function CertificateLightbox({ bond, userName, userData, scheme, onClose }) {
  const certRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const hasUploadedImage = Boolean(bond?.bondUrl);
  const [showUploadedImage, setShowUploadedImage] = useState(hasUploadedImage);

  // Stable listener, bound once
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCloseRef.current();
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

  const certType = useMemo(() => getCertType(bond), [bond]);
  const {
    Component: Certificate,
    props: certProps,
    needsUserInfo,
  } = CERTIFICATES[certType];

  const imageSrc = useMemo(
    () => (hasUploadedImage ? resolveMediaUrl(bond.bondUrl) : null),
    [hasUploadedImage, bond?.bondUrl],
  );

  const showImage = showUploadedImage && hasUploadedImage;
  const showDownload = certType !== "SIP";

  const showImageView = useCallback(() => setShowUploadedImage(true), []);
  const showCertView = useCallback(() => setShowUploadedImage(false), []);

  if (!bond) return null;

  const tabClass = (active) =>
    `flex items-center gap-1.5 rounded px-2.5 py-1 transition ${
      active
        ? "bg-teal-600 text-white font-medium"
        : "text-slate-400 hover:text-slate-200"
    }`;

  return (
    <div className="fixed inset-0 z-60 mt-16 flex items-center justify-center p-4 sm:p-8">
      <style>{`@keyframes popIn { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }`}</style>
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl animate-[popIn_.2s_ease-out]">
        <div className="absolute -top-11 right-0 flex items-center gap-2">
          {hasUploadedImage && (
            <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900/90 p-1 text-xs">
             <button
                type="button"
                onClick={showCertView}
                className={tabClass(!showUploadedImage)}
              >
                <FileText className="h-3.5 w-3.5" /> System Bond
              </button>
               <button
                type="button"
                onClick={showImageView}
                className={tabClass(showUploadedImage)}
              >
                <ImageIcon className="h-3.5 w-3.5" /> Uploaded Bond
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            aria-label="Close certificate"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="relative mx-auto w-100 max-w-full overflow-hidden rounded-md shadow-2xl shadow-black/50 ring-1 ring-white/10">
          {showImage ? (
            <Image
              src={imageSrc}
              alt={`Bond certificate for ${userName}`}
              width={800}
              height={1000}
              sizes="400px"
              priority
              unoptimized
              className="h-auto max-h-[80vh] w-full bg-slate-950 object-contain"
            />
          ) : (
            <Suspense fallback={<CertificateSkeleton />}>
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
          )}

          {showImage && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-[10000px] top-0 w-100 opacity-0"
            >
              <Suspense fallback={null}>
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
          )}

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
