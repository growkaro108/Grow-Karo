import React, { forwardRef } from "react";
import { Phone, Globe, Mail } from "lucide-react";
import { daysToMonths } from "./user-management/format";

/**
 * BondCertificate — renders an Investment Bond form as SVG (A4 portrait, matches the printed bond).
 *
 * `bond` / `userData` fields are the same as before (all optional, safely defaulted).
 *
 * Optional image props (all URLs) for the "printed" look:
 *   logoUrl       top-left GROWW karo logo
 *   profilePhoto  applicant photo (top-right, rectangular)
 *   stampUrl      round company stamp (bottom-right)
 *   watermarkUrl  faint logo behind the form
 *
 * Fonts: body is Helvetica/Arial. The title uses Playfair Display when available
 * (load it with next/font and expose `--font-playfair`), falling back to Georgia.
 */

const FONT_SANS =
  '"Helvetica Neue", Helvetica, Arial, "Liberation Sans", sans-serif';
const FONT_SERIF =
  'var(--font-playfair, "Playfair Display"), "Playfair Display", Georgia, "Times New Roman", serif';

const INK = "#222222";
const TAN = "#B39273"; // table borders / dividers
const FS = 8.1; // body text size
const FS_HEAD = 9.7; // section headings

function CheckBox({ x, y, checked }) {
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

const BondCertificate = forwardRef(function BondCertificate(
  {
    bond = {},
    userName,
    scheme,
    profilePhoto,
    logoUrl,
    stampUrl,
    watermarkUrl,
    companyName = "GROWW_KARO",
    companyTagline = "\u090F\u0915 \u0915\u0926\u092E \u0906\u0924\u094D\u092E\u0928\u093F\u0930\u094D\u092D\u0930\u0924\u093E \u0915\u0940 \u0913\u0930",
    className = "",
    userData = {},
  },
  ref,
) {
  const user = userData || {};

  const name = user.name || userName || bond.fullName || "";
  const marital = String(
    user.maritalStatus || bond.maritalStatus || "",
  ).toLowerCase();
  const isMarried = marital === "married";
  const isSingle = marital === "single";

  const payMode = bond.paymentMode || "Cash";
  const terms =
    bond.terms && bond.terms.length
      ? bond.terms
      : [
        "This Bond is valid only till maturity date*",
        `Profit will be generated within 7 to 10 working days after completion of tenure in ( ${payMode} )*`,
        "Payment is not made on Saturday, Sunday and Bank Holidays as the office remains closed*",
      ];

  // dd/mm/yyyy, like the printed bond
  const safeDate = (val) => {
    if (!val) return "";
    const str = String(val).trim();
    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(str)) return str.replace(/-/g, "/");
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
    return str;
  };

  // 30000 -> "30,000/-"
  const formatAmount = (v) => {
    if (v === undefined || v === null || v === "") return "";
    const n = Number(String(v).replace(/,/g, ""));
    return Number.isFinite(n) ? `${n.toLocaleString("en-IN")}/-` : String(v);
  };

  const wrapText = (text, maxChars) => {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let current = "";
    words.forEach((w) => {
      const next = current ? `${current} ${w}` : w;
      if (next.length > maxChars && current) {
        lines.push(current);
        current = w;
      } else {
        current = next;
      }
    });
    if (current) lines.push(current);
    return lines.slice(0, 2);
  };
  const addressLines = wrapText(user.address || bond.address || "", 84);

  // ---------- layout (units are viewBox units; A4 ≈ 480 x 679) ----------
  const W = 480;
  const LX = 49;
  const RX = 434;
  const CW = RX - LX;
  const PAD = 6.5;
  const baseOff = (h) => h / 2 + 2.9; // vertical centre for FS text

  let y = 152;
  const personalTop = y;
  const rFullName = y; const hFullName = 19; y += hFullName;
  const rFatherName = y; const hFather = 21; y += hFather;
  const rDobEmail = y; const hDob = 21; y += hDob;
  const rAddress = y; const hAddress = 34.5; y += hAddress;
  const rMarital = y; const hMarital = 19.7; y += hMarital;
  const hRow = 19.6;
  const rAadhaar = y; y += hRow;
  const rNomineeName = y; y += hRow;
  const rRelation = y; y += hRow;
  const rNomineeMobile = y; y += hRow;
  const rNomineeAadhaar = y; y += hRow;
  const personalBottom = y;

  const customerLabelY = personalBottom + 18.3;
  const customerTop = customerLabelY + 5;
  const custRowH = 19.2;
  const rAccNo = customerTop;
  const rIfsc = customerTop + custRowH;
  const rAccHolder = customerTop + custRowH * 2;
  const customerBottom = customerTop + custRowH * 3;

  const termsTop = customerBottom + 13.5;
  const termLineH = 9.7;

  const investLabelY = termsTop + (terms.length - 1) * termLineH + 21;
  const investTop = investLabelY + 8;
  const investHeadH = 20.5;
  const investRowH = 21.3;
  const investBottom = investTop + investHeadH + investRowH;
  const colRatios = [0.2245, 0.2415, 0.2735, 0.2605];
  const colX = [LX];
  colRatios.forEach((r) => colX.push(colX[colX.length - 1] + r * CW));

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

  // ---------- helpers ----------
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
        <text x={LX + PAD} y={ty} fontSize={FS}>{label}</text>
        <text x={145} y={ty} fontSize={FS}>-</text>
        <text x={157} y={ty} fontSize={FS}>{value}</text>
      </g>
    );
  };

  const [brandTop, ...brandRest] = String(companyName).split(/[\s_]+/);
  const brandBottom = brandRest.join(" ").toLowerCase();

  const investValues = [
    bond.tenure
      ? `${daysToMonths(bond.tenure)}`
      : bond.tenureMonths
        ? `${bond.tenureMonths} Months`
        : "",
    formatAmount(bond.paidAmount),
    bond.investmentMode ||
    (bond.profitPercentage ? `${bond.profitPercentage}% Flat` : ""),
    safeDate(bond.maturityDate),
  ];

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

      {/* ---------- Header ---------- */}
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
              fontSize={10}
              letterSpacing={3}
              fill="#4F6EF7"
            >
              {brandBottom}
            </text>
          )}
          <text x={98} y={128} textAnchor="middle" fontSize={6.2} fill="#16A34A">
            {companyTagline}
          </text>
        </>
      )}

      <text
        x={254}
        y={76}
        textAnchor="middle"
        fontSize={22}
        fontWeight={700}
        style={{ fontFamily: FONT_SERIF }}
      >
        Investment Bond
      </text>
      {scheme || bond.schemeName ? (
        <text
          x={254}
          y={94}
          textAnchor="middle"
          fontSize={19}
          fontWeight={700}
          letterSpacing={0.5}
          fill="#333333"
          style={{ fontFamily: FONT_SERIF }}
        >
          {String(scheme || bond.schemeName).toUpperCase()}
        </text>
      ) : null}

      {/* applicant photo */}
      {profilePhoto ? (
        <image
          href={profilePhoto}
          x={372}
          y={42}
          width={53}
          height={65}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <>
          <rect
            x={372}
            y={42}
            width={53}
            height={65}
            fill="#F3F4F6"
            stroke="#D1D5DB"
            strokeWidth={0.6}
          />
          <text
            x={398.5}
            y={82}
            textAnchor="middle"
            fontSize={20}
            fill="#9CA3AF"
          >
            {(name || "?").trim().charAt(0).toUpperCase()}
          </text>
        </>
      )}

      {/* date / mobile boxes */}
      <rect x={224} y={116} width={94} height={20} fill="none" stroke={TAN} strokeWidth={0.7} />
      <rect x={318} y={116} width={116} height={20} fill="none" stroke={TAN} strokeWidth={0.7} />
      <text x={229.5} y={129.5} fontSize={9.4}>
        Date - {safeDate(bond.enrollmentDate || bond.date || bond.paidDate || bond.requestDate)}
      </text>
      <text x={323} y={129.5} fontSize={9.4}>
        Mob No. - {user.phone || bond.mobileNo || ""}
      </text>
      <text x={431} y={147} textAnchor="end" fontSize={7.6}>
        S. No. - {bond.userSchemeId || bond.id || ""}
      </text>

      {/* ---------- Personal Information ---------- */}
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
        rFatherName,
        rDobEmail,
        rAddress,
        rMarital,
        rAadhaar,
        rNomineeName,
        rRelation,
        rNomineeMobile,
        rNomineeAadhaar,
      ].map((ly) => (
        <line key={ly} x1={LX} y1={ly} x2={RX} y2={ly} stroke={TAN} strokeWidth={0.6} />
      ))}
      <line x1={225} y1={rDobEmail} x2={225} y2={rDobEmail + hDob} stroke={TAN} strokeWidth={0.6} />

      {rowText(rFullName, hFullName, "Full Name", name)}
      {rowText(
        rFatherName,
        hFather,
        "Father's Name",
        user.gaurdianName || user.guardianName || bond.fatherName || "",
      )}
      <text x={LX + PAD} y={rDobEmail + baseOff(hDob)} fontSize={FS}>
        DOB - {safeDate(user.dob || bond.dob)}
      </text>
      <text x={234} y={rDobEmail + baseOff(hDob)} fontSize={FS}>
        Email - {user.email || bond.email || ""}
      </text>

      <text x={LX + PAD} y={rAddress + 13} fontSize={FS}>
        Address - {addressLines[0] || ""}
      </text>
      {addressLines[1] && (
        <text x={LX + PAD} y={rAddress + 25} fontSize={FS}>
          {addressLines[1]}
        </text>
      )}

      <text x={LX + PAD} y={rMarital + baseOff(hMarital)} fontSize={FS}>
        Marital Status
      </text>
      <CheckBox x={136} y={rMarital + 5.6} checked={isSingle} />
      <text x={149} y={rMarital + baseOff(hMarital)} fontSize={FS}>Single</text>
      <CheckBox x={184} y={rMarital + 5.6} checked={isMarried} />
      <text x={197} y={rMarital + baseOff(hMarital)} fontSize={FS}>Married</text>

      {rowText(rAadhaar, hRow, "Aadhaar No.", user.aadhaarNo || user.aadharNo || bond.aadhaarNo || bond.aadharNo || "")}
      {rowText(rNomineeName, hRow, "Nominee Name", bond.nominee?.name || bond.nomineeName || user.nomineeName || "")}
      {rowText(rRelation, hRow, "Relation", bond.nominee?.relation || bond.nomineeRelation || user.nomineeRelation || "")}
      {rowText(rNomineeMobile, hRow, "Nominee Mob. No.", bond.nominee?.mobileNo || bond.nominee?.mobile || bond.nomineeMobile || user.nomineeMobile || "")}
      {rowText(
        rNomineeAadhaar,
        hRow,
        "Nominee Aadhaar No.",
        bond.nominee?.aadharNo || bond.nominee?.aadhaarNo || bond.nomineeAadhaar || user.nomineeAadhaar || "",
      )}

      {/* ---------- Customer A/C Details ---------- */}
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
      <line x1={LX} y1={rIfsc} x2={RX} y2={rIfsc} stroke={TAN} strokeWidth={0.6} />
      <line x1={LX} y1={rAccHolder} x2={RX} y2={rAccHolder} stroke={TAN} strokeWidth={0.6} />
      {rowText(rAccNo, custRowH, "Account No.", user.accountNo || user.accountNumber || bond.accountNo || "")}
      {rowText(
        rIfsc,
        custRowH,
        "IFSC",
        `${user.ifsc || bond.ifsc || ""}${user.bankName || bond.bankName ? ` ( ${user.bankName || bond.bankName} )` : ""}`,
      )}
      {rowText(rAccHolder, custRowH, "A/C Holder Name", user.accountHolderName || bond.accountHolderName || name || "")}

      {/* ---------- Terms ---------- */}
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

      {/* ---------- Investment Type ---------- */}
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
      {[1, 2, 3].map((i) => (
        <line
          key={i}
          x1={colX[i]}
          y1={investTop}
          x2={colX[i]}
          y2={investTop + investHeadH + investRowH}
          stroke={TAN}
          strokeWidth={0.6}
        />
      ))}
      {["Tenure", "Amount", "Mode of Investment", "Date of Maturity"].map(
        (label, i) => (
          <text
            key={label}
            x={(colX[i] + colX[i + 1]) / 2}
            y={investTop + baseOff(investHeadH)}
            textAnchor="middle"
            fontSize={FS}
            fontWeight={700}
          >
            {label}
          </text>
        ),
      )}
      {investValues.map((val, i) => (
        <text
          key={i}
          x={(colX[i] + colX[i + 1]) / 2}
          y={investTop + investHeadH + baseOff(investRowH)}
          textAnchor="middle"
          fontSize={FS}
        >
          {val}
        </text>
      ))}

      {/* ---------- Company A/C Details ---------- */}
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
      {compRow(rCompAccNo, "Account No.", bond.companyAccountNo || "531110110003289")}
      {compRow(rCompIfsc, "IFSC", bond.companyIfsc || "SBIN0007834")}
      {compRow(rCompAccHolder, "A/C Holder Name", bond.companyAccountHolderName || "GROWWKARO")}

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

      {/* ---------- Footer ---------- */}
      <Phone x={52} y={footerY - 9.5} width={10.5} height={10.5} color={TAN} strokeWidth={2} />
      <text x={66} y={footerY} fontSize={8.3}>
        {bond.companyPhone || "+919430050782"}
      </text>

      <Globe x={192} y={footerY - 9.5} width={10.5} height={10.5} color="#16A34A" strokeWidth={2} />
      <text x={206} y={footerY} fontSize={8.3}>
        {bond.companyWebsite || "www.growwkaro.com"}
      </text>

      <Mail x={335} y={footerY - 9.5} width={10.5} height={10.5} color="#16A34A" strokeWidth={2} />
      <text x={349} y={footerY} fontSize={8.3}>
        {bond.companyEmail || "karogroww@gmail.com"}
      </text>
    </svg>
  );
});

export default BondCertificate;