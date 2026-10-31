"use client";
import React, { forwardRef } from "react";
import { buildSipSchedule, getSipPremium, getSipProfitRate } from "./format";

/**
 * SIPLedgerSheet — printable "Groww Karo Daily Deposit" ledger (same look as the Excel/PDF sheet).
 * Renders as an SVG for html2canvas / print export.
 *
 * Props:
 *   bond       – userScheme  (sipAmount, sipLedger[], bondNumber, paidDate, maturityDate, profitRate?)
 *   userData   – user profile (name, phone)
 *   logoUrl    – company logo URL (shown in the box at the top-right)
 *   title      – optional heading (default "Groow Karo Daily Deposit")
 */

const INK = "#000000";
const GREY = "#595959";
const BLUE = "#5B9BD5";
const YELLOW = "#FFFF00";
const LINE = "#000000";
const FS = 12.5;
const SIPLedgerSheet = forwardRef(function SIPLedgerSheet(
  { bond = {}, userData = {}, logoUrl, title = "Groow Karo Daily Deposit", stampUrl },
  ref
) {
  const user = userData || {};
  const name = user.name || bond.fullName || "";
  const bondNumber = bond.bondNumber || bond.userSchemeId || "";
  const tenureMonths =
    bond.tenureMonths || (bond.tenure ? Math.round(Number(bond.tenure) / 30) : 0);
  const sipFrequency =
    String(bond.sipFrequency || "MONTHLY").toUpperCase() === "DAILY" ? "DAILY" : "MONTHLY";
  const rate = getSipProfitRate(bond);

  // DD-MM-YYYY, same as the sheet
  const fmtDate = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
  };
  const fmtNum = (v) =>
    Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dash = (v) => (Number(v) ? fmtNum(v) : "-");

  // ---- rows ----
  const ledger = Array.isArray(bond.sipLedger) ? bond.sipLedger : [];
  const sipAmount = getSipPremium(bond);
  const generated = buildSipSchedule(bond.paidDate || bond.enrollmentDate, {
    ...bond,
    sipAmount,
    sipFrequency,
  });
  const count = Math.max(ledger.length, generated.length);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const e = ledger[i] || {};
    const g = generated[i] || {};
    const deposit = Number(e.paidAmount ?? 0) || 0;
    const days = count - i; // remaining days: 60, 59, … 1
    const profit = deposit ? (deposit * rate / count) * days : 0; // = D*E/C*B
    rows.push({
      date: e.installmentDate || g.installmentDate || "",
      days,
      tenure: count,
      deposit,
      profit,
      total: deposit + profit,
    });
  }
  const totalDeposit = rows.reduce((s, r) => s + r.deposit, 0);
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
  const totalBalance = rows.reduce((s, r) => s + r.total, 0);

  // ---- layout ----
  const W = 595;
  const X0 = 0;
  const TW = W; // full-width table, like the sheet
  const TITLE_H = 39;
  const INFO_H = 20.3;
  const BAND_H = 20;
  const HEAD_H = 24;
  const ROW_H = 20.3;
  const rel = [110, 52, 112, 107, 106, 95, 120];
  const relSum = rel.reduce((a, b) => a + b, 0);
  const cw = rel.map((r) => (r / relSum) * TW);
  const cx = [];
  cw.reduce((acc, w, i) => ((cx[i] = acc), acc + w), X0);
  const cMid = (i) => cx[i] + cw[i] / 2;
  const cRight = (i) => cx[i] + cw[i] - 4;

  const yInfo = TITLE_H;
  const yBand = yInfo + 6 * INFO_H;
  const yHead = yBand + BAND_H;
  const yRows = yHead + HEAD_H;
  const yBlank = yRows + rows.length * ROW_H;
  const yTotal = yBlank + ROW_H;
  const H = yTotal + ROW_H + 40;

  const infoLeft = [
    ["Client Name:", name],
    ["Starting Date:", fmtDate(bond.paidDate || bond.enrollmentDate)],
    ["Ending Date:", fmtDate(bond.maturityDate)],
    ["Mobile No.:", user.phone || ""],
    ["Bond No. :", bondNumber],
    ["Tenure:", `${tenureMonths}M`],
  ];
  const labelW = cw[0] + cw[1] + cw[2];
  const valW = cw[3] + cw[4];
  const logoX = cx[5];
  const logoW = cw[5] + cw[6];

  const box = (x, y, w, h, fill = "none") => (
    <rect x={x} y={y} width={w} height={h} fill={fill} stroke={LINE} strokeWidth={0.6} />
  );

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMin meet"
      fill={INK}
      style={{
        width: "100%",
        height: "auto",
        display: "block",
        fontFamily: 'Calibri, Carlito, "Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      <rect x="0" y="0" width={W} height={H} fill="#FFFFFF" />

      {/* Title */}
      {box(X0, 0, TW, TITLE_H, BLUE)}
      <text x={W / 2} y={TITLE_H / 2 + 9} textAnchor="middle" fontSize={26} fontWeight={700} fill={GREY}>
        {title}
      </text>

      {/* Info block */}
      {infoLeft.map(([label, val], i) => {
        const y = yInfo + i * INFO_H;
        return (
          <g key={label}>
            {box(X0, y, labelW, INFO_H)}
            {box(X0 + labelW, y, valW, INFO_H)}
            <text x={X0 + 4} y={y + INFO_H / 2 + 4} fontSize={FS}>{label}</text>
            <text x={X0 + labelW + valW / 2} y={y + INFO_H / 2 + 4} textAnchor="middle" fontSize={FS}>{val}</text>
          </g>
        );
      })}
      {box(logoX, yInfo, logoW, 6 * INFO_H)}
      {logoUrl ? (
        <image
          href={stampUrl}
          x={logoX + 6}
          y={yInfo + 4}
          width={logoW - 8}
          height={6 * INFO_H - 8}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <text x={logoX + logoW / 2} y={yInfo + 3 * INFO_H + 4} textAnchor="middle" fontSize={14} fontWeight={700} fill="#0E7490">
          GROWW karo
        </text>
      )}

      {/* Blue band */}
      {box(X0, yBand, cx[6] - X0, BAND_H, BLUE)}
      {box(cx[6], yBand, cw[6], BAND_H, BLUE)}

      {/* Table header */}
      {["Date", "Days", "Tenure Day", "Deposit", "Percentage", "Profit", "Total Blance"].map((h, i) => (
        <g key={h}>
          {box(cx[i], yHead, cw[i], HEAD_H, YELLOW)}
          <text x={cMid(i)} y={yHead + HEAD_H / 2 + 4} textAnchor="middle" fontSize={FS} fontWeight={700}>{h}</text>
        </g>
      ))}

      {/* Rows */}
      {rows.map((r, i) => {
        const y = yRows + i * ROW_H;
        const ty = y + ROW_H / 2 + 4;
        return (
          <g key={i}>
            <line x1={X0} y1={y + ROW_H} x2={X0 + TW} y2={y + ROW_H} stroke={LINE} strokeWidth={0.6} />
            <line x1={cx[5]} y1={y} x2={cx[5]} y2={y + ROW_H} stroke={LINE} strokeWidth={0.6} />
            <line x1={cx[6]} y1={y} x2={cx[6]} y2={y + ROW_H} stroke={LINE} strokeWidth={0.6} />
            <text x={X0 + 5} y={ty} textAnchor="start" fontSize={FS}>{fmtDate(r.date)}</text>
            <text x={cRight(1)} y={ty} textAnchor="end" fontSize={FS}>{r.days}</text>
            <text x={cRight(2)} y={ty} textAnchor="end" fontSize={FS}>{r.tenure}</text>
            <text x={cRight(3)} y={ty} textAnchor="end" fontSize={FS}>{r.deposit ? fmtNum(r.deposit) : ""}</text>
            <text x={cRight(4)} y={ty} textAnchor="end" fontSize={FS}>{(rate * 100).toFixed(2)}%</text>
            <text x={cMid(5)} y={ty} textAnchor="middle" fontSize={FS}>{dash(r.profit)}</text>
            <text x={cRight(6)} y={ty} textAnchor="end" fontSize={FS}>{dash(r.total)}</text>
          </g>
        );
      })}

      {/* Yellow spacer row */}
      {cw.map((w, j) => (
        <rect key={j} x={cx[j]} y={yBlank} width={w} height={ROW_H} fill={YELLOW} stroke={LINE} strokeWidth={0.4} />
      ))}

      {/* Totals */}
      {cw.map((w, j) => (
        <rect key={j} x={cx[j]} y={yTotal} width={w} height={ROW_H} fill="none" stroke={LINE} strokeWidth={0.6} />
      ))}
      <text x={cRight(2)} y={yTotal + ROW_H / 2 + 4} textAnchor="end" fontSize={FS} fontWeight={700}>Total Deposit</text>
      <text x={cRight(3)} y={yTotal + ROW_H / 2 + 4} textAnchor="end" fontSize={FS} fontWeight={700}>{fmtNum(totalDeposit)}</text>
      <text x={cx[4] + 4} y={yTotal + ROW_H / 2 + 4} fontSize={FS} fontWeight={700}>Total Profit</text>
      <text x={cMid(5)} y={yTotal + ROW_H / 2 + 4} textAnchor="middle" fontSize={FS} fontWeight={700}>{fmtNum(totalProfit)}</text>
      <text x={cRight(6)} y={yTotal + ROW_H / 2 + 4} textAnchor="end" fontSize={FS} fontWeight={700}>{fmtNum(totalBalance)}</text>

      {/* Footer note */}
      <text x={W / 2} y={H - 18} textAnchor="middle" fontSize={6.5} fill="#94A3B8">
       @Generated by Groww Karo • www.growwkaro.com • +919430050782 • karogroww@gmail.com
      </text>
    </svg>
  );
});

export default SIPLedgerSheet;