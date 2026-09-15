import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Mail,
  Phone,
  Calendar,
  Landmark,
  RotateCcwKeyIcon,
  HandCoins,
  ChevronDown,
} from "lucide-react";
import StatusPill from "./StatusPill";
import BondCard, { PanelToggle, Stat } from "./BondCard";
import BondStub from "./BondStub";
import { currency, dateFmt, initials } from "./format";
import dynamic from "next/dynamic";
import TabLoader from "@/loader/TabLoader";
import { getAllPlans } from "@/api/generalApi";
import {
  addBond,
  addManualUserScheme,
  createAdminUserNominee,
  fetchAdminUserNominees,
  updateUserSchemeLedger,
} from "../../../../../../services/malikService";

const CertificateLightbox = dynamic(() => import("../Certificatelightbox"), {
  loading: () => <TabLoader message="Loading certificate..." />,
  ssr: false,
});

const inputClass =
  "w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 [color-scheme:dark]";

/* Legacy inline card retained temporarily while the extracted card is adopted. */
function LegacyBondCard({
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
  const entryCount = (bond.profitLedger?.length ?? 0) + (bond.reedemLedger?.length ?? 0);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-white/2">
      {/* Header */}
      <div
        className={`flex items-center justify-between gap-3 bg-linear-to-br px-4 py-3.5 text-white ${
          bond.enrollmentDate
            ? "from-teal-900 to-[#0c3b3d]"
            : "from-amber-700 to-[#3d2c0c]"
        }`}
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-4 py-3.5 sm:grid-cols-4">
        <Stat label="Profit" value={currency(bond.profit)} tone="emerald" />
        <Stat
          label="Redeemed"
          value={currency(bond.redeemAmount ?? bond.profitRedeemed)}
          tone="amber"
        />
        <Stat label="Paid" value={bond.paidDate ? dateFmt(bond.paidDate) : "—"} />
        <Stat label="Redeem date" value={bond.redeemDate ? dateFmt(bond.redeemDate) : "—"} />
      </div>

      {/* Panel toggles */}
      <div className="flex gap-2 border-t border-slate-800/70 px-4 py-2.5">
        <PanelToggle open={historyOpen} onClick={() => setHistoryOpen((v) => !v)}>
          Ledger
        </PanelToggle>
        <PanelToggle open={detailsOpen} onClick={() => setDetailsOpen((v) => !v)}>
          Bond details
        </PanelToggle>
      </div>

      {/* Ledger editor */}
      {historyOpen && (
        <div className="space-y-2.5 border-t border-slate-800/70 bg-slate-950/40 px-4 py-3.5">
          {profitRows.length === 0 && reedemRows.length === 0 && (
            <p className="text-xs text-slate-500">No ledger entries yet.</p>
          )}
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">Profit history</p>
          {profitRows.map((entry, index) => (
            <div key={entry.id ?? index} className="grid grid-cols-2 gap-2">
              <input
                aria-label="Profit amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Profit amount"
                value={entry.profitAmount}
                onChange={(e) => onProfitFieldChange(index, "profitAmount", e.target.value)}
                className={inputClass}
              />
              <input
                aria-label="Profit date"
                type="date"
                value={entry.profitDate}
                onChange={(e) => onProfitFieldChange(index, "profitDate", e.target.value)}
                className={inputClass}
              />
            </div>
          ))}
          <button type="button" onClick={onAddProfitRow} className="text-xs font-medium text-teal-300 hover:text-teal-200">+ Add profit row</button>
          <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-amber-300">Redeem history</p>
          {reedemRows.map((entry, index) => (
            <div key={entry.id ?? index} className="grid grid-cols-2 gap-2">
              <input aria-label="Redeem amount" type="number" min="0" step="0.01" placeholder="Redeem amount" value={entry.redeemAmount} onChange={(e) => onReedemFieldChange(index, "redeemAmount", e.target.value)} className={inputClass} />
              <input aria-label="Redeem date" type="date" value={entry.redeemDate} onChange={(e) => onReedemFieldChange(index, "redeemDate", e.target.value)} className={inputClass} />
            </div>
          ))}
          <div className="flex items-center justify-between pt-1">
            <button type="button" onClick={onAddReedemRow} className="text-xs font-medium text-teal-300 hover:text-teal-200">+ Add redeem row</button>
            <p className="text-xs text-slate-500">
              Total redeemed:{" "}
              <strong className="text-amber-300">{currency(bond.profitRedeemed)}</strong>
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

      {/* Bond details editor */}
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

      {/* Certificate */}
      <div className="border-t border-slate-800/70 px-4 py-3.5">
        <p className="mb-2 text-[10px] uppercase tracking-wide text-slate-500">Certificate</p>
        {!bond.bondUrl ? (
          <div className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-500">
            No bond issued yet.
          </div>
        ) : (
          <BondStub bond={bond} userName={user.name} scheme={user.scheme} onView={onViewBond} />
        )}
        {bond.nominee && (
          <div className="border-t border-slate-800/70 px-4 py-3 text-xs text-slate-400">
            Nominee: <strong className="text-slate-200">{bond.nominee.name}</strong>
            <span className="ml-2 text-slate-500">({bond.nominee.relation})</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserDrawer({ user, onClose, onSaved }) {
  const [viewingBond, setViewingBond] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [form, setForm] = useState({
    schemeId: "",
    nomineeId: "",
    paidAmount: "",
    paidDate: "",
    profitLedger: [{ profitAmount: "", profitDate: "" }],
    reedemLedger: [{ redeemAmount: "0", redeemDate: "" }],
  });
  const [bondForms, setBondForms] = useState({});
  const [ledgerEdits, setLedgerEdits] = useState({});
  const [nominees, setNominees] = useState([]);
  const [nomineeFormOpen, setNomineeFormOpen] = useState(false);
  const [nomineeSaving, setNomineeSaving] = useState(false);
  const [nomineeForm, setNomineeForm] = useState({
    name: "",
    relation: "",
    aadhaarNo: "",
    phone: "",
  });

  useEffect(() => {
    getAllPlans()
      .then((response) => setSchemes(response?.data ?? []))
      .catch(() => setSchemes([]));
  }, []);

  useEffect(() => {
    if (!form.schemeId && schemes[0]?.schemeId) {
      setForm((current) => ({ ...current, schemeId: schemes[0].schemeId }));
    }
  }, [form.schemeId, schemes]);

  useEffect(() => {
    if (!user?.userId) return;
    fetchAdminUserNominees(user.userId).then(setNominees).catch(() => setNominees([]));
  }, [user?.userId]);

  useEffect(() => {
    setLedgerEdits(
      Object.fromEntries(
        (user?.enrolledSchemes ?? []).map((bond) => [
          bond.userSchemeId,
          {
            profitLedger: (bond.profitLedger ?? []).map((entry) => ({
              id: entry.id,
              profitAmount: entry.profitAmount ?? "0",
              profitDate: entry.profitDate ?? "",
            })),
            reedemLedger: (bond.reedemLedger ?? []).map((entry) => ({
              id: entry.id,
              redeemAmount: entry.redeemAmount ?? "0",
              redeemDate: entry.redeemDate ?? "",
            })),
          },
        ]),
      ),
    );
  }, [user]);

  // Bonds without a certificate image first, then newest first.
  const sortedBonds = useMemo(() => {
    return [...(user?.enrolledSchemes ?? [])].sort((a, b) => {
      if (a.bondUrl === null && b.bondUrl !== null) return -1;
      if (a.bondUrl !== null && b.bondUrl === null) return 1;
      return b.id - a.id;
    });
  }, [user]);

  const totalPrincipal = useMemo(
    () => (user?.enrolledSchemes ?? []).reduce((sum, b) => sum + (b.paidAmount ?? 0), 0),
    [user],
  );

  if (!user) return null;

  const selectedScheme = schemes.find((scheme) => scheme.schemeId === form.schemeId);

  const updateNomineeForm = (event) =>
    setNomineeForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const saveNominee = async (event) => {
    event.preventDefault();
    setNomineeSaving(true);
    const nominee = await createAdminUserNominee(user.userId, nomineeForm);
    setNomineeSaving(false);
    if (nominee) {
      setNominees((current) => [...current, nominee]);
      setForm((current) => ({ ...current, nomineeId: nominee.nomineeId }));
      setNomineeForm({ name: "", relation: "", aadhaarNo: "", phone: "" });
      setNomineeFormOpen(false);
    }
  };

  const updateForm = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const saveScheme = async (event) => {
    event.preventDefault();
    setSaving(true);
    const saved = await addManualUserScheme({
      userId: user.userId,
      schemeId: form.schemeId,
      nomineeId: form.nomineeId,
      paidAmount: Number(form.paidAmount),
      paidDate: form.paidDate,
      profitLedger: form.profitLedger.map((entry) => ({
        profitAmount: Number(entry.profitAmount || 0),
        profitDate: entry.profitDate || null,
      })),
      reedemLedger: form.reedemLedger.map((entry) => ({
        redeemDate: entry.redeemDate || null,
        redeemAmount: Number(entry.redeemAmount || 0),
      })),
    });
    setSaving(false);
    if (saved) {
      setForm((current) => ({
        ...current,
        paidAmount: "",
        paidDate: "",
        profitLedger: [{ profitAmount: "", profitDate: "" }],
        reedemLedger: [{ redeemAmount: "0", redeemDate: "" }],
      }));
      setAddFormOpen(false);
      await onSaved?.();
    }
  };

  const updateProfitEntry = (index, field, value) => {
    setForm((current) => ({
      ...current,
      profitLedger: current.profitLedger.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }));
  };
  const updateReedemEntry = (index, field, value) => {
    setForm((current) => ({
      ...current,
      reedemLedger: current.reedemLedger.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }));
  };

  const saveLedger = async (userSchemeId) => {
    const saved = await updateUserSchemeLedger(userSchemeId, ledgerEdits[userSchemeId] ?? {});
    if (saved) await onSaved?.();
  };

  const addExistingProfitRow = (userSchemeId) => {
    setLedgerEdits((current) => ({
      ...current,
      [userSchemeId]: { ...current[userSchemeId], profitLedger: [...(current[userSchemeId]?.profitLedger ?? []), { profitAmount: "0", profitDate: "" }] },
    }));
  };
  const addExistingReedemRow = (userSchemeId) => {
    setLedgerEdits((current) => ({
      ...current,
      [userSchemeId]: { ...current[userSchemeId], reedemLedger: [...(current[userSchemeId]?.reedemLedger ?? []), { redeemAmount: "0", redeemDate: "" }] },
    }));
  };

  const updateExistingProfit = (userSchemeId, index, field, value) => {
    setLedgerEdits((current) => ({
      ...current,
      [userSchemeId]: { ...current[userSchemeId], profitLedger: (current[userSchemeId]?.profitLedger ?? []).map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ) },
    }));
  };
  const updateExistingReedem = (userSchemeId, index, field, value) => {
    setLedgerEdits((current) => ({
      ...current,
      [userSchemeId]: { ...current[userSchemeId], reedemLedger: (current[userSchemeId]?.reedemLedger ?? []).map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ) },
    }));
  };

  const updateBondForm = (userSchemeId, field, value) => {
    setBondForms((current) => ({
      ...current,
      [userSchemeId]: { ...current[userSchemeId], [field]: value },
    }));
  };

  const updateBond = async (bond) => {
    const details = bondForms[bond.userSchemeId] ?? {};
    if (!details.bondNumber && !details.image) return;
    const payload = new FormData();
    if (details.bondNumber) payload.append("bondNumber", details.bondNumber);
    if (details.image) payload.append("image", details.image);
    const saved = await addBond(bond.userSchemeId, payload,true);
    if (saved) await onSaved?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex h-full w-full flex-col bg-[#111827] shadow-2xl shadow-black/50 sm:w-110 animate-[slideIn_.25s_ease-out]">
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 font-[Space_Grotesk] text-sm font-semibold text-slate-950">
              {initials(user.name)}
            </div>
            <div>
              <h2 className="font-[Space_Grotesk] text-lg font-semibold text-slate-100">
                {user.name}
              </h2>
              <p className="text-[10px] text-slate-500">{user.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-white/5 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            aria-label="Close panel"
          >
            <X className="h-5 w-5 transition-transform duration-300 hover:rotate-90 hover:cursor-pointer hover:text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Contact + status */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
              <Calendar className="h-3.5 w-3.5" /> Joined {user.joined}
            </span>
            <StatusPill status={user.status} />
          </div>

          <div className="mb-6 space-y-2 rounded-xl border border-slate-800 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <HandCoins className="h-4 w-4 text-slate-500" />
              <span className="font-medium">
                Total invested: <span className="text-slate-100">{currency(totalPrincipal)}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Mail className="h-4 w-4 text-slate-500" /> {user.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Phone className="h-4 w-4 text-slate-500" />
              <span className="font-semibold text-slate-100">+91</span> {user.phone}
            </div>
          </div>

          {/* Add scheme manually — collapsed by default to keep the drawer scannable */}
          <div className="mb-7 overflow-hidden rounded-xl border border-teal-900/70 bg-teal-950/20">
            <button
              type="button"
              onClick={() => setAddFormOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left"
            >
              <span className="font-[Space_Grotesk] text-sm font-semibold text-teal-300">
                Add scheme manually
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
              <form onSubmit={saveScheme} className="space-y-3 border-t border-teal-900/70 px-4 py-4">
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

                {selectedScheme && (
                  <p className="rounded-md bg-slate-900/70 p-2 text-xs leading-5 text-slate-400">
                    {selectedScheme.schemeDetails}
                  </p>
                )}

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
                      {nominees.length ? "Select a nominee" : "No nominees found for this user"}
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
                  onClick={() => setNomineeFormOpen((current) => !current)}
                  className="text-xs font-medium text-teal-300 hover:text-teal-200"
                >
                  {nomineeFormOpen ? "Cancel new nominee" : "+ Add nominee to user account"}
                </button>
                {nomineeFormOpen && (
                  <div className="space-y-2 rounded-md border border-slate-800 bg-slate-950/40 p-3">
                    <input name="name" value={nomineeForm.name} onChange={updateNomineeForm} placeholder="Nominee name" required className={inputClass} />
                    <input name="relation" value={nomineeForm.relation} onChange={updateNomineeForm} placeholder="Relation" required className={inputClass} />
                    <input name="aadhaarNo" value={nomineeForm.aadhaarNo} onChange={updateNomineeForm} placeholder="Aadhaar number" inputMode="numeric" required className={inputClass} />
                    <input name="phone" value={nomineeForm.phone} onChange={updateNomineeForm} placeholder="Mobile number" inputMode="tel" required className={inputClass} />
                    <button type="button" onClick={saveNominee} disabled={nomineeSaving} className="w-full rounded-md bg-teal-400 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">
                      {nomineeSaving ? "Saving nominee..." : "Save nominee"}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-slate-400">
                    Paid amount
                    <input
                      name="paidAmount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.paidAmount}
                      onChange={updateForm}
                      required
                      className={`mt-1 ${inputClass}`}
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    Paid date
                    <input
                      name="paidDate"
                      type="date"
                      value={form.paidDate}
                      onChange={updateForm}
                      required
                      className={`mt-1 ${inputClass}`}
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Profit and redemption entries</span>
                  </div>
                  {form.profitLedger.map((entry, index) => (
                    <div key={index} className="grid grid-cols-2 gap-2 rounded-md border border-slate-800 p-2">
                      <input
                        aria-label="Profit amount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Profit amount"
                        value={entry.profitAmount}
                        onChange={(e) => updateProfitEntry(index, "profitAmount", e.target.value)}
                        required
                        className={inputClass}
                      />
                      <input
                        aria-label="Profit date"
                        type="date"
                        value={entry.profitDate}
                        onChange={(e) => updateProfitEntry(index, "profitDate", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm((current) => ({ ...current, profitLedger: [...current.profitLedger, { profitAmount: "", profitDate: "" }] }))} className="font-medium text-teal-300 hover:text-teal-200">+ Add profit row</button>
                  <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-amber-300">Redeem history</p>
                  {form.reedemLedger.map((entry, index) => (
                    <div key={index} className="grid grid-cols-2 gap-2 rounded-md border border-slate-800 p-2">
                      <input aria-label="Redeem amount" type="number" min="0" step="0.01" placeholder="Redeem amount" value={entry.redeemAmount} onChange={(e) => updateReedemEntry(index, "redeemAmount", e.target.value)} required className={inputClass} />
                      <input aria-label="Redeem date" type="date" value={entry.redeemDate} onChange={(e) => updateReedemEntry(index, "redeemDate", e.target.value)} className={inputClass} />
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm((current) => ({ ...current, reedemLedger: [...current.reedemLedger, { redeemAmount: "0", redeemDate: "" }] }))} className="font-medium text-teal-300 hover:text-teal-200">+ Add redeem row</button>
                </div>

                <button
                  type="submit"
                  disabled={saving || !schemes.length}
                  className="w-full rounded-lg bg-teal-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Add scheme to account"}
                </button>
              </form>
            )}
          </div>

          {/* Enrolled schemes */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-[Space_Grotesk] text-sm font-semibold uppercase tracking-wide text-slate-500">
              Joined schemes
            </h3>
            {sortedBonds.length > 0 && (
              <span className="text-xs text-slate-500">{sortedBonds.length} total</span>
            )}
          </div>

          {sortedBonds.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
              No bonds issued yet.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedBonds.map((bond) => (
                <BondCard
                  key={bond.userSchemeId}
                  bond={bond}
                  user={user}
                  profitRows={ledgerEdits[bond.userSchemeId]?.profitLedger ?? []}
                  reedemRows={ledgerEdits[bond.userSchemeId]?.reedemLedger ?? []}
                  bondFormState={bondForms[bond.userSchemeId] ?? {}}
                  onProfitFieldChange={(index, field, value) =>
                    updateExistingProfit(bond.userSchemeId, index, field, value)
                  }
                  onReedemFieldChange={(index, field, value) =>
                    updateExistingReedem(bond.userSchemeId, index, field, value)
                  }
                  onAddProfitRow={() => addExistingProfitRow(bond.userSchemeId)}
                  onAddReedemRow={() => addExistingReedemRow(bond.userSchemeId)}
                  onSaveLedgers={() => saveLedger(bond.userSchemeId)}
                  onBondFormChange={(field, value) =>
                    updateBondForm(bond.userSchemeId, field, value)
                  }
                  onSaveBond={() => updateBond(bond)}
                  onViewBond={setViewingBond}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 px-6 py-4">
          <button className="w-full rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-teal-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827]">
            Manage user
          </button>
        </div>
      </div>

      <CertificateLightbox
        bond={viewingBond}
        userName={user.name}
        scheme={user.scheme}
        onClose={() => setViewingBond(null)}
      />
    </div>
  );
}