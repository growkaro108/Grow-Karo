import { useEffect, useState } from "react";
import {
  ChevronDown,
  FileText,
  Landmark,
  Loader2,
  Pen,
  RotateCcwKeyIcon,
  X,
} from "lucide-react";
import BondStub from "./BondStub";
import { currency, dateFmt } from "./format";
import { errorMessage } from "@/components/Message";
import Image from "next/image";

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
  savingBond,
  setSavingBond,
  viewUser,
  editingScheme,
  schemeEditForm,
  nominees,
  onStartEditingScheme,
  onCancelEditingScheme,
  onSchemeEditFieldChange,
  onSaveSchemeDetails,
  savingSchemeDetails,
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const isApproved = !!bond.enrollmentDate;
  const isPension = bond.planType === "PENSION";
  const entryCount =
    (bond.profitLedger?.length ?? 0) + (bond.reedemLedger?.length ?? 0);
  const isTenureCompleteScheme = bond.payoutCycle === "tenure-complete";
  const MAX_FILE_SIZE = 2 * 1024 * 1024;
  const MAX_SOURCE_IMAGE_SIZE = 20 * 1024 * 1024;

  const [preview, setPreview] = useState(null);
  const file = bondFormState.image;

  // Build and clean up the preview URL whenever the selected file changes
  useEffect(() => {
    // 1. Guard check: clear preview and return
    if (!(file instanceof File)) {
      setPreview(null);
      return;
    }

    // 2. Create the blob URL
    const objectUrl = URL.createObjectURL(file);
    setPreview({ url: objectUrl, name: file.name, type: file.type });

    // 3. Guaranteed Cleanup: Always revokes the URL when:
    //    - file changes
    //    - file becomes null/invalid
    //    - component unmounts
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const handleBondFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (
      (selected.type === "application/pdf" || /\.pdf$/i.test(selected.name)) &&
      selected.size > MAX_FILE_SIZE
    ) {
      errorMessage("PDF files must not exceed 2 MB.");
      e.target.value = "";
      onBondFormChange("image", null);
      return;
    }

    if (
      selected.type.startsWith("image/") &&
      selected.size > MAX_SOURCE_IMAGE_SIZE
    ) {
      errorMessage("Images larger than 20 MB cannot be optimized for upload.");
      e.target.value = "";
      onBondFormChange("image", null);
      return;
    }

    onBondFormChange("image", selected);
  };

  const removeFile = () => onBondFormChange("image", null);

  return (
    <div
      className="overflow-hidden rounded-xl border border-slate-800 bg-white/2"
      title={isApproved ? "Approved" : " Not Approve Yet "}
    >
      <div
        className={`flex items-center justify-between gap-3 bg-linear-to-br px-4 py-3.5 text-white ${isApproved ? "from-teal-900 to-[#0c3b3d]" : "from-amber-700 to-[#3d2c0c]"}`}
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
        <p className="shrink-0 font-[Space_Grotesk] text-sm font-semibold tabular-nums text-[#D8B77B] align-center justify-center text-right">
          {currency(bond.paidAmount)}
          <br />
          <span className="text-[10px] text-white/50">
            {isApproved ? "Enroll on: " : "Req on. "}
            {isApproved ? bond.enrollmentDate : bond.requestDate}
          </span>
        </p>
      </div>
      <div
        className={`grid grid-cols-1 ${isPension ? "sm:grid-cols-4" : isTenureCompleteScheme ? "sm:grid-cols-2" : "sm:grid-cols-4"} gap-3 px-4 py-3.5`}
      >
        {!isTenureCompleteScheme && (
          <>
            <Stat
              label={isPension ? "Interest paid" : "Profit"}
              value={currency(isPension ? bond.profitRedeemed : bond.profit)}
              tone="emerald"
            />
            <Stat
              label="Redeemed"
              value={currency(bond.redeemAmount ?? bond.profitRedeemed)}
              tone="amber"
            />
            {isPension && (
              <Stat
                label="Payable"
                value={currency(bond.contractInterestAmount - (bond.redeemAmount ?? bond.profitRedeemed))}
                tone="emerald"
              />
            )}
          </>
        )}
        <Stat
          label="Paid on"
          value={bond.paidDate ? dateFmt(bond.paidDate) : "—"}
        />
        {!isPension && !isTenureCompleteScheme && (
          <Stat
            label="Redeem date"
            value={bond.redeemDate ? dateFmt(bond.redeemDate) : "—"}
          />
        )}
      </div>
      {/* hide if scheme is not approved */}
      {isApproved && (
        <div className="flex flex-wrap gap-2 border-t border-slate-800/70 px-4 py-2.5">
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
            {!bond.bondUrl ? "Add Bond" : "Update Bond"}
          </PanelToggle>
          <PanelToggle
            open={editingScheme}
            onClick={() => {
              if (!editingScheme) onStartEditingScheme();
              else onCancelEditingScheme();
            }}
          >
            Edit <Pen className="h-3.5 w-3.5" />
          </PanelToggle>
        </div>
      )}
      {editingScheme && (
        <div className="space-y-3 border-t border-slate-800/70 bg-slate-950/40 px-4 py-3.5">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-400">
              Invested amount
              <input
                aria-label="Invested amount"
                type="number"
                min="1"
                step="1"
                value={schemeEditForm.paidAmount ?? 100000}
                placeholder="Invested amount"
                onChange={(event) =>
                  onSchemeEditFieldChange("paidAmount", event.target.value)
                }
                className={inputClass}
              />
            </label>
            <label className="text-xs text-slate-400">
              Enrollment / paid date
              <input
                aria-label="Enrollment / paid date"
                type="date"
                value={schemeEditForm.paidDate ?? ""}
                onChange={(event) =>
                  onSchemeEditFieldChange("paidDate", event.target.value)
                }
                className={inputClass}
              />
            </label>
          </div>
          <label className="block text-xs text-slate-400">
            Maturity date
            <input
              aria-label="Maturity date"
              type="date"
              value={schemeEditForm.maturityDate ?? ""}
              onChange={(event) =>
                onSchemeEditFieldChange("maturityDate", event.target.value)
              }
              min={schemeEditForm.paidDate || undefined}
              className={inputClass}
            />
          </label>
          <label className="block text-xs text-slate-400">
            Nominee
            <select
              aria-label="Nominee"
              value={schemeEditForm.nomineeId ?? ""}
              onChange={(event) =>
                onSchemeEditFieldChange("nomineeId", event.target.value)
              }
              className={inputClass}
              required
            >
              <option value="">Select a nominee</option>
              {nominees.map((nominee) => (
                <option key={nominee.nomineeId} value={nominee.nomineeId}>
                  {nominee.name} ({nominee.relation})
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancelEditingScheme}
              disabled={savingSchemeDetails}
              className="flex-1 rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSaveSchemeDetails}
              disabled={savingSchemeDetails}
              className="flex-1 rounded-md bg-teal-400 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50"
            >
              {savingSchemeDetails ? "Saving..." : "Save scheme"}
            </button>
          </div>
        </div>
      )}
      {historyOpen && (
        <div className="space-y-2.5 border-t border-slate-800/70 bg-slate-950/40 px-4 py-3.5">
          {profitRows.length === 0 && reedemRows.length === 0 && (
            <p className="text-xs text-slate-500">No ledger entries yet.</p>
          )}
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
            {isPension ? "Interest payout history" : "Profit history"}
          </p>
          {profitRows.map((entry, index) => (
            <div
              key={entry.id ?? index + 1}
              className={`grid gap-2 ${isPension ? "grid-cols-3" : "grid-cols-2"}`}
            >
              <input
                aria-label={isPension ? "Interest payout amount" : "Profit amount"}
                type="number"
                min="0"
                step="0.01"
                placeholder={isPension ? "Interest payout amount" : "Profit amount"}
                value={entry.profitAmount}
                onChange={(e) =>
                  onProfitFieldChange(index, "profitAmount", e.target.value)
                }
                className={inputClass}
                disabled={entry.id}
              />
              <input
                aria-label={isPension ? "Interest payout date" : "Profit date"}
                type="date"
                value={entry.profitDate}
                onChange={(e) =>
                  onProfitFieldChange(index, "profitDate", e.target.value)
                }
                className={inputClass}
                disabled={entry.id}
              />
              {isPension && (
                <label className="flex items-center justify-center gap-1.5 rounded-md border border-slate-700 px-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={Boolean(entry.paid)}
                    onChange={(event) =>
                      onProfitFieldChange(index, "paid", event.target.checked)
                    }
                  />
                  {entry.paid ? "Paid" : "Unpaid"}
                </label>
              )}
            </div>
          ))}
          {!isPension && (
            <button
              type="button"
              onClick={onAddProfitRow}
              className="text-xs font-medium text-teal-300 hover:text-teal-200"
            >
              + Add profit row
            </button>
          )}
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
                disabled={entry.id}
              />
              <input
                aria-label="Redeem date"
                type="date"
                value={entry.redeemDate}
                onChange={(e) =>
                  onReedemFieldChange(index, "redeemDate", e.target.value)
                }
                className={inputClass}
                disabled={entry.id}
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
            value={bondFormState.bondNumber ?? bond.bondNumber ?? "GKFD"}
            onChange={(e) => onBondFormChange("bondNumber", e.target.value)}
            className={inputClass}
          />
          {preview ? (
            <div className="sea-file-grid">
              <div className="sea-file-chip">
                {preview.type === "application/pdf" ? (
                  <iframe
                    src={preview.url}
                    title={`Preview of ${preview.name}`}
                    className="sea-file-thumb mx-auto"
                  />
                ) : (
                  <Image
                    src={preview.url}
                    alt={preview.name}
                    width={100}
                    height={100}
                    className="sea-file-thumb w-full h-auto object-contain"
                  />
                )}
                <span className="sea-file-name" title={preview.name}>
                  <FileText size={12} /> {preview.name}
                </span>
                <button
                  type="button"
                  className="sea-file-remove"
                  onClick={removeFile}
                  disabled={savingBond}
                  aria-label={`Remove ${preview.name}`}
                >
                  <X size={14} color="white " className="hover:text-red-500 transition-all duration-150 hover:scale-105 hover:rotate-180 cursor-pointer" />
                </button>
              </div>
            </div>
          ) : (
            <input
              aria-label="Bond file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf,.pdf"
              onChange={handleBondFileChange}
              className="w-full text-xs text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:text-slate-200 hover:file:bg-slate-700"
            />
          )}
          <button
            type="button"
            disabled={savingBond}
            onClick={onSaveBond}
            aria-busy={savingBond}
            className={`relative w-full overflow-hidden rounded-md px-3 py-2 text-xs font-semibold transition ${savingBond
                ? "cursor-not-allowed border-slate-600 bg-slate-950/30 text-slate-600"
                : "border border-teal-700 text-teal-300 hover:bg-teal-950/50 focus:cursor-none focus:opacity-50"
              }`}
          >
            {savingBond ? (
              <>
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Saving…
                </span>
                <span
                  className="bond-save-progress-track"
                  role="progressbar"
                  aria-label="Saving bond details"
                >
                  <span className="bond-save-progress-indicator block" />
                </span>
              </>
            ) : (
              "Save bond details"
            )}
          </button>
        </div>
      )}
      <div className="border-t border-slate-800/70 px-4 py-3.5">
        <p className="mb-2 text-[10px] uppercase tracking-wide text-slate-500">
          Certificate
        </p>
        {!isApproved && !bond.bondUrl ? (
          <div className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-500">
            Not Approved yet.
          </div>
        ) : (
          <BondStub
            bond={bond}
            userName={user.name}
            scheme={bond.schemeName || user.scheme}
            onView={onViewBond}
            viewUser={viewUser}
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
