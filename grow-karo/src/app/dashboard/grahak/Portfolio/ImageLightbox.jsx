"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Download, ImageOff, X } from "lucide-react";
import { resolveMediaUrl } from "@/api/apiClient";

export default function ImageLightbox({ bond, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const mainImage = resolveMediaUrl(bond.bondImageURL);

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleDownload = useCallback(async () => {
    if (!mainImage) return;
    setDownloading(true);
    try {
      const response = await fetch(mainImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${bond.bondNumber || "bond-image"}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }, [mainImage, bond.bondNumber]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={`${bond.bondNumber || "Bond"} image preview`}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100"><div><p className="text-sm font-semibold text-slate-800">{bond.bondNumber || "N/A"}</p><p className="text-xs text-slate-500">{bond.schemeName}</p></div><button type="button" onClick={onClose} aria-label="Close preview" className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100"><X size={18} /></button></div>
        <div className="p-6 flex items-center justify-center bg-slate-50 min-h-70">
          {imgError || !mainImage ? <div className="flex flex-col items-center gap-2 text-slate-400"><ImageOff size={32} /><span className="text-xs">Image unavailable</span></div> : <div className="relative w-full h-80 max-h-[50vh]">{imgLoading && <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>}<Image src={mainImage} alt={bond.bondNumber || "Bond proof"} fill unoptimized sizes="(max-width: 640px) 100vw, 500px" onLoad={() => setImgLoading(false)} onError={() => { setImgError(true); setImgLoading(false); }} className={`object-contain rounded-lg transition-opacity ${imgLoading ? "opacity-0" : "opacity-100"}`} /></div>}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Close</button><button type="button" onClick={handleDownload} disabled={imgError || !mainImage || downloading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg"><Download size={16} />{downloading ? "Downloading..." : "Download"}</button></div>
      </div>
    </div>
  );
}
