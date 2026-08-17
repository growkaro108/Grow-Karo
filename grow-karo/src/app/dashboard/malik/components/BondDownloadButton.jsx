import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadSvgAsPng } from "../utils";

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
