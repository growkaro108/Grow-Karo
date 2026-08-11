import React from "react";
import { currency, formatDate } from "@/app/plan/utils/planUtils";

export default function BondCertificate({
  bond,
  userName,
  scheme,
  className = "",
}) {
  // console.log(userName + " " + userName + " " + bond);
  const gradId = `paper-${bond.userSchemeId}`;
  return (
    <svg
      viewBox="0 0 480 300"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FBF8F0" />
          <stop offset="100%" stopColor="#F3ECD9" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="480" height="300" fill={`url(#${gradId})`} />
      <rect
        x="10"
        y="10"
        width="460"
        height="280"
        fill="none"
        stroke="#0E4749"
        strokeWidth="2"
      />
      <rect
        x="16"
        y="16"
        width="448"
        height="268"
        fill="none"
        stroke="#B98B3E"
        strokeWidth="1"
      />

      {/* guilloche-style decoration */}
      {[...Array(6)].map((_, i) => (
        <ellipse
          key={i}
          cx="240"
          cy="150"
          rx={40 + i * 18}
          ry={22 + i * 10}
          fill="none"
          stroke="#0E4749"
          strokeOpacity="0.07"
        />
      ))}

      <text
        x="240"
        y="52"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="19"
        fill="#0E4749"
        letterSpacing="3"
      >
        BOND CERTIFICATE
      </text>
      <text
        x="240"
        y="72"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="10"
        fill="#B98B3E"
        letterSpacing="3"
      >
        {scheme?.toUpperCase()}
      </text>

      <line
        x1="60"
        y1="88"
        x2="420"
        y2="88"
        stroke="#0E4749"
        strokeOpacity="0.3"
      />

      <text
        x="240"
        y="116"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="12"
        fill="#4B5563"
      >
        This certifies that
      </text>
      <text
        x="240"
        y="144"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="21"
        fill="#0E4749"
        fontWeight="bold"
      >
        {userName}
      </text>
      <text
        x="240"
        y="166"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="12"
        fill="#4B5563"
      >
        holds a principal of
      </text>
      <text
        x="240"
        y="192"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="18"
        fill="#B98B3E"
        fontWeight="bold"
      >
        {currency(bond.paidAmount)}
      </text>
      <text
        x="240"
        y="212"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="11"
        fill="#4B5563"
      >
        at {bond.profitPercentage}% on every {bond.payoutFrequency}, maturing on{" "}
        {formatDate(bond.maturityDate)}
      </text>

      <line
        x1="60"
        y1="232"
        x2="420"
        y2="232"
        stroke="#0E4749"
        strokeOpacity="0.3"
      />

      <text
        x="38"
        y="260"
        fontFamily="ui-monospace, monospace"
        fontSize="10"
        fill="#6B7280"
      >
        Serial: {bond.userSchemeId}
      </text>
      <text
        x="442"
        y="260"
        textAnchor="end"
        fontFamily="Georgia, serif"
        fontSize="10"
        fill="#6B7280"
        fontStyle="italic"
      >
        Authorized Signatory
      </text>
    </svg>
  );
}
