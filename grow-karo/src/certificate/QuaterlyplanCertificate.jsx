import React, { forwardRef } from "react";
import { Phone, Globe, Mail } from "lucide-react";

/**
 * QuaterlyplanCertificate — renders the "Cashback Plan" bond as SVG
 * (A4 portrait, matches the printed Groww Karo bond PDF).
 *
 * "Profit Structure" table:
 *   - Columns: Month | Profit | Net Amount | Status (PAID / UNPAID)
 *   - Rows follow profitLedger payout dates when provided (monthly or quarterly);
 *     otherwise one row per month for tenureMonths. No subtotal rows.
 *   - A blue "Total Payment" row closes the table.
 *   - Up to 12 months -> one table; more than 12 -> two tables side by side.
 *
 * bond fields used:
 *   schemeName, planSubtitle, userSchemeId / id,
 *   enrollmentDate / paidDate, maturityDate, paidAmount,
 *   profitPercentage (monthly rate), tenureMonths,
 *   profitLedger -> [{ profitDate, profitAmount, paid }] (per-month amount + PAID/UNPAID)
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
const GREEN_HEAD = "#52D893";
const GREEN = "#6EE7A8";
const BLUE = "#93A8F4";
const FS = 8.0;
const FS_HEAD = 9.5;
const MAX_PER_SIDE = 12;
const RATIOS = [0.3, 0.25, 0.25, 0.2];

const num = (n) => String(Math.round((Number(n) || 0) * 100) / 100);
const inrFull = (n) => `${Number(n || 0).toLocaleString("en-IN")}/-`;
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const parseLocalDate = (value) => {
  if (!value) return new Date(Number.NaN);
  if (value instanceof Date) return value;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
};

const monthKey = (d) => `${d.getFullYear()}-${d.getMonth()}`;

function buildSchedule(bond) {
  const principal = Number(bond.paidAmount) || 0;
  const monthlyRate = Number(bond.profitPercentage) || 0;
  const ledger = Array.isArray(bond.profitLedger) ? bond.profitLedger : [];
  const term = Math.max(Number(bond.tenureMonths) || 0, ledger.length);
  const monthlyProfit = round2((principal * monthlyRate) / 100);
  const startDate = parseLocalDate(bond.paidDate || bond.enrollmentDate || bond.date);
  const validStart = !Number.isNaN(startDate.getTime());

  // ---- ledger-driven schedule ----
  // When the backend sends profitLedger, its payout dates ARE the schedule
  // (monthly, quarterly, ...). Rows follow those dates, so PAID/UNPAID and the
  // amount always match the right payout. Missing future payouts (if the ledger
  // is shorter than the tenure) are appended with the same spacing, as UNPAID.
  const fmtDate = (d) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const addMonths = (d, n) => {
    const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(d.getDate(), lastDay));
    return target;
  };
  const dated = ledger
    .map((entry) => ({ entry, date: parseLocalDate(entry.profitDate) }))
    .filter((x) => !Number.isNaN(x.date.getTime()))
    .sort((x, y) => x.date - y.date);

  if (dated.length) {
    const rows = dated.map(({ entry, date }) => ({
      label: fmtDate(date),
      profit: Number(entry.profitAmount) || 0,
      paid: Boolean(entry.paid),
    }));
    const monthsBetween = (x, y) =>
      (y.getFullYear() - x.getFullYear()) * 12 + (y.getMonth() - x.getMonth());
    const step = dated.length > 1 ? Math.max(1, monthsBetween(dated[0].date, dated[1].date)) : 1;
    const tenure = Number(bond.tenureMonths) || 0;
    const expected = tenure > 0 ? Math.ceil(tenure / step) : 0;
    const last = dated[dated.length - 1];
    for (let i = dated.length; i < expected; i += 1) {
      rows.push({
        label: fmtDate(addMonths(last.date, (i - dated.length + 1) * step)),
        profit: Number(last.entry.profitAmount) || 0,
        paid: false,
      });
    }
    return { rows, grandTotal: rows.reduce((t, r) => t + r.profit, 0) };
  }

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

    const profit = entry ? Number(entry.profitAmount) || 0 : monthlyProfit;

    let label = `Month ${index + 1}`;
    if (date) {
      label = date.toLocaleDateString("en-IN", { month: "long" });
      if (term > 12) label += ` ${String(date.getFullYear()).slice(-2)}`;
    }
    return { label, profit, paid: entry ? Boolean(entry.paid) : false };
  });

  return { rows, grandTotal: rows.reduce((t, r) => t + r.profit, 0) };
}

const QuaterlyplanCertificate = forwardRef(function QuaterlyplanCertificate(
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
    return Number.isFinite(n) ? inrFull(n) : String(v);
  };

  const creditStart = parseLocalDate(bond.paidDate || bond.enrollmentDate || bond.date);
  const creditDay = Number.isNaN(creditStart.getTime())
    ? ""
    : String(creditStart.getDate()).padStart(2, "0");
  const notes =
    bond.notes && bond.notes.length
      ? bond.notes
      : [
          creditDay
            ? `Profit will be credited ${creditDay} to 03 at every Quarter*`
            : "Profit will be credited at every Quarter*",
          "Closure charge will be imposed as per the maturity tenure*",
          "This Bond is valid only till maturity date*",
          "Principal Amount will be returned in 30 days after maturity*",
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

  const { rows, grandTotal } = buildSchedule(bond);
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

  // ---- stretch factor: when the table is short, grow rows/fonts so the page
  // is filled instead of leaving a blank gap above the company block ----
  const headH = 13;
  const maxTableBottom = 594;
  const TARGET_ROW_H = 22;
  const tableTopAt = (kk) =>
    137 +
    (7 * 15 + (addressLines.length > 1 ? 24 : 15)) * kk +
    16 + 5 + 3 * 16 * kk + 11 +
    (notes.length - 1) * 10 * kk +
    15 + 5;
  let k = 1;
  for (let t = 1.02; t <= 1.4001; t += 0.02) {
    const rh = (maxTableBottom - tableTopAt(t) - headH) / (Math.max(rowsPerSide, 1) + 1);
    if (rh >= TARGET_ROW_H) k = t;
    else break;
  }
  const kf = 1 + (k - 1) * 0.6; // font growth (gentler than spacing growth)
  const fs = FS * kf;

  let y = 137;
  const boxTop = y;
  const hRow = 15 * k;
  const rFullName = y; y += hRow;
  const rDob = y; y += hRow;
  const rAddress = y;
  const hAddress = addressLines.length > 1 ? 24 * k : hRow;
  y += hAddress;
  const rAadhaar = y; y += hRow;
  const rNomineeName = y; y += hRow;
  const rRelation = y; y += hRow;
  const rNomineeMobile = y; y += hRow;
  const rNomineeAadhaar = y; y += hRow;
  const boxBottom = y;

  const customerLabelY = boxBottom + 16;
  const customerTop = customerLabelY + 5;
  const custRowH = 16 * k;
  const rAccNo = customerTop;
  const rIfsc = customerTop + custRowH;
  const rAccHolder = customerTop + custRowH * 2;
  const customerBottom = customerTop + custRowH * 3;

  const notesTop = customerBottom + 11;
  const noteLineH = 10 * k;

  const profitHeadY = notesTop + (notes.length - 1) * noteLineH + 15;
  const tableTop = profitHeadY + 5;
  // rowsPerSide data rows + 1 "Total Payment" row
  const rowH = Math.min(
    26,
    (maxTableBottom - tableTop - headH) / (Math.max(rowsPerSide, 1) + 1),
  );
  const rowFontSize = Math.min(9, Math.max(2.3, rowH * 0.55));
  const totalRowY = tableTop + headH + rowsPerSide * rowH;
  const tableBottom = totalRowY + rowH;
  const totalTextY = totalRowY + rowH / 2 + rowFontSize * 0.35;

  const compRowH = 14;
  const compBottom0 = 652; // pin company block near the bottom of the page
  const compTop = Math.max(tableBottom + 16, compBottom0 - compRowH * 3);
  const compHeadY = compTop - 4;
  const compBottom = compTop + compRowH * 3;
  const COMPANY_W = 200;
  const H = 679;

  // ---------- helpers ----------
  const heading = (text, hy) => (
    <text x={LX + 2.5} y={hy} fontSize={FS_HEAD * kf} fontWeight={700}>
      {text}
    </text>
  );

  // shrinks the font only when a long value (e.g. an email) would overflow the box
  const rowText = (rowY, h, label, value, x = LX + PAD) => {
    const len = `${label} - ${value}`.length;
    const size = Math.min(fs, (RX - x - 6) / (0.55 * Math.max(len, 1)));
    return (
      <text x={x} y={rowY + baseOff(h)} fontSize={size}>
        {label} - {value}
      </text>
    );
  };

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

  const colEdges = (x0, w) => {
    const cx = [x0];
    RATIOS.forEach((r) => cx.push(cx[cx.length - 1] + r * w));
    return cx;
  };

  /** One "Profit Structure" block (header + one row per month). */
  const renderBlock = (keyPrefix, x0, w, list) => {
    const labels = ["Month", "Profit", "Net Amount", "Status"];
    const cx = colEdges(x0, w);
    const bottom = tableTop + headH + rowsPerSide * rowH;
    const mid = (i) => (cx[i] + cx[i + 1]) / 2;

    return (
      <g key={keyPrefix}>
        <rect x={x0} y={tableTop} width={w} height={bottom - tableTop} fill="none" stroke={TAN} strokeWidth={0.7} />
        <rect x={x0} y={tableTop} width={w} height={headH} fill={GREEN_HEAD} stroke={TAN} strokeWidth={0.6} />
        {labels.map((label, i) => (
          <text
            key={label}
            x={mid(i)}
            y={tableTop + headH / 2 + 2.2}
            textAnchor="middle"
            fontSize={6.4 * kf}
            fontWeight={700}
          >
            {label}
          </text>
        ))}

        {/* column divider */}
        {cx.slice(1, -1).map((x, i) => (
          <line key={i} x1={x} y1={tableTop + headH} x2={x} y2={bottom} stroke={TAN} strokeWidth={0.5} />
        ))}

        {list.map((r, i) => {
          const ry = tableTop + headH + i * rowH;
          const ty = ry + rowH / 2 + rowFontSize * 0.35;
          return (
            <g key={i}>
              <line x1={x0} y1={ry} x2={x0 + w} y2={ry} stroke={TAN} strokeWidth={0.4} />
              <text x={mid(0)} y={ty} textAnchor="middle" fontSize={rowFontSize}>{r.label}</text>
              <text x={mid(1)} y={ty} textAnchor="middle" fontSize={rowFontSize}>{num(r.profit)}</text>
              <text x={mid(2)} y={ty} textAnchor="middle" fontSize={rowFontSize}>{num(r.profit)}</text>
              <text
                x={mid(3)}
                y={ty}
                textAnchor="middle"
                fontSize={rowFontSize}
                fontWeight={700}
                fill={r.paid ? "#15803D" : "#A16207"}
              >
                {r.paid ? "PAID" : "UNPAID"}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  const GAP = 8;
  const halfW = (CW - GAP) / 2;
  const rightX = LX + halfW + GAP;

  const [brandTop, ...brandRest] = String(companyName).split(/[\s_]+/);
  const brandBottom = brandRest.join(" ").toLowerCase();

  const nominee = bond.nominee || {};
  const dividers = [rDob, rAddress, rAadhaar, rNomineeName, rRelation, rNomineeMobile, rNomineeAadhaar];

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
        S. No.- {bond.bondNumber || bond.userSchemeId || ""}
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
        {bond.planSubtitle || "Cashback Plan"}
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

      {/* stamp overlapping the photo corner */}
      {stampUrl && (
        <image href={stampUrl} x={398} y={86} width={50} height={50} preserveAspectRatio="xMidYMid meet" />
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
      <text x={LX + PAD} y={rAddress + (addressLines.length > 1 ? 10 * k : baseOff(hRow))} fontSize={fs}>
        Address - {addressLines[0] || ""}
      </text>
      {addressLines[1] && (
        <text x={LX + PAD} y={rAddress + 19.5 * k} fontSize={fs}>
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
            <text x={LX + 8} y={ty} fontSize={8.4 * kf}>{t}</text>
          </g>
        );
      })}

      {/* ---------- Profit Structure ---------- */}
      {heading("Profit Structure", profitHeadY)}
      {twoUp ? (
        <>
          {renderBlock("left", LX, halfW, leftRows)}
          {renderBlock("right", rightX, halfW, rightRows)}
        </>
      ) : (
        renderBlock("single", LX, CW, leftRows)
      )}

      {/* ---------- Total Payment ---------- */}
      {(() => {
        const cx = colEdges(LX, CW);
        const mid = (i) => (cx[i] + cx[i + 1]) / 2;
        const bold = { textAnchor: "middle", fontSize: rowFontSize, fontWeight: 700 };
        return (
          <g>
            <rect x={LX} y={totalRowY} width={CW} height={rowH} fill={BLUE} stroke={TAN} strokeWidth={0.5} />
            <text x={mid(0)} y={totalTextY} {...bold}>Total Payment</text>
            <text x={mid(1)} y={totalTextY} {...bold}>{num(grandTotal)}</text>
            <text x={mid(2)} y={totalTextY} {...bold}>{inrFull(grandTotal)}</text>
          </g>
        );
      })()}

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
      {compRow(compTop + compRowH * 2, "IFSC", bond.companyIfsc || "UCBA0000193 ( Bhagalpur Branch 1 )")}

      {/* contact block */}
      <Phone x={262} y={compTop - 1} width={10} height={10} color={TAN} strokeWidth={2} />
      <text x={276} y={compTop + 7.5} fontSize={8.4}>{bond.companyPhone || "+919430050782"}</text>
      <Mail x={262} y={compTop + 13} width={10} height={10} color="#16A34A" strokeWidth={2} />
      <text x={276} y={compTop + 21.5} fontSize={8.4}>{bond.companyEmail || "karogroww@gmail.com"}</text>
      <Globe x={262} y={compTop + 27} width={10} height={10} color="#16A34A" strokeWidth={2} />
      <text x={276} y={compTop + 35.5} fontSize={8.4}>{bond.companyWebsite || "www.growwkaro.com"}</text>

      {stampUrl && (
        <image
          href={stampUrl}
          x={372}
          y={compTop - 14}
          width={70}
          height={70}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
    </svg>
  );
});

export default QuaterlyplanCertificate;