"use client";
import React, { forwardRef } from "react";
import { getSipPremium } from "./format";

/**
 * SIPLedgerSheet — printable A4 installment ledger for an SIP bond.
 * Renders as an SVG for html2canvas / print export.
 *
 * Props:
 *   bond       – userScheme  (sipAmount, sipLedger[], bondNumber, schemeName, paidDate, maturityDate)
 *   userData   – user profile (name, phone, aadhaarNo…)
 *   logoUrl    – company logo URL
 */

const INK = "#222222";
const TAN = "#B39273";
const GREEN = "#16A34A";
const BLUE  = "#2563EB";
const FS    = 8.2;
const FS_SM = 7.4;

const SIPLedgerSheet = forwardRef(function SIPLedgerSheet(
  { bond={}, userData={}, logoUrl }, ref
) {
  const user = userData || {};
  const name = user.name || bond.fullName || "";
  const sipAmount = getSipPremium(bond);
  const bondNumber = bond.bondNumber || bond.userSchemeId || "";
  const tenureMonths = bond.tenureMonths || (bond.tenure ? Math.round(Number(bond.tenure)/30) : 0);

  const safeDate = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (!Number.isNaN(d.getTime()))
      return d.toLocaleDateString("en-IN", {day:"2-digit",month:"2-digit",year:"numeric"});
    return String(val);
  };

  const fmtAmt = (v) => {
    const n = Number(v||0);
    return `₹${n.toLocaleString("en-IN")}`;
  };

  // Build installment rows from sipLedger or generate expected schedule
  const ledger = Array.isArray(bond.sipLedger) ? bond.sipLedger : [];
  const sipDay = bond.sipDay || 20;

  // Fill any missing rows up to tenureMonths
  const rows = [];
  for (let i = 0; i < Math.max(ledger.length, tenureMonths || 12); i++) {
    const existing = ledger[i] || {};
    const installDate = existing.installmentDate || (() => {
      if (!bond.paidDate) return "";
      const d = new Date(bond.paidDate);
      d.setMonth(d.getMonth() + i + 1);
      d.setDate(Math.min(sipDay, new Date(d.getFullYear(), d.getMonth()+1, 0).getDate()));
      return d.toISOString().slice(0,10);
    })();
    rows.push({
      no: i + 1,
      installmentDate: installDate,
      dueDate:  existing.dueDate  || installDate,
      paidDate: existing.paidDate || "",
      dueAmount:  Number(existing.dueAmount  ?? sipAmount),
      paidAmount: Number(existing.paidAmount ?? 0),
    });
  }

  const totalDue  = rows.reduce((s,r)=>s+r.dueAmount, 0);
  const totalPaid = rows.reduce((s,r)=>s+r.paidAmount, 0);
  const balance   = totalDue - totalPaid;

  // SVG layout
  const W = 595; // A4 width px @72dpi
  const ROW_H = 22;
  const HEAD_H = 28;
  const tableTop = 160;
  const tableH = HEAD_H + rows.length * ROW_H + 40; // +footer row
  const H = tableTop + tableH + 80;

  // Column widths for table
  const cols = [
    { label:"#",              w:28  },
    { label:"Installment Date",w:100 },
    { label:"Due Date",       w:90  },
    { label:"Paid Date",      w:90  },
    { label:"Due Amount",     w:90  },
    { label:"Paid Amount",    w:90  },
    { label:"Status",         w:60  },
  ];
  let cx = 28;
  const colX = cols.map(c=>{ const x=cx; cx+=c.w; return x; });

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMin meet" fill={INK}
      style={{width:"100%",height:"auto",display:"block",fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif'}}>

      <rect x="0" y="0" width={W} height={H} fill="#FFFFFF"/>

      {/* Header band */}
      <rect x={0} y={0} width={W} height={80} fill="#0F172A"/>
      {logoUrl
        ? <image href={logoUrl} x={20} y={8} width={64} height={64} preserveAspectRatio="xMidYMid meet"/>
        : <>
            <text x={52} y={42} textAnchor="middle" fontSize={16} fontWeight={700} fill="#22D3EE">GROWW</text>
            <text x={52} y={58} textAnchor="middle" fontSize={9} letterSpacing={3} fill="#94A3B8">karo</text>
          </>
      }
      <text x={W/2} y={32} textAnchor="middle" fontSize={18} fontWeight={700} fill="#FFFFFF">SIP Installment Ledger</text>
      <text x={W/2} y={50} textAnchor="middle" fontSize={9} fill="#94A3B8">Systematic Investment Plan — Payment Record</text>

      {/* Meta info */}
      <text x={28} y={98} fontSize={FS}>Member: <tspan fontWeight={700}>{name}</tspan></text>
      <text x={28} y={112} fontSize={FS}>Phone: {user.phone||""}</text>
      <text x={28} y={126} fontSize={FS}>Aadhaar: {user.aadhaarNo||user.aadharNo||""}</text>
      <text x={W-28} y={98} textAnchor="end" fontSize={FS}>Bond No: <tspan fontWeight={700}>{bondNumber}</tspan></text>
      <text x={W-28} y={112} textAnchor="end" fontSize={FS}>Monthly Premium: <tspan fontWeight={700} fill={GREEN}>{sipAmount === null ? "Variable" : fmtAmt(sipAmount)}</tspan></text>
      <text x={W-28} y={126} textAnchor="end" fontSize={FS}>Tenure: <tspan fontWeight={700}>{tenureMonths} Months</tspan></text>
      <text x={28} y={140} fontSize={FS}>Investment Date: {safeDate(bond.paidDate)}</text>
      <text x={W-28} y={140} textAnchor="end" fontSize={FS}>Maturity Date: {safeDate(bond.maturityDate)}</text>

      {/* Table header */}
      <rect x={0} y={tableTop} width={W} height={HEAD_H} fill="#1E3A5F"/>
      {cols.map((c,i)=>(
        <text key={i} x={colX[i]+c.w/2} y={tableTop+HEAD_H/2+3} textAnchor="middle" fontSize={FS_SM} fontWeight={700} fill="#FFFFFF">{c.label}</text>
      ))}
      {cols.map((_,i)=>i>0&&(
        <line key={i} x1={colX[i]} y1={tableTop} x2={colX[i]} y2={tableTop+HEAD_H} stroke="#334155" strokeWidth={0.5}/>
      ))}

      {/* Rows */}
      {rows.map((row,i)=>{
        const ry = tableTop + HEAD_H + i * ROW_H;
        const bg = i%2===0?"#F8FAFC":"#FFFFFF";
        const isPaid = row.paidAmount >= row.dueAmount && row.paidAmount > 0;
        const isPartial = row.paidAmount > 0 && row.paidAmount < row.dueAmount;
        const statusColor = isPaid ? GREEN : isPartial ? "#D97706" : "#DC2626";
        const statusText  = isPaid ? "Paid" : isPartial ? "Partial" : row.paidDate ? "Partial" : "Pending";
        return (
          <g key={i}>
            <rect x={0} y={ry} width={W} height={ROW_H} fill={bg}/>
            <line x1={0} y1={ry+ROW_H} x2={W} y2={ry+ROW_H} stroke="#E2E8F0" strokeWidth={0.5}/>
            {cols.map((_,j)=><line key={j} x1={colX[j]} y1={ry} x2={colX[j]} y2={ry+ROW_H} stroke="#E2E8F0" strokeWidth={0.4}/>)}
            <text x={colX[0]+cols[0].w/2} y={ry+ROW_H/2+3} textAnchor="middle" fontSize={FS_SM}>{row.no}</text>
            <text x={colX[1]+cols[1].w/2} y={ry+ROW_H/2+3} textAnchor="middle" fontSize={FS_SM}>{safeDate(row.installmentDate)}</text>
            <text x={colX[2]+cols[2].w/2} y={ry+ROW_H/2+3} textAnchor="middle" fontSize={FS_SM}>{safeDate(row.dueDate)}</text>
            <text x={colX[3]+cols[3].w/2} y={ry+ROW_H/2+3} textAnchor="middle" fontSize={FS_SM} fill={row.paidDate?"#16A34A":"#94A3B8"}>{row.paidDate?safeDate(row.paidDate):"—"}</text>
            <text x={colX[4]+cols[4].w/2} y={ry+ROW_H/2+3} textAnchor="middle" fontSize={FS_SM}>{fmtAmt(row.dueAmount)}</text>
            <text x={colX[5]+cols[5].w/2} y={ry+ROW_H/2+3} textAnchor="middle" fontSize={FS_SM} fill={row.paidAmount>0?"#16A34A":"#94A3B8"}>{row.paidAmount>0?fmtAmt(row.paidAmount):"—"}</text>
            <text x={colX[6]+cols[6].w/2} y={ry+ROW_H/2+3} textAnchor="middle" fontSize={FS_SM-1} fontWeight={600} fill={statusColor}>{statusText}</text>
          </g>
        );
      })}

      {/* Summary footer */}
      {(() => {
        const fy = tableTop + HEAD_H + rows.length * ROW_H;
        return (
          <g>
            <rect x={0} y={fy} width={W} height={36} fill="#0F172A"/>
            <text x={colX[4]+cols[4].w/2} y={fy+20} textAnchor="middle" fontSize={FS_SM} fontWeight={700} fill="#94A3B8">Total Due</text>
            <text x={colX[5]+cols[5].w/2} y={fy+20} textAnchor="middle" fontSize={FS_SM} fontWeight={700} fill="#94A3B8">Total Paid</text>
            <text x={colX[4]+cols[4].w/2} y={fy+32} textAnchor="middle" fontSize={FS} fontWeight={700} fill="#F1F5F9">{fmtAmt(totalDue)}</text>
            <text x={colX[5]+cols[5].w/2} y={fy+32} textAnchor="middle" fontSize={FS} fontWeight={700} fill="#4ADE80">{fmtAmt(totalPaid)}</text>
            <text x={W-28} y={fy+26} textAnchor="end" fontSize={FS_SM} fill="#94A3B8">Balance: <tspan fill={balance>0?"#FCA5A5":"#4ADE80"} fontWeight={700}>{fmtAmt(balance)}</tspan></text>
          </g>
        );
      })()}

      {/* Footer note */}
      <text x={W/2} y={H-18} textAnchor="middle" fontSize={6.5} fill="#94A3B8">
        Generated by Groww Karo • www.growwkaro.com • +919430050782 • karogroww@gmail.com
      </text>
    </svg>
  );
});

export default SIPLedgerSheet;
