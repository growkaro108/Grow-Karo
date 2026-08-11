import React, { useEffect } from "react";
import { X } from "lucide-react";
import BondCertificate from "./BondCertificate";

export default function CertificateLightbox({
  bond,
  userName,
  scheme,
  onClose,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!bond) return null;
  // console.log(userName + " " + scheme + " " + bond);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-8">
      <style>{`@keyframes popIn { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }`}</style>
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl animate-[popIn_.2s_ease-out]">
        <button
          onClick={onClose}
          className="absolute -top-11 right-0 rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          aria-label="Close certificate"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="overflow-hidden rounded-2xl shadow-2xl shadow-black/50 ring-1 ring-white/10">
          <BondCertificate
            bond={bond ?? null}
            userName={userName}
            scheme={scheme}
            className="h-auto w-full"
          />
        </div>

        <p className="mt-3 text-center font-mono text-xs text-slate-400">
          Serial {bond.userSchemeId}
        </p>
      </div>
    </div>
  );
}
