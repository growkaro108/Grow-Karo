import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadSvgAsPng } from "../utils";

// BondCertificate sets data-images-ready="true" once logo/photo/stamp/watermark
// have been embedded as data: URIs. Rasterising before that drops the images.
function waitForImages(svgEl, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (
        svgEl.dataset.imagesReady === "true" ||
        Date.now() - start > timeoutMs
      ) {
        resolve();
      } else {
        setTimeout(tick, 100);
      }
    };
    tick();
  });
}

export default function BondDownloadButton({
  certRef,
  filename = "investment-bond",
  className = "",
}) {
  const [status, setStatus] = useState("idle"); // idle | working | error

  const handleDownload = async () => {
    if (!certRef?.current) return;
    setStatus("working");
    try {
      await waitForImages(certRef.current);
      if (document.fonts?.ready) await document.fonts.ready;
      await downloadSvgAsPng(certRef.current, filename, { scale: 3 });
      setStatus("idle");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={status === "working"}
      className={`inline-flex items-center gap-2 rounded-md bg-[#0E4749] px-4 py-2 text-sm font-medium text-white hover:bg-[#0E4749]/90 disabled:opacity-60 ${className}`}
    >
      {status === "working" ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Download size={16} />
      )}
      {status === "working"
        ? "Preparing…"
        : status === "error"
          ? "Try again"
          : "Download"}
    </button>
  );
}