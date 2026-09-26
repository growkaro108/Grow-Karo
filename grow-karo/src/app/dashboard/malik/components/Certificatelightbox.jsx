import React, { useEffect, useRef, useState } from "react";
import { X, FileText, Image as ImageIcon } from "lucide-react";
import BondCertificate from "./BondCertificate.jsx";
import BondDownloadButton from "./BondDownloadButton.jsx";
import { resolveMediaUrl } from "../../../../api/apiClient";

export default function CertificateLightbox({
  bond,
  userName,
  userData,
  scheme,
  onClose,
}) {
  const certRef = useRef(null);
  const [showUploadedImage, setShowUploadedImage] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!bond) return null;

  const hasUploadedImage = Boolean(bond.bondUrl);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-8 mt-16">
      <style>{`@keyframes popIn { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }`}</style>
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl animate-[popIn_.2s_ease-out]">
        <div className="absolute -top-11 right-0 flex items-center gap-2">
          {hasUploadedImage && (
            <div className="flex items-center rounded-lg bg-slate-900/90 p-1 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setShowUploadedImage(false)}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 transition ${!showUploadedImage
                  ? "bg-teal-600 text-white font-medium"
                  : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                <FileText className="h-3.5 w-3.5" /> Certificate
              </button>
              <button
                type="button"
                onClick={() => setShowUploadedImage(true)}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 transition ${showUploadedImage
                  ? "bg-teal-600 text-white font-medium"
                  : "text-slate-400 hover:text-slate-200"
                  }`}
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

        <div
          className="relative overflow-hidden rounded-md shadow-2xl shadow-black/50 ring-1 ring-white/10"
          style={{ width: 400, margin: "0 auto" }}
        >
          {showUploadedImage && hasUploadedImage ? (
            <img
              src={resolveMediaUrl(bond.bondUrl)}
              alt={`Bond certificate for ${userName}`}
              className="h-auto max-h-[80vh] w-full object-contain bg-slate-950"
            />
          ) : (
            <>
              <BondCertificate
                ref={certRef}
                bond={bond}
                userData={userData}
                userName={userName}
                scheme={scheme}
                className="h-auto w-full"
                logoUrl={"/logo.jpg"}
              />

              <BondDownloadButton
                className="absolute right-2 bottom-2"
                certRef={certRef}
                filename={`bond-${bond.userSchemeId || "certificate"}`}
              />
            </>
          )}
        </div>

        <p className="mt-3 text-center font-mono text-xs text-slate-400">
          Serial {bond.userSchemeId || bond.id || ""}
        </p>
      </div>
    </div>
  );
}
