import React, { forwardRef } from "react";
import { Phone, Globe, Mail } from "lucide-react";

/**
 * PensionBondCertificate — renders the "Pension Plan" bond as SVG
 * (A4 portrait, matches the printed pension bond PDF).
 *
 * Repayment table:
 *   - Always shows the FULL schedule (tenureMonths rows), paid or not.
 *   - Up to 12 months  -> one table.
 *   - More than 12     -> two tables side by side, 12 rows on the left,
 *                         the rest (up to 12) on the right (24 months = 12 + 12).
 *   - profitLedger rows (if any) only overlay PAID/UNPAID + amount on the
 *     matching month; they no longer limit how many rows are shown.
 *
 * bond fields used:
 *   schemeName, planSubtitle, userSchemeId / id,
 *   enrollmentDate / paidDate, maturityDate, paidAmount,
 *   profitPercentage (monthly rate), tenureMonths, contractInterestAmount,
 *   profitLedger -> [{ profitDate, profitAmount, paid }]
 *   notes, nominee { name, relation, mobileNo, aadharNo },
 *   companyAccountNo, companyIfsc, companyAccountHolderName,
 *   companyPhone, companyEmail, companyWebsite
 *
 * Optional image props (URLs): logoUrl, profilePhoto, stampUrl, watermarkUrl
 */

const FONT_SANS =
  '"Helvetica Neue", Helvetica, Arial, "Liberation Sans", sans-serif';
const FONT_SERIF =
  'var(--font-playfair, "Playfair Display"), "Playfair Display", Georgia, "Times New Roman", serif';

const INK = "#222222";
const TAN = "#B39273";
const GREEN = "#6EE7A8";
const BLUE = "#93A8F4";
const FS = 8.0;
const FS_HEAD = 9.5;
const MAX_PER_SIDE = 12;

const inr = (n) =>"₹"+ Number(n).toLocaleString("en-IN");

const parseLocalDate = (value) => {
  if (!value) return new Date(Number.NaN);
  if (value instanceof Date) return value;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
};

const monthKey = (d) => `${d.getFullYear()}-${d.getMonth()}`;
const monthLabel = (d) =>
  d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

function buildRows(bond) {
  const principal = Number(bond.paidAmount) || 0;
  const monthlyRate = Number(bond.profitPercentage) || 0;
  const ledger = Array.isArray(bond.profitLedger) ? bond.profitLedger : [];
  const term = Math.max(Number(bond.tenureMonths) || 0, ledger.length);
  const monthlyInterest =
    Math.round(((principal * monthlyRate) / 100 + Number.EPSILON) * 100) / 100;

  const startDate = parseLocalDate(
    bond.paidDate || bond.enrollmentDate || bond.date,
  );
  const validStart = !Number.isNaN(startDate.getTime());

  // ledger lookup by calendar month (fallback: by position)
  const ledgerByMonth = new Map();
  ledger.forEach((entry) => {
    const d = parseLocalDate(entry.profitDate);
    if (!Number.isNaN(d.getTime())) ledgerByMonth.set(monthKey(d), entry);
  });

  const rows = Array.from({ length: term }, (_, index) => {
    let date = null;
    if (validStart) {
      const monthIndex = startDate.getMonth() + index + 1;
      date = new Date(startDate.getFullYear(), monthIndex, 1);
      const lastDay = new Date(startDate.getFullYear(), monthIndex + 1, 0).getDate();
      date.setDate(Math.min(startDate.getDate(), lastDay));
    }

    let entry = date ? ledgerByMonth.get(monthKey(date)) : undefined;
    if (!entry && !validStart) entry = ledger[index];
    if (!date && entry) {
      const d = parseLocalDate(entry.profitDate);
      if (!Number.isNaN(d.getTime())) date = d;
    }

    return {
      label: date ? monthLabel(date) : `Month ${index + 1}`,
      payment: entry ? Number(entry.profitAmount) || 0 : monthlyInterest,
      paid: entry ? Boolean(entry.paid) : false,
    };
  });

  return {
    rows,
    totalPayment: rows.reduce((sum, row) => sum + row.payment, 0),
    principal,
  };
}

