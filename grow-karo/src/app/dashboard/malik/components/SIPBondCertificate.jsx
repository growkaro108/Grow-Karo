"use client";
import React, { forwardRef } from "react";
import { Phone, Globe, Mail } from "lucide-react";
import { getSipPremium } from "./user-management/format";

const FONT_SANS =
  '"Helvetica Neue", Helvetica, Arial, "Liberation Sans", sans-serif';
const FONT_SERIF =
  'var(--font-playfair,"Playfair Display"),"Playfair Display",Georgia,"Times New Roman",serif';

const INK = "#222222";
const TAN = "#B39273";
const FS = 8.1;
const FS_HEAD = 9.7;

function CheckBoxSVG({ x, y, checked }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={8.5}
        height={8.5}
        rx={0.8}
        fill="#FFFFFF"
        stroke={TAN}
        strokeWidth={0.6}
      />
      {checked && (
        <path
          d={`M${x + 1.8} ${y + 4.4} L${x + 3.7} ${y + 6.3} L${x + 7} ${y + 2.3}`}
          fill="none"
          stroke={INK}
          strokeWidth={0.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </g>
  );
}

const SIPBondCertificate = forwardRef(function SIPBondCertificate(
  {
    bond = {},
    userData = {},
    logoUrl,
    stampUrl,
    watermarkUrl,
    companyName = "GROWW_KARO",
    className = "",
    profilePhoto,
  },
  ref,
) {
  const user = userData || {};
  const safeDate = (val) => {
    if (!val) return "";
    const str = String(val).trim();
    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(str)) return str.replaceAll("-", "/");
    const d = new Date(val);
    if (!Number.isNaN(d.getTime()))
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    return str;
  };
  const fmtAmt = (v) => {
    if (v === undefined || v === null || v === "") return "";
    const n = Number(String(v).replaceAll(",", ""));
    return Number.isFinite(n) ? `${n.toLocaleString("en-IN")}/-` : String(v);
  };
  const wrapText = (text, maxChars) => {
    const words = String(text || "")
      .split(/\s+/)
      .filter(Boolean);
    const lines = [];
    let current = "";
    words.forEach((w) => {
      const next = current ? `${current} ${w}` : w;
      if (next.length > maxChars && current) {
        lines.push(current);
        current = w;
      } else current = next;
    });
    if (current) lines.push(current);
    return lines.slice(0, 2);
  };

  const name = user.name || bond.fullName || "";
  const addressLines = wrapText(user.address || bond.address || "", 84);
  const tenureMonths =
    bond.tenureMonths ||
    (bond.tenure ? Math.round(Number(bond.tenure) / 30) : "");
  const isDailyDeposit = bond.planType === "DAILY_DEPOSIT";
  const sipAmount = getSipPremium(bond);
  const sipFrequency =
    String(bond.sipFrequency || "MONTHLY").toUpperCase() === "DAILY"
      ? "DAILY"
      : "MONTHLY";
  const defaultTerms = [
    isDailyDeposit
      ? "Profit is calculated from the date of each deposit*"
      : "The profit will be applicable on total deposit amount*",
    "This bond is valid only till maturity date*",
    "Profit will be credited 30 days*",
    isDailyDeposit
      ? "Each deposit must meet the scheme minimum; total deposits are limited to ₹2,000 per day.*"
      : sipFrequency === "DAILY"
      ? "Daily installments are due every calendar day.*"
      : "Monthly installments are due once each month.*",
  ];
  const terms = bond.terms?.length ? bond.terms : defaultTerms;

  const W = 480,
    LX = 49,
    RX = 434,
    CW = RX - LX,
    PAD = 6.5;
  const baseOff = (h) => h / 2 + 2.9;

  let y = 152;
  const personalTop = y;
  const rFullName = y;
  const hFullName = 19;
  y += hFullName;
  const rHusband = y;
  const hHusband = 21;
  y += hHusband;
  const rDobEmail = y;
  const hDob = 21;
  y += hDob;
  const rAddress = y;
  const hAddress = 34.5;
  y += hAddress;
  const hRow = 19.6;
  const rAadhaar = y;
  y += hRow;
  const rNomineeName = y;
  y += hRow;
  const rRelation = y;
  y += hRow;
  const rNomineeMobile = y;
  y += hRow;
  const rNomineeAadhaar = y;
  y += hRow;
  const personalBottom = y;

  const customerLabelY = personalBottom + 18.3;
  const customerTop = customerLabelY + 5;
  const custRowH = 19.2;
  const rAccName = customerTop;
  const rAccNo = customerTop + custRowH;
  const rBankName = customerTop + custRowH * 2;
  const customerBottom = customerTop + custRowH * 3;

  const termsTop = customerBottom + 13.5;
  const termLineH = 9.7;

  const investLabelY = termsTop + (terms.length - 1) * termLineH + 21;
  const investTop = investLabelY + 8;
  const investHeadH = 20.5;
  const investRowH = 21.3;
  const investBottom = investTop + investHeadH + investRowH;

  const colX3 = [LX];
  [0.333, 0.333, 0.334].forEach((r) => colX3.push(colX3.at(-1) + r * CW));

  const companyLabelY = investBottom + 18;
  const companyTop = companyLabelY + 8;
  const compRowH = 18.5;
  const rCompAccNo = companyTop;
  const rCompIfsc = companyTop + compRowH;
  const rCompAccHolder = companyTop + compRowH * 2;
  const companyBottom = companyTop + compRowH * 3;
  const COMPANY_W = 267;

  const footerY = companyBottom + 22;
  const H = Math.round(footerY + 26);

  const heading = (text, hy) => (
    <text x={LX + 2.5} y={hy} fontSize={FS_HEAD} fontWeight={700}>
      {text}
    </text>
  );
  const rowText = (rowY, h, label, value) => (
    <text x={LX + PAD} y={rowY + baseOff(h)} fontSize={FS}>
      {label ? `${label} - ` : ""}
      {value}
    </text>
  );
  const compRow = (rowY, label, value) => {
    const ty = rowY + baseOff(compRowH);
    return (
      <g>
        <text x={LX + PAD} y={ty} fontSize={FS}>
          {label}
        </text>
        <text x={145} y={ty} fontSize={FS}>
          -
        </text>
        <text x={157} y={ty} fontSize={FS}>
          {value}
        </text>
      </g>
    );
  };

  const [brandTop, ...brandRest] = String(companyName).split(/[\s_]+/);
  const brandBottom = brandRest.join(" ").toLowerCase();

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMin meet"
      fill={INK}
      style={{
        width: "100%",
        height: "auto",
        display: "block",
        fontFamily: FONT_SANS,
      }}
    >
      <rect x="0" y="0" width={W} height={H} fill="#FFFFFF" />
      {watermarkUrl && (
        <image
          href={watermarkUrl}
          x={LX + 10}
          y={120}
          width={CW - 20}
          height={H - 160}
          opacity={0.1}
          preserveAspectRatio="xMidYMid meet"
        />
      )}

      {logoUrl ? (
        <image
          href={logoUrl}
          x={50}
          y={18}
          width={96}
          height={118}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <>
          <text x={98} y={104} textAnchor="middle" fontSize={20} fill="#16A34A">
            {brandTop}
          </text>
          {brandBottom && (
            <text
              x={98}
              y={118}
              textAnchor="middle"
              fontSize={9}
              letterSpacing={3}
              fill="#4F6EF7"
            >
              {brandBottom}
            </text>
          )}
          <text
            x={98}
            y={128}
            textAnchor="middle"
            fontSize={6.2}
            fill="#16A34A"
          >
            एक कदम आत्मनिर्भरता की ओर
          </text>
        </>
      )}

      <text
        x={254}
        y={70}
        textAnchor="middle"
        fontSize={22}
        fontWeight={700}
        style={{ fontFamily: FONT_SERIF }}
      >
        Systematic
      </text>
      <text
        x={254}
        y={92}
        textAnchor="middle"
        fontSize={22}
        fontWeight={700}
        style={{ fontFamily: FONT_SERIF }}
      >
        Investment Plan
      </text>

      <rect
        x={224}
        y={100}
        width={115}
        height={18}
        fill="none"
        stroke={TAN}
        strokeWidth={0.7}
      />
      <rect
        x={224}
        y={120}
        width={115}
        height={18}
        fill="none"
        stroke={TAN}
        strokeWidth={0.7}
      />
      <text x={229} y={113} fontSize={8.5}>
        Invest Date - {safeDate(bond.paidDate || bond.enrollmentDate)}
      </text>
      <text x={229} y={133} fontSize={8.5}>
        Maturity Date - {safeDate(bond.maturityDate)}
      </text>

      <text x={431} y={147} textAnchor="end" fontSize={7.6}>
        S. No.- {bond.bondNumber || bond.userSchemeId || "GKSIP00XX"}
      </text>

      {profilePhoto ? (
        <image
          href={profilePhoto}
          x={374}
          y={28}
          width={53}
          height={65}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <>
          <rect
            x={374}
            y={28}
            width={53}
            height={65}
            fill="#F3F4F6"
            stroke={TAN}
            strokeWidth={0.7}
          />
          <text x={400} y={67} textAnchor="middle" fontSize={22} fill="#9CA3AF">
            {(name || "?").trim().charAt(0).toUpperCase()}
          </text>
        </>
      )}
      {heading("Personal Information", 144)}
      <rect
        x={LX}
        y={personalTop}
        width={CW}
        height={personalBottom - personalTop}
        fill="none"
        stroke={TAN}
        strokeWidth={0.7}
      />
      {[
        rHusband,
        rDobEmail,
        rAddress,
        rAadhaar,
        rNomineeName,
        rRelation,
        rNomineeMobile,
        rNomineeAadhaar,
      ].map((ly) => (
        <line
          key={ly}
          x1={LX}
          y1={ly}
          x2={RX}
          y2={ly}
          stroke={TAN}
          strokeWidth={0.6}
        />
      ))}
      <line
        x1={225}
        y1={rDobEmail}
        x2={225}
        y2={rDobEmail + hDob}
        stroke={TAN}
        strokeWidth={0.6}
      />

      {rowText(rFullName, hFullName, "Full Name", name)}
      {rowText(
        rHusband,
        hHusband,
        "Husband Name",
        user.gaurdianName || user.guardianName || bond.fatherName || "",
      )}
      <text x={LX + PAD} y={rDobEmail + baseOff(hDob)} fontSize={FS}>
        DOB - {safeDate(user.dob || bond.dob)}
      </text>
      <text x={234} y={rDobEmail + baseOff(hDob)} fontSize={FS}>
        Email - {user.email || bond.email || "N/A"}
      </text>
      <text x={LX + PAD} y={rAddress + 13} fontSize={FS}>
        Address - {addressLines[0] || ""}
      </text>
      {addressLines[1] && (
        <text x={LX + PAD} y={rAddress + 25} fontSize={FS}>
          {addressLines[1]}
        </text>
      )}
      {rowText(
        rAadhaar,
        hRow,
        "Aadhaar No",
        user.aadhaarNo || user.aadharNo || "",
      )}
      {rowText(rNomineeName, hRow, "Nominee Name", bond.nominee?.name || "")}
      {rowText(rRelation, hRow, "Relation", bond.nominee?.relation || "")}
      {rowText(
        rNomineeMobile,
        hRow,
        "Nominee Mob. No.",
        bond.nominee?.phone || bond.nominee?.mobileNo || "",
      )}
      {rowText(
        rNomineeAadhaar,
        hRow,
        "Nominee Aadhaar No.",
        bond.nominee?.aadhaarNo || bond.nominee?.aadharNo || "",
      )}

      {heading("Customer A/C Details", customerLabelY)}
      <rect
        x={LX}
        y={customerTop}
        width={CW}
        height={customerBottom - customerTop}
        fill="none"
        stroke={INK}
        strokeWidth={0.8}
      />
      <line
        x1={LX}
        y1={rAccNo}
        x2={RX}
        y2={rAccNo}
        stroke={TAN}
        strokeWidth={0.6}
      />
      <line
        x1={LX}
        y1={rBankName}
        x2={RX}
        y2={rBankName}
        stroke={TAN}
        strokeWidth={0.6}
      />
      {rowText(
        rAccName,
        custRowH,
        "A/C Holder Name",
        user.accountHolderName || name,
      )}
      {rowText(
        rAccNo,
        custRowH,
        "Account No",
        user.accountNo || user.accountNumber || "",
      )}
      {rowText(
        rBankName,
        custRowH,
        "IFSC",
        [
          user.ifsc || user.ifscCode || "",
          user.bankName ? `(${user.bankName})` : "",
        ]
          .filter(Boolean)
          .join("  "),
      )}

      {terms.map((t, i) => {
        const ty = termsTop + i * termLineH;
        return (
          <g key={i}>
            <circle cx={LX + 2.5} cy={ty - 2.6} r={1.3} />
            <text x={LX + 7.5} y={ty} fontSize={7.6}>
              {t}
            </text>
          </g>
        );
      })}

      {heading("Investment Type", investLabelY)}
      <rect
        x={LX}
        y={investTop}
        width={CW}
        height={investHeadH + investRowH}
        fill="none"
        stroke={TAN}
        strokeWidth={0.7}
      />
      <line
        x1={LX}
        y1={investTop + investHeadH}
        x2={RX}
        y2={investTop + investHeadH}
        stroke={TAN}
        strokeWidth={0.6}
      />
      {[1, 2].map((i) => (
        <line
          key={i}
          x1={colX3[i]}
          y1={investTop}
          x2={colX3[i]}
          y2={investTop + investHeadH + investRowH}
          stroke={TAN}
          strokeWidth={0.6}
        />
      ))}
      {[
        "Your Fix Plan",
        "Tenure Month",
        isDailyDeposit
          ? "Daily Deposit"
          : sipFrequency === "DAILY"
            ? "Daily Installment"
            : "Monthly Installment",
      ].map((label, i) => (
        <text
          key={label}
          x={(colX3[i] + colX3[i + 1]) / 2}
          y={investTop + baseOff(investHeadH)}
          textAnchor="middle"
          fontSize={FS}
          fontWeight={700}
        >
          {label}
        </text>
      ))}
      {[
        isDailyDeposit ? "DAILY DEPOSIT PLAN" : "SIP PLAN",
        `${tenureMonths} Month`,
        sipAmount === null ? "Variable" : fmtAmt(sipAmount),
      ].map((val, i) => (
        <text
          key={i}
          x={(colX3[i] + colX3[i + 1]) / 2}
          y={investTop + investHeadH + baseOff(investRowH)}
          textAnchor="middle"
          fontSize={FS}
        >
          {val}
        </text>
      ))}

      {heading("Company A/C Details", companyLabelY)}
      <rect
        x={LX}
        y={companyTop}
        width={COMPANY_W}
        height={companyBottom - companyTop}
        fill="none"
        stroke={INK}
        strokeWidth={0.8}
      />
      {compRow(
        rCompAccNo,
        "Account No.",
        bond.companyAccountNo || "01930210005200",
      )}
      {compRow(rCompIfsc, "IFSC", bond.companyIfsc || "UCBA0000193")}
      {compRow(
        rCompAccHolder,
        "A/C Holder Name",
        bond.companyAccountHolderName || "Groww Karo",
      )}
      {stampUrl && (
        <image
          href={stampUrl}
          x={358}
          y={companyTop - 7}
          width={66}
          height={66}
          preserveAspectRatio="xMidYMid meet"
        />
      )}

      {/* <rect x={LX} y={footerY-14} width={42} height={42} fill="#F3F4F6" stroke={TAN} strokeWidth={0.5}/> */}
      {/* <text x={LX+21} y={footerY+10} textAnchor="middle" fontSize={5} fill="#9CA3AF">Scan &amp; Deposit</text> */}

      <Phone
        x={LX + 50}
        y={footerY - 9.5}
        width={10.5}
        height={10.5}
        color={TAN}
        strokeWidth={2}
      />
      <text x={LX + 64} y={footerY} fontSize={8.3}>
        {bond.companyPhone || "+919430050782"}
      </text>
      <Globe
        x={230}
        y={footerY - 9.5}
        width={10.5}
        height={10.5}
        color="#16A34A"
        strokeWidth={2}
      />
      <text x={244} y={footerY} fontSize={8.3}>
        {bond.companyWebsite || "www.growwkaro.com"}
      </text>
      <Mail
        x={365}
        y={footerY - 9.5}
        width={10.5}
        height={10.5}
        color="#16A34A"
        strokeWidth={2}
      />
      <text x={379} y={footerY} fontSize={8.3}>
        {bond.companyEmail || "karogroww@gmail.com"}
      </text>
    </svg>
  );
});

export default SIPBondCertificate;
