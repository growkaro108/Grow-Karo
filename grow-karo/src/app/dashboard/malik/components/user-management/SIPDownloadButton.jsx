"use client";
import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Download, FileText, Landmark, Loader2, Sheet } from "lucide-react";
import { createPortal } from "react-dom";
import {
  downloadAsXlsx,
  downloadLedgerXlsx,
  downloadSvgAsPdf,
  downloadSvgAsPng,
} from "../../utils";
import { getSipPremium } from "./format";
import {
  downloadDailyDepositLedgerXlsx,
  depositsFromSipLedger,
  isDailyDeposit,
  loadLedgerLogo,
} from "./dailyDepositLedgerXlsx";
import BondCertificate from "../Bondcertificate";

const SIPBondCertificate = dynamic(() => import("../SIPBondCertificate"), {
  ssr: false,
});
const SIPLedgerSheet = dynamic(() => import("./SIPLedgerSheet"), {
  ssr: false,
});

/**
 * SIPDownloadButton
 * Renders two hidden SVGs (bond + ledger) into a portal, then downloads each
 * as a crisp 3x PNG using the shared downloadSvgAsPng utility.
 *
 * Props:
 *   bond       – userScheme object
 *   userData   – full user profile
 *   logoUrl    – company logo URL (optional)
 *   stampUrl   – company stamp URL (optional)
 */
export default function SIPDownloadButton({
  bond,
  userData,
  logoUrl,
  stampUrl,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(null); // "bond"|"ledger"|"both"

  const bondRef = useRef(null);
  const ledgerRef = useRef(null);

  const slug = (bond?.bondNumber || bond?.userSchemeId || "sip").replace(
    /\s+/g,
    "_",
  );
  const isNewDailyDeposit = bond?.planType === "DAILY_DEPOSIT";
  const memberName = (userData?.name || "member").replace(/\s+/g, "_");

  const go = useCallback(
    async (which) => {
      setLoading(which);
      try {
        if (which === "bond") {
          if (bondRef.current)
            // await downloadSvgAsPng(bondRef.current, `SIP_Bond_${slug}_${memberName}`, { scale: 3 });
            await downloadSvgAsPdf(
              bondRef.current,
              `${isNewDailyDeposit ? "Daily_Deposit" : "SIP"}_Bond_${slug}_${memberName}`,
              { scale: 3 },
            );
        }
        //  if (which === "both") await new Promise(r => setTimeout(r, 500));
        if (which === "ledger") {
          if (ledgerRef.current)
            await downloadSvgAsPdf(
              ledgerRef.current,
              `SIP_Ledger_${slug}_${memberName}`,
              { scale: 3 },
            );
        }
        if (which === "ledgerxsls" && isDailyDeposit(bond)) {
          // Daily Deposit gets its own ledger layout (same as the bond ledger
          // the office prepares by hand), built from deposits by paid date.
          try {
            const logo = await loadLedgerLogo(stampUrl || logoUrl);
            await downloadDailyDepositLedgerXlsx(
              {
                member: { name: userData?.name, phone: userData?.phone },
                bond: {
                  bondNo: bond?.bondNumber || bond?.userSchemeId,
                  startDate: String(bond?.enrollmentDate || bond?.paidDate || "").slice(0, 10),
                  tenureMonths: bond?.tenureMonths || Math.round(Number(bond?.tenure) / 30),
                  ratePercent: Number(
                    bond?.contractProfitPercentage ??
                      bond?.contractTotalInterestPercentage ??
                      bond?.profitPercentage ??
                      bond?.scheme?.profitPercentage,
                  ),
                },
                deposits: bond?.dailyDepositLedger?.length
                  ? bond.dailyDepositLedger.map((deposit) => ({
                      date: deposit.depositDate,
                      amount: Number(deposit.depositAmount),
                    }))
                  : depositsFromSipLedger(bond?.sipLedger),
                logo,
              },
              `Daily_Deposit_Ledger_${slug}_${memberName}`,
            );
          } catch (err) {
            window.alert(err?.message || "Could not build the ledger");
          }
          return;
        }
        if (which === "ledgerxsls") {
          const installments=bond?.sipLedger || [];
          await downloadLedgerXlsx(
            {
              member: { name: memberName, phone:userData?.phone, aadhaar:userData?.aadhaarNo },
              bond: {
                bondNo:bond?.bondNumber|| bond.userSchemeId,
                installmentAmount: getSipPremium(bond),
                sipFrequency: bond?.sipFrequency,
                tenureMonths: (bond.tenure?Math.round(Number(bond.tenure)/30):""),
                investmentDate: bond.enrollmentDate,
                maturityDate: bond.maturityDate,
              },
              installments, // the same array you map over to render the ledger rows
            },
            `SIP_Ledger_${slug}_${memberName}`,
          );
        }
      } finally {
        setLoading(null);
      }
    },
    [slug, memberName, bond, isNewDailyDeposit, logoUrl, stampUrl, userData?.name, userData?.phone, userData?.aadhaarNo],
  );

  const isLoading = loading !== null;

  return (
    <>
      {/* Hidden render portal — kept outside the DOM flow */}
      {typeof window !== "undefined" &&
        createPortal(
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              left: "-9999px",
              top: 0,
              pointerEvents: "none",
              width: 700,
              opacity: 0,
            }}
          >
            {isNewDailyDeposit ? (
              <BondCertificate
                ref={bondRef}
                bond={bond}
                userData={userData}
                userName={userData?.name}
                scheme={bond?.schemeName}
                logoUrl={logoUrl}
                stampUrl={stampUrl}
                watermarkUrl={logoUrl}
                profilePhoto="/profile.jpg"
              />
            ) : (
              <SIPBondCertificate
                ref={bondRef}
                bond={bond}
                userData={userData}
                logoUrl={logoUrl}
                stampUrl={stampUrl}
                watermarkUrl={logoUrl}
              />
            )}
            <SIPLedgerSheet
              ref={ledgerRef}
              bond={bond}
              userData={userData}
              logoUrl={logoUrl}
            />
          </div>,
          document.body,
        )}

      <div className={`relative inline-block ${className}`}>
        <button
          id={`sip-dl-btn-${bond?.userSchemeId}`}
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-md border border-teal-700 px-3 py-1.5 text-xs font-medium text-teal-300 transition hover:bg-teal-950/50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Download size={13} />
          )}
          {isLoading ? "Downloading…" : "Download"}
        </button>

        {open && !isLoading && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  go("bond");
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-teal-300"
              >
                <Landmark size={13} className="text-teal-400" />{" "}
                {isNewDailyDeposit ? "Daily Deposit" : "SIP"} Bond in PDF
              </button>

              {!isNewDailyDeposit && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    go("ledger");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                >
                  <FileText size={13} className="text-amber-400" /> Ledger in PDF
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  go("ledgerxsls");
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-teal-300"
              >
                <Sheet size={13} className="text-amber-400" />{" "}
                {isDailyDeposit(bond) ? "Daily Deposit ledger in XLSX" : "Ledger in XLSX"}
              </button>
              {/* <button type="button" onClick={() => { setOpen(false); go("both"); }}
                className="flex w-full items-center gap-2 border-t border-slate-700 px-3 py-2.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-teal-300">
                <Download size={13} className="text-indigo-400"/> Download Both
              </button> */}
            </div>
          </>
        )}
      </div>
    </>
  );
}