const PensionBondCertificate = forwardRef(function PensionBondCertificate(
  {
    bond = {},
    userName,
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

  const formatAmount = (v) => {
    if (v === undefined || v === null || v === "") return "";
    const n = Number(String(v).replace(/,/g, ""));
    return Number.isFinite(n) ? `${inr(n)}/-` : String(v);
  };
  const monthlyInterest =
    (Number(bond.paidAmount) * Number(bond.profitPercentage)) / 100 || 0;
  const totalContractInterest =
    bond.contractInterestAmount ?? monthlyInterest * Number(bond.tenureMonths || 0);
  const notes =
    bond.notes && bond.notes.length
      ? bond.notes
      : [
          `${bond.profitPercentage ?? 0}% monthly interest: ${formatAmount(monthlyInterest)}`,
          `Total scheduled interest: ${formatAmount(totalContractInterest)}`,
          "Principal returned within 30 days after maturity*",
        ];

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
  const addressLines = wrapText(user.address || bond.address || "", 76);

  const { rows, totalPayment, principal } = buildRows(bond);
  const twoUp = rows.length > MAX_PER_SIDE;
  const leftRows = twoUp ? rows.slice(0, MAX_PER_SIDE) : rows;
  const rightRows = twoUp ? rows.slice(MAX_PER_SIDE, MAX_PER_SIDE * 2) : [];
  const rowsPerSide = leftRows.length;

  // ---------- layout (viewBox units; A4 ≈ 480 wide) ----------
  const W = 480;
  const LX = 49;
  const RX = 434;
  const CW = RX - LX;
  const MID = LX + CW / 2;
  const PAD = 6.5;
  const baseOff = (h) => h / 2 + 2.9;

  let y = 137;
  const boxTop = y;
  const hRow = 15;
  const rFullName = y; y += hRow;
  const rDob = y; y += hRow;
  const rAddress = y;
  const hAddress = addressLines.length > 1 ? 24 : hRow;
  y += hAddress;
  const rAadhaar = y; y += hRow;
  const rNomineeName = y; y += hRow;
  const rRelation = y; y += hRow;
  const rNomineeMobile = y; y += hRow;
  const rNomineeAadhaar = y; y += hRow;
  const boxBottom = y;

  const customerLabelY = boxBottom + 16;
  const customerTop = customerLabelY + 5;
  const custRowH = 16;
  const rAccNo = customerTop;
  const rIfsc = customerTop + custRowH;
  const rAccHolder = customerTop + custRowH * 2;
  const customerBottom = customerTop + custRowH * 3;

  const notesTop = customerBottom + 11;
  const noteLineH = 10;

  const tableTop = notesTop + (notes.length - 1) * noteLineH + 9;
  const headH = 13;
  const maxTableBottom = 590;
  // rowsPerSide data rows + 1 total row
  const rowH = Math.min(
    17,
    (maxTableBottom - tableTop - headH) / (Math.max(rowsPerSide, 1) + 1),
  );
  const rowFontSize = Math.min(7.8, Math.max(2.3, rowH * 0.5));
  const tableBottom = tableTop + headH + (rowsPerSide + 1) * rowH;
  const totalRowY = tableTop + headH + rowsPerSide * rowH;
  const totalTextY = totalRowY + rowH / 2 + rowFontSize * 0.35;

  const compRowH = 14;
  const compBottom0 = 652; // pin company block near the bottom of the page
  const compTop = Math.max(tableBottom + 16, compBottom0 - compRowH * 3);
  const compHeadY = compTop - 4;
  const compBottom = compTop + compRowH * 3;
  const COMPANY_W = 190;
  const H = 679;

  // ---------- helpers ----------
  const heading = (text, hy) => (
    <text x={LX + 2.5} y={hy} fontSize={FS_HEAD} fontWeight={700}>
      {text}
    </text>
  );

  const rowText = (rowY, h, label, value, x = LX + PAD) => (
    <text x={x} y={rowY + baseOff(h)} fontSize={FS}>
      {label} - {value}
    </text>
  );

  const compRow = (rowY, label, value) => {
    const ty = rowY + compRowH / 2 + 2.4;
    return (
      <g>
        <text x={LX + 5} y={ty} fontSize={7.2}>{label}</text>
        <text x={LX + 66} y={ty} fontSize={7.2}>-</text>
        <text x={LX + 73} y={ty} fontSize={7.2}>{value}</text>
      </g>
    );
  };

  /**
   * One repayment table block (header + data rows) at x0 with width w.
   * showPrincipal adds the 4th "Principal" column (single-table layout).
   */
  const renderBlock = (keyPrefix, x0, w, subset, showPrincipal) => {
    const labels = showPrincipal
      ? ["Month", "Interest", "Status", "Principal"]
      : ["Month", "Interest", "Status"];
    const ratios = showPrincipal ? [0.31, 0.27, 0.18, 0.24] : [0.36, 0.32, 0.32];
    const cx = [x0];
    ratios.forEach((r) => cx.push(cx[cx.length - 1] + r * w));
    const bottom = tableTop + headH + rowsPerSide * rowH;
    const mid = (i) => (cx[i] + cx[i + 1]) / 2;

    return (
      <g key={keyPrefix}>
        <rect x={x0} y={tableTop} width={w} height={bottom - tableTop} fill="none" stroke={TAN} strokeWidth={0.7} />
        <rect x={x0} y={tableTop} width={w} height={headH} fill={GREEN} stroke={TAN} strokeWidth={0.6} />
        {labels.map((label, i) => (
          <text
            key={label}
            x={mid(i)}
            y={tableTop + headH / 2 + 2.2}
            textAnchor="middle"
            fontSize={6.4}
            fontWeight={700}
          >
            {label}
          </text>
        ))}

        {subset.map((r, i) => {
          const ry = tableTop + headH + i * rowH;
          const ty = ry + rowH / 2 + rowFontSize * 0.35;
          return (
            <g key={i}>
              <line x1={x0} y1={ry} x2={x0 + w} y2={ry} stroke={TAN} strokeWidth={0.4} />
              <text x={mid(0)} y={ty} textAnchor="middle" fontSize={rowFontSize}>{r.label}</text>
              <text x={mid(1)} y={ty} textAnchor="middle" fontSize={rowFontSize}>{inr(r.payment)}</text>
              <text
                x={mid(2)}
                y={ty}
                textAnchor="middle"
                fontSize={rowFontSize}
                fill={r.paid ? "#15803D" : "#A16207"}
                fontWeight={700}
              >
                {r.paid ? "PAID" : "UNPAID"}
              </text>
              {showPrincipal && (
                <text x={mid(3)} y={ty} textAnchor="middle" fontSize={rowFontSize}>
                  {inr(principal)}
                </text>
              )}
            </g>
          );
        })}

        {/* column dividers */}
        {cx.slice(1, -1).map((x, i) => (
          <line key={i} x1={x} y1={tableTop} x2={x} y2={bottom} stroke={TAN} strokeWidth={0.5} />
        ))}
      </g>
    );
  };

  const [brandTop, ...brandRest] = String(companyName).split(/[\s_]+/);
  const brandBottom = brandRest.join(" ").toLowerCase();

  const nominee = bond.nominee || {};
  const dividers = [rDob, rAddress, rAadhaar, rNomineeName, rRelation, rNomineeMobile, rNomineeAadhaar];

  const GAP = 8;
  const halfW = (CW - GAP) / 2;
  const rightX = LX + halfW + GAP;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMin meet"
      fill={INK}
      style={{ width: "100%", height: "auto", display: "block", fontFamily: FONT_SANS }}
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
        <image href={logoUrl} x={50} y={14} width={96} height={108} preserveAspectRatio="xMidYMid meet" />
      ) : (
        <>
          <text x={98} y={86} textAnchor="middle" fontSize={20} fill="#16A34A">{brandTop}</text>
          {brandBottom && (
            <text x={98} y={100} textAnchor="middle" fontSize={10} letterSpacing={3} fill="#4F6EF7">
              {brandBottom}
            </text>
          )}
          <text x={98} y={110} textAnchor="middle" fontSize={6.2} fill="#16A34A">{companyTagline}</text>
        </>
      )}
      <text x={52} y={128} fontSize={7.6}>
        S. No.- {bond.userSchemeId || bond.id || ""}
      </text>

      <text
        x={241}
        y={52}
        textAnchor="middle"
        fontSize={21}
        fontWeight={700}
        style={{ fontFamily: FONT_SERIF }}
      >
        {bond.schemeName || "Groww Karo More"}
      </text>
      <line x1={168} y1={56} x2={314} y2={56} stroke="#3B6FD8" strokeWidth={0.8} />
      <text x={241} y={69} textAnchor="middle" fontSize={9.4} fontWeight={700}>
        {bond.planSubtitle || "Pension Plan"}
      </text>

      {/* summary box */}
      <rect x={162} y={80} width={154} height={38} fill="none" stroke={TAN} strokeWidth={0.7} />
      <line x1={162} y1={92.7} x2={316} y2={92.7} stroke={TAN} strokeWidth={0.6} />
      <line x1={162} y1={105.4} x2={316} y2={105.4} stroke={TAN} strokeWidth={0.6} />
      <text x={167} y={89.4} fontSize={7.6}>Investment Date -</text>
      <text x={250} y={89.4} fontSize={7.6}>
        {safeDate(bond.enrollmentDate || bond.date || bond.paidDate || bond.requestDate)}
      </text>
      <text x={167} y={102.1} fontSize={7.6}>Maturity Date -</text>
      <text x={250} y={102.1} fontSize={7.6}>{safeDate(bond.maturityDate)}</text>
      <text x={167} y={114.8} fontSize={7.6}>Investment Amount -</text>
      <text x={250} y={114.8} fontSize={7.6}>{formatAmount(bond.paidAmount)}</text>

      {/* applicant photo */}
      {profilePhoto ? (
        <image href={profilePhoto} x={372} y={43} width={54} height={72} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <>
          <rect x={372} y={43} width={54} height={72} fill="#F3F4F6" stroke="#D1D5DB" strokeWidth={0.6} />
          <text x={399} y={86} textAnchor="middle" fontSize={20} fill="#9CA3AF">
            {(name || "?").trim().charAt(0).toUpperCase()}
          </text>
        </>
      )}

      {/* ---------- Personal / nominee box ---------- */}
      <rect
        x={LX}
        y={boxTop}
        width={CW}
        height={boxBottom - boxTop}
        fill="none"
        stroke={INK}
        strokeWidth={0.8}
      />
      {dividers.map((ly) => (
        <line key={ly} x1={LX} y1={ly} x2={RX} y2={ly} stroke={TAN} strokeWidth={0.6} />
      ))}
      <line x1={MID} y1={rRelation} x2={MID} y2={rNomineeAadhaar} stroke={TAN} strokeWidth={0.6} />

      {rowText(rFullName, hRow, "Full Name", name)}
      {rowText(rDob, hRow, "DOB", safeDate(user.dob || bond.dob))}

      {/* address: two lines fit inside the 18-unit tall row */}
      <text x={LX + PAD} y={rAddress + (addressLines.length > 1 ? 10 : baseOff(hRow))} fontSize={FS}>
        Address - {addressLines[0] || ""}
      </text>
      {addressLines[1] && (
        <text x={LX + PAD} y={rAddress + 19.5} fontSize={FS}>
          {addressLines[1]}
        </text>
      )}

      {rowText(rAadhaar, hRow, "Aadhaar No.", user.aadhaarNo || user.aadharNo || bond.aadhaarNo || bond.aadharNo || "")}
      {rowText(rNomineeName, hRow, "Nominee Name", nominee.name || bond.nomineeName || user.nomineeName || "")}

      {rowText(rRelation, hRow, "Relation", nominee.relation || bond.nomineeRelation || user.nomineeRelation || "")}
      {rowText(rRelation, hRow, "Email", user.email || bond.email || "N/A", MID + PAD)}

      {rowText(
        rNomineeMobile,
        hRow,
        "Nominee Mob. No.",
        nominee.mobileNo || nominee.mobile || bond.nomineeMobile || user.nomineeMobile || "",
      )}
      {rowText(rNomineeMobile, hRow, "Mob No.", user.phone || bond.mobileNo || "", MID + PAD)}

      {rowText(
        rNomineeAadhaar,
        hRow,
        "Nominee Aadhaar No.",
        nominee.aadharNo || nominee.aadhaarNo || bond.nomineeAadhaar || user.nomineeAadhaar || "",
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

      {/* ---------- Notes ---------- */}
      {notes.map((t, i) => {
        const ty = notesTop + i * noteLineH;
        return (
          <g key={i}>
            <circle cx={LX + 2.5} cy={ty - 2.8} r={1.4} />
            <text x={LX + 8} y={ty} fontSize={8.4}>{t}</text>
          </g>
        );
      })}

      {/* ---------- Repayment table(s) ---------- */}
      {twoUp ? (
        <>
          {renderBlock("left", LX, halfW, leftRows, false)}
          {renderBlock("right", rightX, halfW, rightRows, false)}

          {/* full-width total row under both tables */}
          <rect x={LX} y={totalRowY} width={CW} height={rowH} fill={BLUE} stroke={TAN} strokeWidth={0.5} />
          <text x={LX + PAD} y={totalTextY} fontSize={rowFontSize} fontWeight={700}>
            Total interest
          </text>
          <text x={MID} y={totalTextY} textAnchor="middle" fontSize={rowFontSize} fontWeight={700}>
            {/* Principal {inr(principal)} - At maturity */}
          </text>
          <text x={RX - PAD} y={totalTextY} textAnchor="end" fontSize={rowFontSize} fontWeight={700}>
            {inr(totalPayment)}
          </text>
        </>
      ) : (
        <>
          {renderBlock("single", LX, CW, leftRows, true)}
          {(() => {
            const cx = [LX];
            [0.31, 0.27, 0.18, 0.24].forEach((r) => cx.push(cx[cx.length - 1] + r * CW));
            const mid = (i) => (cx[i] + cx[i + 1]) / 2;
            return (
              <g>
                <rect x={LX} y={totalRowY} width={CW} height={rowH} fill={BLUE} stroke={TAN} strokeWidth={0.5} />
                <text x={mid(0)} y={totalTextY} textAnchor="middle" fontSize={rowFontSize} fontWeight={700}>
                  Total interest
                </text>
                <text x={mid(1)} y={totalTextY} textAnchor="middle" fontSize={rowFontSize} fontWeight={700}>
                  {inr(totalPayment)}
                </text>
                {/* <text x={mid(3)} y={totalTextY} textAnchor="middle" fontSize={rowFontSize} fontWeight={700}>
                  At maturity
                </text> */}
                {[1, 2, 3].map((i) => (
                  <line key={i} x1={cx[i]} y1={totalRowY} x2={cx[i]} y2={totalRowY + rowH} stroke={TAN} strokeWidth={0.5} />
                ))}
              </g>
            );
          })()}
        </>
      )}

      {/* ---------- Company A/C Details ---------- */}
      <text x={LX + 2.5} y={compHeadY} fontSize={7.6} fontWeight={700}>Company A/C Details</text>
      <rect
        x={LX}
        y={compTop}
        width={COMPANY_W}
        height={compBottom - compTop}
        fill="none"
        stroke={INK}
        strokeWidth={0.8}
      />
      {compRow(compTop, "A/C Holder Name", bond.companyAccountHolderName || "Groww Karo")}
      {compRow(compTop + compRowH, "Account No.", bond.companyAccountNo || "01930210005200")}
      {compRow(compTop + compRowH * 2, "IFSC", bond.companyIfsc || "UCBA0000193")}

      {/* contact block */}
      <Phone x={251} y={compTop - 1} width={10} height={10} color={TAN} strokeWidth={2} />
      <text x={265} y={compTop + 7.5} fontSize={9}>{bond.companyPhone || "+919430050782"}</text>
      <Mail x={251} y={compTop + 13} width={10} height={10} color="#16A34A" strokeWidth={2} />
      <text x={265} y={compTop + 21.5} fontSize={9}>{bond.companyEmail || "karogroww@gmail.com"}</text>
      <Globe x={251} y={compTop + 27} width={10} height={10} color="#16A34A" strokeWidth={2} />
      <text x={265} y={compTop + 35.5} fontSize={9}>{bond.companyWebsite || "www.growwkaro.com"}</text>

      {stampUrl && (
        <image
          href={stampUrl}
          x={372}
          y={compTop - 8}
          width={56}
          height={56}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
    </svg>
  );
});

export default PensionBondCertificate;