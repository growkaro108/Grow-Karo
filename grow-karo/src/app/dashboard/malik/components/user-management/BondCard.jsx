import { useState } from "react";
import { ChevronDown, Landmark, RotateCcwKeyIcon } from "lucide-react";
import BondStub from "./BondStub";
import StatusPill from "./StatusPill";
import { currency, dateFmt } from "./format";

const inputClass =
  "w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 [color-scheme:dark]";

export function Stat({ label, value, tone = "default" }) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-300"
      : tone === "amber"
        ? "text-amber-300"
        : "text-slate-200";
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-medium tabular-nums ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

export function PanelToggle({ open, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition ${open ? "border-teal-700 bg-teal-950/50 text-teal-300" : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200"}`}
    >
      {children}
      <ChevronDown
        className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
      />
    </button>
  );
}

export default function BondCard({
  bond,
  user,
  profitRows,
  reedemRows,
  bondFormState,
  onProfitFieldChange,
  onReedemFieldChange,
  onAddProfitRow,
  onAddReedemRow,
  onSaveLedgers,
  onBondFormChange,
  onSaveBond,
  onViewBond,
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const entryCount =
    (bond.profitLedger?.length ?? 0) + (bond.reedemLedger?.length ?? 0);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-white/2">
      <div
        className={`flex items-center justify-between gap-3 bg-linear-to-br px-4 py-3.5 text-white ${bond.enrollmentDate ? "from-teal-900 to-[#0c3b3d]" : "from-amber-700 to-[#3d2c0c]"}`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {bond.bondUrl ? (
            <Landmark className="h-5 w-5 shrink-0 text-[#D8B77B]" />
          ) : (
            <RotateCcwKeyIcon className="h-5 w-5 shrink-0 text-[#D8B77B]" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{bond.schemeName}</p>
            <p className="text-xs text-white/50">
              {entryCount} ledger {entryCount === 1 ? "entry" : "entries"}
            </p>
          </div>
        </div>
        <p className="shrink-0 font-[Space_Grotesk] text-sm font-semibold tabular-nums text-[#D8B77B]">
          {currency(bond.paidAmount)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 py-3.5 sm:grid-cols-4">
        <Stat label="Profit" value={currency(bond.profit)} tone="emerald" />
        <Stat
          label="Redeemed"
          value={currency(bond.redeemAmount ?? bond.profitRedeemed)}
          tone="amber"
        />
        <Stat
          label="Paid"
          value={bond.paidDate ? dateFmt(bond.paidDate) : "—"}
        />
        <Stat
          label="Redeem date"
          value={bond.redeemDate ? dateFmt(bond.redeemDate) : "—"}
        />
      </div>
      <div className="flex gap-2 border-t border-slate-800/70 px-4 py-2.5">
        <PanelToggle
          open={historyOpen}
          onClick={() => setHistoryOpen((v) => !v)}
        >
         Update Ledger
        </PanelToggle>
        <PanelToggle
          open={detailsOpen}
          onClick={() => setDetailsOpen((v) => !v)}
        >
          Update Bond
        </PanelToggle>
      </div>
      {historyOpen && (
        <div className="space-y-2.5 border-t border-slate-800/70 bg-slate-950/40 px-4 py-3.5">
          {profitRows.length === 0 && reedemRows.length === 0 && (
            <p className="text-xs text-slate-500">No ledger entries yet.</p>
          )}
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
            Profit history
          </p>
          {profitRows.map((entry, index) => (
            <div key={entry.id ?? index} className="grid grid-cols-2 gap-2">
              <input
                aria-label="Profit amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Profit amount"
                value={entry.profitAmount}
                onChange={(e) =>
                  onProfitFieldChange(index, "profitAmount", e.target.value)
                }
                className={inputClass}
              />
              <input
                aria-label="Profit date"
                type="date"
                value={entry.profitDate}
                onChange={(e) =>
                  onProfitFieldChange(index, "profitDate", e.target.value)
                }
                className={inputClass}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={onAddProfitRow}
            className="text-xs font-medium text-teal-300 hover:text-teal-200"
          >
            + Add profit row
          </button>
          <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
            Redeem history
          </p>
          {reedemRows.map((entry, index) => (
            <div key={entry.id ?? index} className="grid grid-cols-2 gap-2">
              <input
                aria-label="Redeem amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Redeem amount"
                value={entry.redeemAmount}
                onChange={(e) =>
                  onReedemFieldChange(index, "redeemAmount", e.target.value)
                }
                className={inputClass}
              />
              <input
                aria-label="Redeem date"
                type="date"
                value={entry.redeemDate}
                onChange={(e) =>
                  onReedemFieldChange(index, "redeemDate", e.target.value)
                }
                className={inputClass}
              />
            </div>
          ))}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onAddReedemRow}
              className="text-xs font-medium text-teal-300 hover:text-teal-200"
            >
              + Add redeem row
            </button>
            <p className="text-xs text-slate-500">
              Total redeemed:{" "}
              <strong className="text-amber-300">
                {currency(bond.profitRedeemed)}
              </strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onSaveLedgers}
            className="w-full rounded-md border border-amber-700 px-3 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-950/50"
          >
            Save ledgers
          </button>
        </div>
      )}
      {detailsOpen && (
        <div className="space-y-2.5 border-t border-slate-800/70 bg-slate-950/40 px-4 py-3.5">
          <input
            aria-label="Bond number"
            placeholder={bond.bondNumber || "Bond number"}
            value={bondFormState.bondNumber ?? ""}
            onChange={(e) => onBondFormChange("bondNumber", e.target.value)}
            className={inputClass}
          />
          <input
            aria-label="Bond image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => onBondFormChange("image", e.target.files?.[0])}
            className="w-full text-xs text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:text-slate-200 hover:file:bg-slate-700"
          />
          <button
            type="button"
            onClick={onSaveBond}
            className="w-full rounded-md border border-teal-700 px-3 py-2 text-xs font-semibold text-teal-300 transition hover:bg-teal-950/50"
          >
            Save bond details
          </button>
        </div>
      )}
      <div className="border-t border-slate-800/70 px-4 py-3.5">
        <p className="mb-2 text-[10px] uppercase tracking-wide text-slate-500">
          Certificate
        </p>
        {!bond.bondUrl ? (
          <div className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-500">
            No bond issued yet.
          </div>
        ) : (
          <BondStub
            bond={bond}
            userName={user.name}
            scheme={user.scheme}
            onView={onViewBond}
          />
        )}
        {bond.nominee && (
          <div className="border-t border-slate-800/70 px-4 py-3 text-xs text-slate-400">
            Nominee:{" "}
            <strong className="text-slate-200">{bond.nominee.name}</strong>
            <span className="ml-2 text-slate-500">
              ({bond.nominee.relation})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
