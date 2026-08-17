import React, { forwardRef } from "react";
import { Phone, Globe, Mail, CheckSquare, Square } from "lucide-react";
import { currency, formatDate } from "@/app/plan/utils/planUtils";

/**
 * BondCertificate — renders an Investment Bond form as SVG.
 *
 * Expected shape of `bond` (all optional, safely defaulted):
 * {
 *   userSchemeId,      // -> Serial / S.No.
 *   date,              // form date, e.g. "23/03/2026"
 *   mobileNo,          // applicant mobile shown top-right
 *
 *   fullName,          // falls back to `userName` prop if omitted
 *   fatherName,
 *   dob,
 *   email,
 *   address,
 *   maritalStatus,     // "single" | "married"
 *   aadhaarNo,
 *
 *   nomineeName,
 *   nomineeRelation,
 *   nomineeMobile,
 *   nomineeAadhaar,
 *
 *   accountNo,         // customer bank account
 *   ifsc,
 *   bankName,
 *   accountHolderName,
 *
 *   tenureMonths,
 *   paidAmount,
 *   profitPercentage,
 *   investmentMode,    // e.g. "7% Flat"
 *   maturityDate,
 *
 *   companyAccountNo,
 *   companyIfsc,
 *   companyAccountHolderName,
 *
 *   terms,             // optional array of strings (bullet points)
 * }
 *
 * profilePhoto: image URL shown in the top-right circle (replaces the red dot).
 * logoUrl: optional company logo image URL for the top-left mark.
 */
