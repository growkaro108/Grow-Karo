"use client";

import dynamic from "next/dynamic";
import { currency } from "./format";

const SIPDownloadButton = dynamic(() => import("./SIPDownloadButton"), {
  ssr: false,
});

const DailyDepositRows = dynamic(() => import("./DailyDepositRows"), {
  ssr: false,
});
export default function DailyDepositLedgerPanel({
  bond,
  user,
  rows = [],
  onChange,
  onAdd,
  onRemove,
  onSave,
  saving = false,
}) {
  const total = rows.reduce(
    (sum, row) => sum + (Number(row.depositAmount) || 0),
    0,
  );

  return (
    <div className="mt-2 space-y-3 rounded-xl border border-teal-900/60 bg-teal-950/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-teal-200">Daily Deposit ledger</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {rows.length} deposits · {currency(total)} total
          </p>
        </div>
        <div className="flex gap-2">
          <SIPDownloadButton
            bond={bond}
            userData={user}
            logoUrl="/logo.png"
            stampUrl="/stamp.png"
          />
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-md bg-teal-400 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save deposits"}
          </button>
        </div>
      </div>
      <DailyDepositRows
        rows={rows}
        onChange={onChange}
        onAdd={onAdd}
        onRemove={onRemove}
      />
      <p className="text-[10px] text-slate-500">
        Minimum: {currency(bond.minimumAmount)} per deposit · Maximum: ₹2,000
        per calendar day · Maturity: {bond.maturityDate || "—"}
      </p>
    </div>
  );
}
