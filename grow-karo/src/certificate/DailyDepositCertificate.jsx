"use client";
import React, { forwardRef } from "react";
import { Phone, Globe, Mail } from "lucide-react";

const FONT_SANS =
  '"Helvetica Neue", Helvetica, Arial, "Liberation Sans", sans-serif';
const FONT_SERIF =
  'var(--font-playfair,"Playfair Display"),"Playfair Display",Georgia,"Times New Roman",serif';

const INK = "#222222";
const TAN = "#B39273";
const FS = 8.4;
const FS_HEAD = 9.4;

function CheckBoxSVG({ x, y, checked }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={9.5}
        height={9.5}
        rx={0.8}
        fill="#FFFFFF"
        stroke={TAN}
        strokeWidth={0.7}
      />
      {checked && (
        <path
          d={`M${x + 2} ${y + 5} L${x + 4.1} ${y + 7.1} L${x + 7.8} ${y + 2.5}`}
          fill="none"
          stroke={INK}
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </g>
  );
}

function ContactIcon({ cx, cy, Icon }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill={TAN} />
      <Icon
        x={cx - 3.5}
        y={cy - 3.5}
        width={7}
        height={7}
        color="#FFFFFF"
        strokeWidth={2.2}
      />
    </g>
  );
}

const DailyDepositCertificate = forwardRef(function DailyDepositCertificate(
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
    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(str)) return str.replaceAll("/", "-");
    const d = new Date(val);
    if (!Number.isNaN(d.getTime()))
      return d
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replaceAll("/", "-");
    return str;
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
  const addressLines = wrapText(user.address || bond.address || "", 80);
  const tenureMonths =
    bond.tenureMonths ||
    (bond.tenure ? Math.round(Number(bond.tenure) / 30) : "");
  const profitPct =
    bond.profitPercentage ?? bond.interestRate ?? bond.profitPercent ?? "";
  const profitLabel =
    profitPct === ""
      ? ""
      : String(profitPct).includes("%")
        ? profitPct
        : `${profitPct}%`;
  const planTitle = bond.planTitle || "Daily Deposit Plan";
  const isMarried =
    String(user.maritalStatus || bond.maritalStatus || "").toUpperCase() ===
    "MARRIED";

  const terms = bond.terms?.length
    ? bond.terms
    : [
        "The profit will be applicable on total deposit amount *",
        "This bond is valid only till maturity date*",
        "Profit will be credited 7 to 10 working days*",
      ];

  // ---- layout: A4-like viewBox, content flows top to bottom ----
  const W = 480,
    H = 680,
    LX = 50.5,
    RX = 439,
    CW = RX - LX,
    TX = 58;

  const mid = (a, b) => (a + b) / 2 + FS * 0.35;

  // personal information rows (cumulative)
  const keys = [
    "fullName",
    "father",
    "dob",
    "address",
    "marital",
    "aadhaar",
    "nomName",
    "relation",
    "nomMob",
    "nomAadhaar",
  ];
  const heights = [22, 22, 22, 34, 24, 22, 22, 22, 22, 22];
  const R = {};
  let cy = 148;
  keys.forEach((k, i) => {
    R[k] = cy;
    cy += heights[i];
  });
  R.bottom = cy;
  const dividers = keys.slice(1).map((k) => R[k]);

  // customer a/c
  const cHeadY = R.bottom + 18;
  const cTop = R.bottom + 23;
  const cRow1 = cTop + 22;
  const cRow2 = cTop + 44;
  const cBottom = cTop + 66;

  // terms
  const tTop = cBottom + 16;
  const tGap = 10.5;

  // investment table
  const invHeadY = tTop + (terms.length - 1) * tGap + 22;
  const iTop = invHeadY + 7;
  const iHead = iTop + 22;
  const iBottom = iHead + 24;
  const colX = [LX, 185, 319, RX];

  // footer
  const fTop = iBottom + 12;
  const stampSize = 90;
  const fMid = fTop + stampSize / 2;

  const [brandTop, ...brandRest] = String(companyName).split(/[\s_]+/);
  const brandBottom = brandRest.join(" ").toLowerCase();

  const line = (y, x1 = LX, x2 = RX) => (
    <line x1={x1} y1={y} x2={x2} y2={y} stroke={TAN} strokeWidth={0.6} />
  );

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
          y={160}
          width={CW - 20}
          height={iBottom - 170}
          opacity={0.08}
          preserveAspectRatio="xMidYMid meet"
        />
      )}

      {/* Logo */}
      {logoUrl ? (
        <image
          href={logoUrl}
          x={55}
          y={14}
          width={84}
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
              y={116}
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
            y={126}
            textAnchor="middle"
            fontSize={6.2}
            fontWeight={700}
            fill="#16A34A"
          >
            एक कदम आत्मनिर्भरता की ओर
          </text>
        </>
      )}

      {/* Title */}
      <text
        x={253}
        y={62}
        textAnchor="middle"
        fontSize={23}
        fontWeight={700}
        style={{ fontFamily: FONT_SERIF }}
      >
        {planTitle}
      </text>

      {/* Dates box */}
      <rect
        x={170}
        y={100.7}
        width={168.5}
        height={28}
        fill="none"
        stroke={TAN}
        strokeWidth={0.7}
      />
      {line(114.7, 170, 338.5)}
      <text x={175} y={110.6} fontSize={8.4}>
        Investment Date -
      </text>
      <text x={252.5} y={110.6} fontSize={8.4}>
        {safeDate(bond.paidDate || bond.enrollmentDate)}
      </text>
      <text x={175} y={124.4} fontSize={8.4}>
        Maturity Date
      </text>
      <text x={229} y={124.4} fontSize={8.4}>
        -
      </text>
      <text x={252.5} y={124.4} fontSize={8.4}>
        {safeDate(bond.maturityDate)}
      </text>

      {/* Photo + stamp overlay */}
      {profilePhoto ? (
        <image
          href={profilePhoto}
          x={364.5}
          y={49.5}
          width={60.5}
          height={70.5}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <>
          <rect
            x={364.5}
            y={49.5}
            width={60.5}
            height={70.5}
            fill="#F3F4F6"
            stroke={TAN}
            strokeWidth={0.7}
          />
          <text x={395} y={92} textAnchor="middle" fontSize={24} fill="#9CA3AF">
            {(name || "?").trim().charAt(0).toUpperCase()}
          </text>
        </>
      )}
      {stampUrl && (
        <image
          href={stampUrl}
          x={394}
          y={90}
          width={50}
          height={50}
          preserveAspectRatio="xMidYMid meet"
        />
      )}

      {/* Serial number */}
      <text x={TX} y={141} fontSize={7.8}>
        S. No.- {bond.bondNumber || bond.userSchemeId || "GKDDP00XX"}
      </text>

      {/* Personal information box */}
      <rect
        x={LX}
        y={R.fullName}
        width={CW}
        height={R.bottom - R.fullName}
        fill="none"
        stroke={TAN}
        strokeWidth={0.7}
      />
      {dividers.map((ly) => (
        <React.Fragment key={ly}>{line(ly)}</React.Fragment>
      ))}
      <line
        x1={228}
        y1={R.dob}
        x2={228}
        y2={R.address}
        stroke={TAN}
        strokeWidth={0.6}
      />
      <line
        x1={276}
        y1={R.marital}
        x2={276}
        y2={R.aadhaar}
        stroke={TAN}
        strokeWidth={0.6}
      />

      <text x={TX} y={mid(R.fullName, R.father)} fontSize={FS}>
        Full Name - {name}
      </text>
      <text x={TX} y={mid(R.father, R.dob)} fontSize={FS}>
        Father Name -{" "}
        {user.gaurdianName || user.guardianName || bond.fatherName || ""}
      </text>
      <text x={TX} y={mid(R.dob, R.address)} fontSize={FS}>
        DOB - {safeDate(user.dob || bond.dob)}
      </text>
      <text x={237.5} y={mid(R.dob, R.address)} fontSize={FS}>
        Email - {user.email || bond.email || "N/A"}
      </text>
      <text
        x={TX}
        y={addressLines[1] ? R.address + 14 : mid(R.address, R.marital)}
        fontSize={FS - 0.2}
      >
        Address - {addressLines[0] || ""}
      </text>
      {addressLines[1] && (
        <text x={TX} y={R.address + 26} fontSize={FS - 0.2}>
          {addressLines[1]}
        </text>
      )}

      <text x={TX} y={mid(R.marital, R.aadhaar)} fontSize={FS}>
        Marital Status
      </text>
      <CheckBoxSVG
        x={142}
        y={(R.marital + R.aadhaar) / 2 - 4.75}
        checked={!isMarried}
      />
      <text x={155} y={mid(R.marital, R.aadhaar)} fontSize={FS}>
        Single
      </text>
      <CheckBoxSVG
        x={192}
        y={(R.marital + R.aadhaar) / 2 - 4.75}
        checked={isMarried}
      />
      <text x={205} y={mid(R.marital, R.aadhaar)} fontSize={FS}>
        Married
      </text>
      <text x={286} y={mid(R.marital, R.aadhaar)} fontSize={FS}>
        Mob No -{" "}
        {user.phone || user.mobileNo || user.mobile || bond.mobileNo || ""}
      </text>

      <text x={TX} y={mid(R.aadhaar, R.nomName)} fontSize={FS}>
        Aadhaar No. - {user.aadhaarNo || user.aadharNo || ""}
      </text>
      <text x={TX} y={mid(R.nomName, R.relation)} fontSize={FS}>
        Nominee Name - {bond.nominee?.name || ""}
      </text>
      <text x={TX} y={mid(R.relation, R.nomMob)} fontSize={FS}>
        Relation - {bond.nominee?.relation || ""}
      </text>
      <text x={TX} y={mid(R.nomMob, R.nomAadhaar)} fontSize={FS}>
        Nominee Mob. No. -{" "}
        {bond.nominee?.phone || bond.nominee?.mobileNo || ""}
      </text>
      <text x={TX} y={mid(R.nomAadhaar, R.bottom)} fontSize={FS}>
        Nominee Aadhaar No. -{" "}
        {bond.nominee?.aadhaarNo || bond.nominee?.aadharNo || ""}
      </text>

      {/* Customer A/C details */}
      <text x={TX} y={cHeadY} fontSize={FS_HEAD} fontWeight={700}>
        Customer A/C Details
      </text>
      <rect
        x={LX}
        y={cTop}
        width={CW}
        height={cBottom - cTop}
        fill="none"
        stroke={TAN}
        strokeWidth={0.7}
      />
      {line(cRow1)}
      {line(cRow2)}
      <text x={TX} y={mid(cTop, cRow1)} fontSize={FS}>
        A/C Holder Name - {user.accountHolderName || name}
      </text>
      <text x={TX} y={mid(cRow1, cRow2)} fontSize={FS}>
        Account No. - {user.accountNo || user.accountNumber || ""}
      </text>
      <text x={254} y={mid(cRow1, cRow2)} fontSize={FS}>
        IFSC - {user.ifsc || user.ifscCode || ""}
      </text>
      <text x={TX} y={mid(cRow2, cBottom)} fontSize={FS}>
        Bank Name. - {user.bankName || ""}
      </text>

      {/* Terms */}
      {terms.map((t, i) => {
        const ty = tTop + i * tGap;
        return (
          <g key={i}>
            <circle cx={LX + 2.2} cy={ty - 2.5} r={1.4} />
            <text x={LX + 6.5} y={ty} fontSize={7.6}>
              {t}
            </text>
          </g>
        );
      })}

      {/* Investment type */}
      <text x={TX} y={invHeadY} fontSize={FS_HEAD + 0.8} fontWeight={700}>
        Investment Type
      </text>
      <rect
        x={LX}
        y={iTop}
        width={CW}
        height={iBottom - iTop}
        fill="none"
        stroke={TAN}
        strokeWidth={0.7}
      />
      {line(iHead)}
      {[1, 2].map((i) => (
        <line
          key={i}
          x1={colX[i]}
          y1={iTop}
          x2={colX[i]}
          y2={iBottom}
          stroke={TAN}
          strokeWidth={0.6}
        />
      ))}
      {["Your Fix Plan", "Tenure Month", "Profit Percentage"].map((label, i) => (
        <text
          key={label}
          x={(colX[i] + colX[i + 1]) / 2}
          y={mid(iTop, iHead)}
          textAnchor="middle"
          fontSize={FS}
          fontWeight={700}
        >
          {label}
        </text>
      ))}
      {[planTitle, `${tenureMonths} Month`, profitLabel].map((val, i) => (
        <text
          key={i}
          x={(colX[i] + colX[i + 1]) / 2}
          y={mid(iHead, iBottom)}
          textAnchor="middle"
          fontSize={FS}
        >
          {val}
        </text>
      ))}

      {/* Footer: contact (left) + stamp (right) */}
      <ContactIcon cx={LX + 8} cy={fMid - 17} Icon={Phone} />
      <text x={LX + 19} y={fMid - 13.5} fontSize={9.6}>
        {bond.companyPhone || "+919430050782"}
      </text>
      <ContactIcon cx={LX + 8} cy={fMid} Icon={Mail} />
      <text x={LX + 19} y={fMid + 3.5} fontSize={9.6}>
        {bond.companyEmail || "karogroww@gmail.com"}
      </text>
      <ContactIcon cx={LX + 8} cy={fMid + 17} Icon={Globe} />
      <text x={LX + 19} y={fMid + 20.5} fontSize={9.6}>
        {bond.companyWebsite || "www.growwkaro.com"}
      </text>

      {stampUrl && (
        <image
          href={stampUrl}
          x={RX - stampSize - 4}
          y={fTop}
          width={stampSize}
          height={stampSize}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
    </svg>
  );
});

export default DailyDepositCertificate;