const BondCertificate = forwardRef(function BondCertificate(
  {
    bond = {},
    userName,
    scheme,
    profilePhoto,
    logoUrl,
    companyName = "GROWW karo",
    companyTagline = "\u090F\u0915 \u0915\u0926\u092E \u0906\u0924\u094D\u092E\u0928\u093F\u0930\u094D\u092D\u0930\u0924\u093E \u0915\u0940 \u0913\u0930",
    className = "",
  },
  ref,
) {
  const uid = bond.userSchemeId ?? "certificate";
  const photoClipId = `photo-clip-${uid}`;

  const name = bond.fullName || userName || "";
  const isMarried =
    String(bond.maritalStatus || "").toLowerCase() === "married";
  const isSingle = String(bond.maritalStatus || "").toLowerCase() === "single";

  const terms =
    bond.terms && bond.terms.length
      ? bond.terms
      : [
          "Profit will be credited 23 to 03 at every month*",
          "Closure charge will be imposed as per the maturity tenure*",
          "This Bond is valid only till maturity date*",
          "Amount will be returned in 7 working days*",
        ];

  // ---- wrap helper for the Address line (rough char-count based) ----
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
      } else {
        current = next;
      }
    });
    if (current) lines.push(current);
    return lines.slice(0, 2); // cap at 2 lines to fit the row
  };
  const addressLines = wrapText(bond.address, 58);

  // ---- layout constants ----
  const W = 480;
  const H = 800;
  const LX = 30; // left content edge
  const RX = 450; // right content edge
  const CW = RX - LX;

  const rowH = 24;
  let y = 140; // running cursor for the personal-info table

  const personalTop = y;
  const rFullName = y;
  y += rowH; // 140-164
  const rFatherName = y;
  y += rowH; // 164-188
  const rDobEmail = y;
  y += rowH; // 188-212
  const rAddress = y;
  y += 40; // 212-252 (taller)
  const rMarital = y;
  y += 22; // 252-274
  const rAadhaar = y;
  y += rowH; // 274-298
  const rNomineeName = y;
  y += rowH; // 298-322
  const rRelation = y;
  y += rowH; // 322-346
  const rNomineeMobile = y;
  y += rowH; // 346-370
  const rNomineeAadhaar = y;
  y += rowH; // 370-394
  const personalBottom = y;

  const customerLabelY = personalBottom + 20;
  const customerTop = customerLabelY + 6;
  const custRowH = 24;
  const rAccNo = customerTop;
  const rIfsc = customerTop + custRowH;
  const rAccHolder = customerTop + custRowH * 2;
  const customerBottom = customerTop + custRowH * 3;

  const termsTop = customerBottom + 18;
  const termLineH = 13;

  const investLabelY = termsTop + terms.length * termLineH + 14;
  const investTop = investLabelY + 8;
  const investHeadH = 22;
  const investRowH = 26;
  const investBottom = investTop + investHeadH + investRowH;
  const colW = CW / 4;

  const companyLabelY = investBottom + 20;
  const companyTop = companyLabelY + 6;
  const rCompAccNo = companyTop;
  const rCompIfsc = companyTop + custRowH;
  const rCompAccHolder = companyTop + custRowH * 2;
  const companyBottom = companyTop + custRowH * 3;

  const footerY = companyBottom + 46;

  const rowText = (rowY, h, label, value, opts = {}) => (
    <text
      x={LX + 8}
      y={rowY + h / 2 + 4}
      fontFamily="Georgia, serif"
      fontSize={opts.fontSize || 9.5}
      fill="#1F2937"
    >
      {label ? `${label} - ` : ""}
      <tspan fontWeight="600" fill={opts.valueColor || "#111827"}>
        {value}
      </tspan>
    </text>
  );

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMin meet"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <defs>
        <clipPath id={photoClipId}>
          <circle cx={440} cy={46} r={28} />
        </clipPath>
      </defs>

      <rect x="0" y="0" width={W} height={H} fill="#FFFFFF" />
      <rect
        x="4"
        y="4"
        width={W - 8}
        height={H - 8}
        fill="none"
        stroke="#0E4749"
        strokeWidth="1.5"
      />

      {/* ---------- Header ---------- */}
      {logoUrl ? (
        <image
          href={logoUrl}
          x={20}
          y={12}
          width={170}
          height={64}
          preserveAspectRatio="xMinYMid meet"
        />
      ) : (
        <>
          <rect x={24} y={16} width={40} height={40} rx={8} fill="#EAF7EE" />
          <text
            x={44}
            y={42}
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontSize="16"
            fontWeight="bold"
            fill="#16A34A"
          >
            G
          </text>
          <text
            x={70}
            y={32}
            fontFamily="Georgia, serif"
            fontSize="13"
            fontWeight="bold"
            fill="#16A34A"
          >
            {companyName.split(" ")[0]}
            <tspan fill="#0E4749">
              {" "}
              {companyName.split(" ").slice(1).join(" ")}
            </tspan>
          </text>
          <text
            x={70}
            y={44}
            fontFamily="Georgia, serif"
            fontSize="6.5"
            fill="#4B5563"
          >
            {companyTagline}
          </text>
        </>
      )}

      <text
        x={270}
        y={44}
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="20"
        fontWeight="bold"
        fill="#111827"
      >
        Investment Bond
      </text>
      {scheme ? (
        <text
          x={270}
          y={60}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="9"
          letterSpacing="2"
          fill="#B98B3E"
        >
          {scheme.toUpperCase()}
        </text>
      ) : null}

      {/* profile photo */}
      <circle cx={440} cy={46} r={29} fill="#F3F4F6" stroke="#D1D5DB" />
      {profilePhoto ? (
        <image
          href={profilePhoto}
          x={412}
          y={18}
          width={56}
          height={56}
          clipPath={`url(#${photoClipId})`}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <text
          x={440}
          y={52}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="16"
          fill="#9CA3AF"
        >
          {(name || "?").trim().charAt(0).toUpperCase()}
        </text>
      )}

      {/* date / mobile boxes */}
      <rect
        x={190}
        y={82}
        width={130}
        height={20}
        fill="none"
        stroke="#9CA3AF"
      />
      <text
        x={196}
        y={96}
        fontFamily="Georgia, serif"
        fontSize="8.5"
        fill="#1F2937"
      >
        Date - <tspan fontWeight="600">{bond.date}</tspan>
      </text>
      <rect
        x={325}
        y={82}
        width={125}
        height={20}
        fill="none"
        stroke="#9CA3AF"
      />
      <text
        x={331}
        y={96}
        fontFamily="Georgia, serif"
        fontSize="8.5"
        fill="#1F2937"
      >
        Mob No. - <tspan fontWeight="600">{bond.mobileNo}</tspan>
      </text>

      <text
        x={450}
        y={112}
        textAnchor="end"
        fontFamily="Georgia, serif"
        fontSize="8"
        fill="#6B7280"
      >
        S.No. - {bond.userSchemeId}
      </text>

      {/* ---------- Personal Information ---------- */}
      <text
        x={LX}
        y={132}
        fontFamily="Georgia, serif"
        fontSize="11"
        fontWeight="bold"
        fill="#111827"
      >
        Personal Information
      </text>

      <rect
        x={LX}
        y={personalTop}
        width={CW}
        height={personalBottom - personalTop}
        fill="none"
        stroke="#0E4749"
        strokeWidth="1"
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
      ].map((ly, i) => (
        <line
          key={i}
          x1={LX}
          y1={ly}
          x2={RX}
          y2={ly}
          stroke="#0E4749"
          strokeOpacity="0.35"
        />
      ))}

      {rowText(rFullName, rowH, "Full Name", name)}
      {rowText(rFatherName, rowH, "Father Name", bond.fatherName)}

      {/* DOB | Email split row */}
      <line
        x1={240}
        y1={rDobEmail}
        x2={240}
        y2={rDobEmail + rowH}
        stroke="#0E4749"
        strokeOpacity="0.35"
      />
      <text
        x={LX + 8}
        y={rDobEmail + rowH / 2 + 4}
        fontFamily="Georgia, serif"
        fontSize="9.5"
        fill="#1F2937"
      >
        DOB -{" "}
        <tspan fontWeight="600">
          {formatDate ? formatDate(bond.dob) : bond.dob}
        </tspan>
      </text>
      <text
        x={248}
        y={rDobEmail + rowH / 2 + 4}
        fontFamily="Georgia, serif"
        fontSize="9.5"
        fill="#1F2937"
      >
        Email - <tspan fontWeight="600">{bond.email}</tspan>
      </text>

      {/* Address (wraps up to 2 lines) */}
      <text
        x={LX + 8}
        y={rAddress + 15}
        fontFamily="Georgia, serif"
        fontSize="9.5"
        fill="#1F2937"
      >
        Address - <tspan fontWeight="600">{addressLines[0]}</tspan>
      </text>
      {addressLines[1] && (
        <text
          x={LX + 8}
          y={rAddress + 30}
          fontFamily="Georgia, serif"
          fontSize="9.5"
          fontWeight="600"
          fill="#111827"
        >
          {addressLines[1]}
        </text>
      )}

      {/* Marital status checkboxes */}
      <text
        x={LX + 8}
        y={rMarital + 14}
        fontFamily="Georgia, serif"
        fontSize="9.5"
        fill="#1F2937"
      >
        Marital Status
      </text>
      {isSingle ? (
        <CheckSquare
          x={200}
          y={rMarital + 4}
          width={13}
          height={13}
          color="#111827"
          strokeWidth={1.8}
        />
      ) : (
        <Square
          x={200}
          y={rMarital + 4}
          width={13}
          height={13}
          color="#374151"
          strokeWidth={1.5}
        />
      )}
      <text
        x={218}
        y={rMarital + 14}
        fontFamily="Georgia, serif"
        fontSize="9.5"
        fill="#1F2937"
      >
        Single
      </text>
      {isMarried ? (
        <CheckSquare
          x={262}
          y={rMarital + 4}
          width={13}
          height={13}
          color="#111827"
          strokeWidth={1.8}
        />
      ) : (
        <Square
          x={262}
          y={rMarital + 4}
          width={13}
          height={13}
          color="#374151"
          strokeWidth={1.5}
        />
      )}
      <text
        x={280}
        y={rMarital + 14}
        fontFamily="Georgia, serif"
        fontSize="9.5"
        fill="#1F2937"
      >
        Married
      </text>

      {rowText(rAadhaar, rowH, "Aadhaar No", bond.aadhaarNo)}
      {rowText(rNomineeName, rowH, "Nominee Name", bond.nomineeName)}
      {rowText(rRelation, rowH, "Relation", bond.nomineeRelation)}
      {rowText(rNomineeMobile, rowH, "Nominee Mob. No", bond.nomineeMobile)}
      {rowText(
        rNomineeAadhaar,
        rowH,
        "Nominee Aadhaar No",
        bond.nomineeAadhaar,
      )}

      {/* ---------- Customer A/C Details ---------- */}
      <text
        x={LX}
        y={customerLabelY}
        fontFamily="Georgia, serif"
        fontSize="11"
        fontWeight="bold"
        fill="#111827"
      >
        Customer A/C Details
      </text>
      <rect
        x={LX}
        y={customerTop}
        width={CW}
        height={customerBottom - customerTop}
        fill="none"
        stroke="#111827"
        strokeWidth="1.2"
      />
      <line
        x1={LX}
        y1={rIfsc}
        x2={RX}
        y2={rIfsc}
        stroke="#0E4749"
        strokeOpacity="0.35"
      />
      <line
        x1={LX}
        y1={rAccHolder}
        x2={RX}
        y2={rAccHolder}
        stroke="#0E4749"
        strokeOpacity="0.35"
      />
      {rowText(rAccNo, custRowH, "Account No.", bond.accountNo)}
      {rowText(
        rIfsc,
        custRowH,
        "IFSC",
        `${bond.ifsc || ""}${bond.bankName ? ` ( ${bond.bankName} )` : ""}`,
      )}
      {rowText(rAccHolder, custRowH, "A/C Holder Name", bond.accountHolderName)}

      {/* ---------- Terms ---------- */}
      {terms.map((t, i) => (
        <text
          key={i}
          x={LX}
          y={termsTop + i * termLineH}
          fontFamily="Georgia, serif"
          fontSize="7.5"
          fill="#4B5563"
        >
          • {t}
        </text>
      ))}

      {/* ---------- Investment Type ---------- */}
      <text
        x={LX}
        y={investLabelY}
        fontFamily="Georgia, serif"
        fontSize="11"
        fontWeight="bold"
        fill="#111827"
      >
        Investment Type
      </text>
      <rect
        x={LX}
        y={investTop}
        width={CW}
        height={investHeadH + investRowH}
        fill="none"
        stroke="#0E4749"
        strokeWidth="1"
      />
      <line
        x1={LX}
        y1={investTop + investHeadH}
        x2={RX}
        y2={investTop + investHeadH}
        stroke="#0E4749"
      />
      {[1, 2, 3].map((i) => (
        <line
          key={i}
          x1={LX + colW * i}
          y1={investTop}
          x2={LX + colW * i}
          y2={investTop + investHeadH + investRowH}
          stroke="#0E4749"
          strokeOpacity="0.5"
        />
      ))}
      {["Tenure", "Amount", "Mode of Investment", "Date of Maturity"].map(
        (label, i) => (
          <text
            key={label}
            x={LX + colW * i + colW / 2}
            y={investTop + investHeadH / 2 + 4}
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontSize="8.5"
            fontWeight="bold"
            fill="#111827"
          >
            {label}
          </text>
        ),
      )}
      {[
        bond.tenureMonths ? `${bond.tenureMonths} Month` : "",
        currency ? currency(bond.paidAmount) : bond.paidAmount,
        bond.investmentMode ||
          (bond.profitPercentage ? `${bond.profitPercentage}% Flat` : ""),
        formatDate ? formatDate(bond.maturityDate) : bond.maturityDate,
      ].map((val, i) => (
        <text
          key={i}
          x={LX + colW * i + colW / 2}
          y={investTop + investHeadH + investRowH / 2 + 4}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="8.5"
          fill="#1F2937"
        >
          {val}
        </text>
      ))}

      {/* ---------- Company A/C Details ---------- */}
      <text
        x={LX}
        y={companyLabelY}
        fontFamily="Georgia, serif"
        fontSize="11"
        fontWeight="bold"
        fill="#111827"
      >
        Company A/C Details
      </text>
      <rect
        x={LX}
        y={companyTop}
        width={CW}
        height={companyBottom - companyTop}
        fill="none"
        stroke="#111827"
        strokeWidth="1.2"
      />
      <line
        x1={LX}
        y1={rCompIfsc}
        x2={RX}
        y2={rCompIfsc}
        stroke="#0E4749"
        strokeOpacity="0.35"
      />
      <line
        x1={LX}
        y1={rCompAccHolder}
        x2={RX}
        y2={rCompAccHolder}
        stroke="#0E4749"
        strokeOpacity="0.35"
      />
      {rowText(rCompAccNo, custRowH, "Account No.", bond.companyAccountNo)}
      {rowText(rCompIfsc, custRowH, "IFSC", bond.companyIfsc)}
      {rowText(
        rCompAccHolder,
        custRowH,
        "A/C Holder Name",
        bond.companyAccountHolderName,
      )}

      {/* ---------- Footer ---------- */}
      <line
        x1={LX}
        y1={footerY - 22}
        x2={RX}
        y2={footerY - 22}
        stroke="#0E4749"
        strokeOpacity="0.3"
      />

      <Phone
        x={LX}
        y={footerY - 10}
        width={11}
        height={11}
        color="#0E4749"
        strokeWidth={1.8}
      />
      <text
        x={LX + 15}
        y={footerY}
        fontFamily="Georgia, serif"
        fontSize="8.5"
        fill="#1F2937"
      >
        {bond.companyPhone || "+91 9430050782"}
      </text>
      <text
        x={LX}
        y={footerY + 11}
        fontFamily="Georgia, serif"
        fontSize="6"
        fill="#9CA3AF"
      >
        Official Time: 10AM - 5PM
      </text>

      <Globe
        x={185}
        y={footerY - 10}
        width={11}
        height={11}
        color="#0E4749"
        strokeWidth={1.8}
      />
      <text
        x={200}
        y={footerY}
        fontFamily="Georgia, serif"
        fontSize="8.5"
        fill="#1F2937"
      >
        {bond.companyWebsite || "www.growwkaro.com"}
      </text>

      <Mail
        x={330}
        y={footerY - 10}
        width={11}
        height={11}
        color="#0E4749"
        strokeWidth={1.8}
      />
      <text
        x={345}
        y={footerY}
        fontFamily="Georgia, serif"
        fontSize="8.5"
        fill="#1F2937"
      >
        {bond.companyEmail || "karogroww@gmail.com"}
      </text>
    </svg>
  );
});

export default BondCertificate;
