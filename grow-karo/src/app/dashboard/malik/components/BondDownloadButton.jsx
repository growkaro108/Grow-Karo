"use client";

import React, { useState } from "react";
import { ChevronDown, Download, Loader2 } from "lucide-react";
import { downloadSvgAsPdf } from "../utils";
import { resolveMediaUrl } from "../../../../api/apiClient";
import { errorMessage } from "@/components/Message";

export default function BondDownloadButton({
  certRef,
  pdfUrl,
  filename = "investment-bond",
  className = "",
  systemAvailable = true,
}) {
  const [workingSource, setWorkingSource] = useState(null);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [retrySource, setRetrySource] = useState(null);
  const hasUploadedPdf = Boolean(pdfUrl);
  const canChooseSource = systemAvailable && hasUploadedPdf;

  const downloadUploadedPdf = async () => {
    const url = resolveMediaUrl(pdfUrl);
    if (!url) throw new Error("Uploaded bond PDF URL is unavailable.");

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Uploaded bond PDF request failed (${response.status}).`);
    }

    const blob = await response.blob();
    if (blob.size === 0) throw new Error("Uploaded bond PDF is empty.");
    const header = new TextDecoder().decode(await blob.slice(0, 5).arrayBuffer());
    if (header !== "%PDF-") {
      throw new Error("The uploaded bond file is not a valid PDF.");
    }

    const objectUrl = URL.createObjectURL(blob);
    try {
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
  };

  const handleDownload = async (source) => {
    setMenuOpen(false);
    setError("");
    setRetrySource(source);
    setWorkingSource(source);

    try {
      if (source === "system") {
        if (!certRef?.current) {
          throw new Error("System bond certificate is not ready yet.");
        }
        if (document.fonts?.ready) await document.fonts.ready;
        await downloadSvgAsPdf(certRef.current, filename, { scale: 3 });
      } else {
        await downloadUploadedPdf();
      }
    } catch (err) {
      console.error(`Failed to download ${source} bond PDF:`, err);
      errorMessage(
        source === "system"
          ? "Couldn't create the system bond PDF. Please try again."
          : "Couldn't download the uploaded bond PDF. Check your connection and try again.",
      );
    } finally {
      setWorkingSource(null);
    }
  };

  const buttonLabel =
    workingSource === "system"
      ? "Creating system PDF…"
      : workingSource === "uploaded"
        ? "Downloading uploaded PDF…"
        : canChooseSource
          ? "Download bond PDF"
          : hasUploadedPdf && !systemAvailable
            ? "Download uploaded PDF"
            : "Download system PDF";

  return (
    <div className={`relative inline-flex flex-col items-end gap-1 ${className}`}>
      {canChooseSource && menuOpen && (
        <div
          role="menu"
          aria-label="Choose bond PDF"
          className="absolute bottom-full right-0 z-10 mb-2 min-w-52 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 text-slate-800 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handleDownload("system")}
            className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
          >
            System Bond (PDF)
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleDownload("uploaded")}
            className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
          >
            Uploaded Bond (PDF)
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (workingSource) return;
          if (canChooseSource) {
            setError("");
            setMenuOpen((open) => !open);
          } else {
            handleDownload(systemAvailable ? "system" : "uploaded");
          }
        }}
        disabled={Boolean(workingSource)}
        aria-haspopup={canChooseSource ? "menu" : undefined}
        aria-expanded={canChooseSource ? menuOpen : undefined}
        className="inline-flex items-center gap-2 rounded-md bg-[#0E4749] px-4 py-2 text-sm font-medium text-white hover:bg-[#0E4749]/90 disabled:opacity-60"
      >
        {workingSource ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        {buttonLabel}
        {canChooseSource && <ChevronDown size={16} />}
      </button>

      {error && (
        <div
          role="alert"
          className="max-w-64 rounded-md border border-rose-300 bg-white px-3 py-2 text-xs text-rose-700 shadow-lg"
        >

          <button
            type="button"
            onClick={() => handleDownload(retrySource)}
            className="mt-1 font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
