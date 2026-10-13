import {
  ArrowDownToLine,
  ArrowUpToLine,
  CalendarClock,
  ChevronDown,
  Percent,
  Plus,
} from "lucide-react";
import { currency, daysToMonths } from "./format";

const inputClass =
  "w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 [color-scheme:dark]";

function SchemeSummary({ scheme }) {
  const isSip = scheme.planType === "SIP";
  return (
    <div className="grid grid-cols-2 items-center gap-x-6 gap-y-3 rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-3.5">
      <div className="flex items-center gap-2">
        <ArrowDownToLine className="h-4 w-4 text-slate-500" />
        <span className="text-[13px] text-slate-500">Min</span>
        <span className="text-[15px] font-medium text-slate-100">
          {currency(scheme.minimumAmount) ?? "0"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <ArrowUpToLine className="h-4 w-4 text-slate-500" />
        <span className="text-[13px] text-slate-500">Max</span>
        <span className="text-[15px] font-medium text-slate-100">
          {currency(scheme.maximumAmount) ?? "0"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Percent className="h-4 w-4 text-emerald-500" />
        {/* <span className="text-[13px] text-slate-500">Interest</span> */}
        <span className="text-[15px] font-semibold text-emerald-400">
          {scheme.profitPercentage ?? "0"}%{isSip ? "/mo" : ""}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-slate-500" />
        <span className="text-[14px] font-medium text-slate-100">
          {isSip
            ? `${scheme.tenureMonths ?? "?"} months`
            : (daysToMonths(scheme.tenure) ?? "0 days")}
        </span>
      </div>
      {isSip && (
        <div className="flex items-center gap-2 col-span-2">
          {/* <span className="text-[13px] text-indigo-400 font-semibold">
            SIP Plan
          </span> */}
          <span className="text-[13px] text-slate-300">
           Due on every {scheme.sipDay || 20}th
          </span>
        </div>
      )}
    </div>
  );
}

function LedgerRows({ type, rows, onChange, onAdd }) {
  const isProfit = type === "profit";
  const amount = isProfit ? "profitAmount" : "redeemAmount";
  const date = isProfit ? "profitDate" : "redeemDate";
  return (
    <>
      {rows.map((entry, index) => (
        <div
          key={entry.id ?? index}
          className="grid grid-cols-2 gap-2 rounded-md border border-slate-800 p-2"
        >
          <input
            aria-label={isProfit ? "Profit amount" : "Redeem amount"}
            type="number"
            min={isProfit ? "100" : "0"}
            step={isProfit ? "100" : "0.01"}
            placeholder={isProfit ? "Profit amount" : "Redeem amount"}
            value={entry[amount]}
            onChange={(event) => onChange(index, amount, event.target.value)}
            className={inputClass}
          />
          <input
            aria-label={isProfit ? "Profit date" : "Redeem date"}
            type="date"
            value={entry[date]}
            onChange={(event) => onChange(index, date, event.target.value)}
            className={inputClass}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="text-xs font-medium text-teal-300 hover:text-teal-200"
      >
        + Add {isProfit ? "profit" : "redeem"} row
      </button>
    </>
  );
}

function SipInstallmentRows({ rows, onChange, onAdd, onRemove }) {
  return (
    <div className="space-y-2 rounded-xl border border-indigo-900/60 bg-indigo-950/15 p-3 scrollbar-none">
      <div className="scrollbar-none">
        <p className="text-xs font-semibold text-indigo-300">
          User SIP schedule
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          Adjust each installment date and amount for this user. The paid amount
          can differ from the amount due.
        </p>
      </div>
      <div className="grid grid-cols-12 gap-1 px-1 text-[10px] text-slate-500">
        <span className="col-span-1">No.</span>
        {/* <span className="col-span-3">Installment date</span>
        <span className="col-span-2">Due (₹)</span> */}
        <span className="col-span-3">Paid date</span>
        <span className="col-span-2">Paid (₹)</span>
        <span className="col-span-1" />
      </div>
      <div className="max-h-72 space-y-1 overflow-y-auto scroll-auto scrollbar-none">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-12 items-center gap-1">
            <span className="col-span-1 text-xs text-slate-500">
              {index + 1}
            </span>
            {/* <input
              aria-label={`Installment ${index + 1} date`}
              type="date"
              value={row.installmentDate ?? ""}
              onChange={(event) =>
                onChange(index, "installmentDate", event.target.value)
              }
              className={`col-span-3 ${inputClass}`}
            />
            <input
              aria-label={`Installment ${index + 1} due amount`}
              type="number"
              min="0.01"
              step="0.01"
              value={row.dueAmount ?? ""}
              onChange={(event) =>
                onChange(index, "dueAmount", event.target.value)
              }
              className={`col-span-2 ${inputClass}`}
            /> */}
            <input
              aria-label={`Installment ${index + 1} paid date`}
              type="date"
              value={row.paidDate ?? ""}
              onChange={(event) =>
                onChange(index, "paidDate", event.target.value)
              }
              className={`col-span-5 ${inputClass}`}
            />
            <input
              aria-label={`Installment ${index + 1} paid amount`}
              type="number"
              min="0"
              step="0.01"
              value={row.paidAmount ?? "0"}
              onChange={(event) =>
                onChange(index, "paidAmount", event.target.value)
              }
              className={`col-span-5 ${inputClass}`}
            />
            <button
              type="button"
              aria-label={`Remove installment ${index + 1}`}
              onClick={() => onRemove(index)}
              className="col-span-1 text-sm text-rose-400 hover:text-rose-300"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
      >
        + Add installment
      </button>
    </div>
  );
}

export default function SchemeManagementPanel({
  formTopRef,
  isEditing,
  editingBond,
  form,
  addFormOpen,
  setAddFormOpen,
  updateForm,
  schemes,
  selectedScheme,
  nominees,
  nomineeFormOpen,
  setNomineeFormOpen,
  nomineeForm,
  updateNomineeForm,
  saveNominee,
  nomineeSaving,
  updateFormLedger,
  addFormLedgerRow,
  showLedgers,
  saveScheme,
  saving,
  resetForm,
  sipLedger = [],
  onSipInstallmentChange,
  onAddSipInstallment,
  onRemoveSipInstallment,
}) {
  return (
    <div
      ref={formTopRef}
      className={`mb-7 overflow-hidden rounded-xl border ${
        isEditing
          ? "border-amber-700/70 bg-amber-950/10"
          : "border-teal-900/70 bg-teal-950/20"
      }`}
    >
      <button
        type="button"
        onClick={() => setAddFormOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left"
      >
        <span
          className={`flex items-center font-[Space_Grotesk] text-sm font-semibold ${
            isEditing ? "text-amber-300" : "text-teal-300"
          }`}
        >
          <Plus className="mr-0.5 h-5 w-5" />
          {isEditing
            ? `Edit scheme${editingBond.schemeName ? `: ${editingBond.schemeName}` : ""}`
            : "Add scheme manually"}
        </span>
        <span className="flex items-center gap-2 text-[10px] text-slate-500">
          Admin only
          <ChevronDown
            className={`h-3.5 w-3.5 text-teal-300 transition-transform ${
              addFormOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {addFormOpen && (
        <form
          onSubmit={saveScheme}
          className="space-y-3 border-t border-teal-900/70 px-4 py-4"
        >
          <label className="block text-xs text-slate-400">
            Scheme
            <select
              name="schemeId"
              value={form.schemeId}
              onChange={updateForm}
              required
              className={`mt-1 ${inputClass}`}
            >
              <option value="">Select a scheme</option>
              {schemes.map((scheme) => (
                <option key={scheme.schemeId} value={scheme.schemeId}>
                  {scheme.schemeName}
                </option>
              ))}
            </select>
          </label>

          {selectedScheme && <SchemeSummary scheme={selectedScheme} />}

          <label className="block text-xs text-slate-400">
            Nominee for this scheme
            <select
              name="nomineeId"
              value={form.nomineeId}
              onChange={updateForm}
              required
              disabled={!nominees.length}
              className={`mt-1 ${inputClass}`}
            >
              <option value="">
                {nominees.length
                  ? "Select a nominee"
                  : "No nominees found for this user"}
              </option>
              {nominees.map((nominee) => (
                <option key={nominee.nomineeId} value={nominee.nomineeId}>
                  {nominee.name} ({nominee.relation})
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setNomineeFormOpen((value) => !value)}
            className="text-xs font-medium text-teal-300 hover:text-teal-200"
          >
            {nomineeFormOpen
              ? "Cancel new nominee"
              : "+ Add nominee to user account"}
          </button>
          {nomineeFormOpen && (
            <div className="space-y-2 rounded-md border border-slate-800 bg-slate-950/40 p-3">
              <input
                name="name"
                value={nomineeForm.name}
                onChange={updateNomineeForm}
                placeholder="Nominee name"
                className={inputClass}
              />
              <input
                name="relation"
                value={nomineeForm.relation}
                onChange={updateNomineeForm}
                placeholder="Relation"
                className={inputClass}
              />
              <input
                name="aadhaarNo"
                value={nomineeForm.aadhaarNo}
                onChange={updateNomineeForm}
                placeholder="Aadhaar number"
                type="text"
                maxLength="12"
                inputMode="numeric"
                pattern="[0-9]*"
                className={inputClass}
              />
              <input
                name="phone"
                value={nomineeForm.phone}
                onChange={updateNomineeForm}
                type="text"
                maxLength="10"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Phone Number"
                className={inputClass}
              />
              <button
                type="button"
                onClick={saveNominee}
                disabled={nomineeSaving}
                className="w-full rounded-md bg-teal-400 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50"
              >
                {nomineeSaving ? "Saving nominee..." : "Save nominee"}
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {selectedScheme?.planType === "SIP" ? (
              <>
                <label className="text-xs text-slate-400">
                  Enrollment / First installment date
                  <input
                    name="paidDate"
                    type="date"
                    value={form.paidDate}
                    onChange={updateForm}
                    required
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="col-span-2 text-xs text-slate-400">
                  Maturity date
                  <input
                    name="maturityDate"
                    type="date"
                    value={form.maturityDate}
                    onChange={updateForm}
                    min={form.paidDate || undefined}
                    required
                    className={`mt-1 ${inputClass}`}
                  />
                  <span className="mt-1 block text-[10px] text-slate-500">
                    Auto-calculated from start date +{" "}
                    {selectedScheme.tenureMonths || "?"} months.
                  </span>
                </label>
                <div className="col-span-2">
                  <SipInstallmentRows
                    rows={sipLedger}
                    onChange={onSipInstallmentChange}
                    onAdd={onAddSipInstallment}
                    onRemove={onRemoveSipInstallment}
                  />
                </div>
              </>
            ) : (
              <>
                <label className="text-xs text-slate-400">
                  Invested amount
                  <input
                    name="paidAmount"
                    type="number"
                    min="1000"
                    step="1000"
                    value={form.paidAmount}
                    onChange={updateForm}
                    required
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Enrollment / paid date
                  <input
                    name="paidDate"
                    type="date"
                    value={form.paidDate}
                    onChange={updateForm}
                    required
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="col-span-2 text-xs text-slate-400">
                  Maturity date
                  <input
                    name="maturityDate"
                    type="date"
                    value={form.maturityDate}
                    onChange={updateForm}
                    min={form.paidDate || undefined}
                    required
                    className={`mt-1 ${inputClass}`}
                  />
                  <span className="mt-1 block text-[10px] text-slate-500">
                    Calculated from enrollment date and tenure; editable.
                  </span>
                </label>
              </>
            )}
          </div>

          {showLedgers && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                Profit and redemption entries
              </p>
              <LedgerRows
                type="profit"
                rows={form.profitLedger}
                onChange={updateFormLedger("profit")}
                onAdd={addFormLedgerRow("profit")}
              />
              <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                Redeem history
              </p>
              <LedgerRows
                type="redeem"
                rows={form.reedemLedger}
                onChange={updateFormLedger("redeem")}
                onAdd={addFormLedgerRow("redeem")}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !schemes.length}
            className="w-full rounded-lg bg-teal-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : isEditing
                ? "Update scheme"
                : "Add scheme to account"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancel edit
            </button>
          )}
        </form>
      )}
    </div>
  );
}
