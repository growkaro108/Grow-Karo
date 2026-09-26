import React, { useEffect, useMemo, useState } from "react";
import { X, Mail, Phone, Calendar, HandCoins, ChevronDown, CalendarClock, Percent, ArrowUpToLine, ArrowDownToLine } from "lucide-react";
import StatusPill from "./StatusPill";
import { currency, initials } from "./format";
import dynamic from "next/dynamic";
import TabLoader from "@/loader/TabLoader";
import { getAllPlans } from "@/api/generalApi";
import { errorMessage } from "@/components/Message";
import {
  addBond,
  addManualUserScheme,
  createAdminUserNominee,
  fetchAdminUserNominees,
  getUserProfile,
  updateUserSchemeLedger,
} from "../../../../../../services/malikService";

const CertificateLightbox = dynamic(() => import("../Certificatelightbox"), {
  loading: () => <TabLoader message="Loading certificate..." />,
  ssr: false,
});
const BondCard = dynamic(() => import("./BondCard"), {
  loading: () => <TabLoader message="Loading bond card..." />,
  ssr: false,
});

const inputClass =
  "w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 [color-scheme:dark]";

export default function UserDrawer({ user, onClose, onSaved }) {
  const [viewingBond, setViewingBond] = useState(null);
  const [viewUserDetails, setViewUserDetails] = useState(null);
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
  const [savingBond, setSavingBond] = useState(false)
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
    fetchAdminUserNominees(user.userId)
      .then(setNominees)
      .catch(() => setNominees([]));
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

  const currentUserId = user?.userId || user?.id;

  useEffect(() => {
    if (!currentUserId) return;
    getUserFullDetails(currentUserId);
  }, [currentUserId]);
  // Bonds without a certificate image first, then newest first.
  const sortedBonds = useMemo(() => {
    return [...(user?.enrolledSchemes ?? [])].sort((a, b) => {
      if (a.bondUrl === null && b.bondUrl !== null) return -1;
      if (a.bondUrl !== null && b.bondUrl === null) return 1;
      return b.id - a.id;
    });
  }, [user]);

  const totalPrincipal = useMemo(
    () =>
      (user?.enrolledSchemes ?? []).reduce(
        (sum, b) => sum + (b.paidAmount ?? 0),
        0,
      ),
    [user],
  );

  if (!user) return null;

  const selectedScheme = schemes.find(
    (scheme) => scheme.schemeId === form.schemeId,
  );
  const updateNomineeForm = (event) =>
    setNomineeForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

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
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  const normalizeLedgerEntries = (entries = [], type = "profit") => {
    return (entries ?? []).reduce((acc, entry) => {
      if (!entry) return acc;
      const rawAmount =
        type === "profit" ? entry.profitAmount : entry.redeemAmount;
      const rawDate = type === "profit" ? entry.profitDate : entry.redeemDate;
      const cleanedValue =
        rawAmount === "" || rawAmount === null || rawAmount === undefined
          ? 0
          : Number(rawAmount);

      if (
        (rawDate && !Number.isNaN(cleanedValue) && cleanedValue >= 0) ||
        (rawAmount !== "" && rawAmount !== null && rawAmount !== undefined)
      ) {
        acc.push(
          type === "profit"
            ? {
              profitAmount: Number.isFinite(cleanedValue) ? cleanedValue : 0,
              profitDate: rawDate || null,
            }
            : {
              redeemAmount: Number.isFinite(cleanedValue) ? cleanedValue : 0,
              redeemDate: rawDate || null,
            },
        );
      }
      return acc;
    }, []);
  };

  const saveScheme = async (event) => {
    event.preventDefault();

    if (!form.schemeId) {
      errorMessage("Please select a scheme first.");
      return;
    }
    if (!form.nomineeId) {
      errorMessage("Please add or select a nominee before adding a scheme.");
      return;
    }
    if (!form.paidAmount || Number(form.paidAmount) <= 0) {
      errorMessage("Paid amount must be greater than zero.");
      return;
    }
    if (!form.paidDate) {
      errorMessage("Please choose a valid paid date.");
      return;
    }

    setSaving(true);
    const payload = {
      userId: user.userId,
      schemeId: form.schemeId,
      nomineeId: form.nomineeId,
      paidAmount: Number(form.paidAmount),
      paidDate: form.paidDate,
      profitLedger: normalizeLedgerEntries(form.profitLedger, "profit"),
      reedemLedger: normalizeLedgerEntries(form.reedemLedger, "redeem"),
    };

    const saved = await addManualUserScheme(payload);
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
    const saved = await updateUserSchemeLedger(
      userSchemeId,
      ledgerEdits[userSchemeId] ?? {},
    );
    if (saved) await onSaved?.();
  };

  const addExistingProfitRow = (userSchemeId) => {
    setLedgerEdits((current) => ({
      ...current,
      [userSchemeId]: {
        ...current[userSchemeId],
        profitLedger: [
          ...(current[userSchemeId]?.profitLedger ?? []),
          { profitAmount: "0", profitDate: "" },
        ],
      },
    }));
  };
  const addExistingReedemRow = (userSchemeId) => {
    setLedgerEdits((current) => ({
      ...current,
      [userSchemeId]: {
        ...current[userSchemeId],
        reedemLedger: [
          ...(current[userSchemeId]?.reedemLedger ?? []),
          { redeemAmount: "0", redeemDate: "" },
        ],
      },
    }));
  };

  const updateExistingProfit = (userSchemeId, index, field, value) => {
    setLedgerEdits((current) => ({
      ...current,
      [userSchemeId]: {
        ...current[userSchemeId],
        profitLedger: (current[userSchemeId]?.profitLedger ?? []).map(
          (entry, entryIndex) =>
            entryIndex === index ? { ...entry, [field]: value } : entry,
        ),
      },
    }));
  };
  const updateExistingReedem = (userSchemeId, index, field, value) => {
    setLedgerEdits((current) => ({
      ...current,
      [userSchemeId]: {
        ...current[userSchemeId],
        reedemLedger: (current[userSchemeId]?.reedemLedger ?? []).map(
          (entry, entryIndex) =>
            entryIndex === index ? { ...entry, [field]: value } : entry,
        ),
      },
    }));
  };

  const updateBondForm = (userSchemeId, field, value) => {
    setBondForms((current) => ({
      ...current,
      [userSchemeId]: { ...current[userSchemeId], [field]: value },
    }));
  };

  const updateBond = async (bond) => {
    setSavingBond(true)
    const details = bondForms[bond.userSchemeId] ?? {};
    if (!details.bondNumber && !details.image) return;
    const payload = new FormData();
    if (details.bondNumber) payload.append("bondNumber", details.bondNumber);
    if (details.image) payload.append("image", details.image);
    const saved = await addBond(user.userId, bond.userSchemeId, payload, true);
    if (saved) await onSaved?.();
    setSavingBond(false)
  };


  const getUserFullDetails = async (id) => {
    if (!id) return;
    try {
      const userDetails = await getUserProfile(id);
      if (userDetails) {
        setViewUserDetails(userDetails);
      }
    } catch (e) {
      console.error("Error fetching user details", e);
    }
  };

  const onViewBond = async (bond) => {
    setViewingBond(bond);
    if (!viewUserDetails && currentUserId) {
      await getUserFullDetails(currentUserId);
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
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

          <div className="mb-6 space-y-2 rounded-xl border border-slate-800 bg-white/2 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <HandCoins className="h-4 w-4 text-slate-500" />
              <span className="font-medium">
                Total invested:{" "}
                <span className="text-slate-100">
                  {currency(totalPrincipal)}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Mail className="h-4 w-4 text-slate-500" /> {user.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Phone className="h-4 w-4 text-slate-500" />
              <span className="font-semibold text-slate-100">+91</span>{" "}
              {user.phone}
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
                  className={`h-3.5 w-3.5 text-teal-300 transition-transform ${addFormOpen ? "rotate-180" : ""
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

                {selectedScheme && (
                  // <p className="rounded-md bg-slate-900/70 p-2 text-xs leading-5 text-slate-400">
                  //   {selectedScheme.schemeDetails}
                  // </p> 
                  //show four thing 1)scheme min amount 2)scheme max amount 3) scheme interest rate 4) tenure

                  <div className="grid grid-cols-2 items-center gap-x-6 gap-y-3 rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <ArrowDownToLine className="h-4 w-4 text-slate-500" />
                      <span className="text-[13px] text-slate-500">Min</span>
                      <span className="text-[15px] font-medium text-slate-100">
                        {currency(selectedScheme.minimumAmount) ?? "0"}
                      </span>
                    </div>


                    <div className="flex items-center gap-2">
                      <ArrowUpToLine className="h-4 w-4 text-slate-500" />
                      <span className="text-[13px] text-slate-500">Max</span>
                      <span className="text-[15px] font-medium text-slate-100">
                        {currency(selectedScheme.maximumAmount) ?? "0"}
                      </span>
                    </div>


                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-emerald-500" />
                      <span className="text-[13px] text-slate-500">Interest</span>
                      <span className="text-[15px] font-semibold text-emerald-400">
                        {selectedScheme.profitPercentage ?? "0"}%
                      </span>
                    </div>


                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-slate-500" />
                      <span className="text-[13px] text-slate-500">Tenure</span>
                      <span className="text-[14px] font-medium text-slate-100">
                        {selectedScheme.tenure ?? "0"} days
                      </span>
                    </div>
                  </div>
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
                  onClick={() => setNomineeFormOpen((current) => !current)}
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
                      required
                      className={inputClass}
                    />
                    <input
                      name="relation"
                      value={nomineeForm.relation}
                      onChange={updateNomineeForm}
                      placeholder="Relation"
                      required
                      className={inputClass}
                    />
                    <input
                      name="aadhaarNo"
                      value={nomineeForm.aadhaarNo}
                      onChange={updateNomineeForm}
                      placeholder="Aadhaar number"
                      type="text"
                      maxlength="12"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      required
                      className={inputClass}
                    />
                    <input
                      name="phone"
                      value={nomineeForm.phone}
                      onChange={updateNomineeForm}
                      type="text"
                      maxlength="10"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      placeholder="Phone Number"
                      required
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

                {selectedScheme?.payoutFrequency !== "tenure-complete" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Profit and redemption entries</span>
                    </div>
                    {form.profitLedger.map((entry, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-2 gap-2 rounded-md border border-slate-800 p-2"
                      >
                        <input
                          aria-label="Profit amount"
                          type="number"
                          min="100"
                          step="100"
                          placeholder="Profit amount"
                          value={entry.profitAmount}
                          onChange={(e) =>
                            updateProfitEntry(
                              index,
                              "profitAmount",
                              e.target.value,
                            )
                          }
                          className={inputClass}
                        />
                        <input
                          aria-label="Profit date"
                          type="date"
                          value={entry.profitDate}
                          onChange={(e) =>
                            updateProfitEntry(
                              index,
                              "profitDate",
                              e.target.value,
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          profitLedger: [
                            ...current.profitLedger,
                            { profitAmount: "", profitDate: "" },
                          ],
                        }))
                      }
                      className="font-medium text-teal-300 hover:text-teal-200"
                    >
                      + Add profit row
                    </button>
                    <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                      Redeem history
                    </p>
                    {form.reedemLedger.map((entry, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-2 gap-2 rounded-md border border-slate-800 p-2"
                      >
                        <input
                          aria-label="Redeem amount"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Redeem amount"
                          value={entry.redeemAmount}
                          onChange={(e) =>
                            updateReedemEntry(
                              index,
                              "redeemAmount",
                              e.target.value,
                            )
                          }
                          required
                          className={inputClass}
                        />
                        <input
                          aria-label="Redeem date"
                          type="date"
                          value={entry.redeemDate}
                          onChange={(e) =>
                            updateReedemEntry(
                              index,
                              "redeemDate",
                              e.target.value,
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          reedemLedger: [
                            ...current.reedemLedger,
                            { redeemAmount: "0", redeemDate: "" },
                          ],
                        }))
                      }
                      className="font-medium text-teal-300 hover:text-teal-200"
                    >
                      + Add redeem row
                    </button>
                  </div>
                )}

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
              <span className="text-xs text-slate-500">
                {sortedBonds.length} total
              </span>
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
                  profitRows={
                    ledgerEdits[bond.userSchemeId]?.profitLedger ?? []
                  }
                  reedemRows={
                    ledgerEdits[bond.userSchemeId]?.reedemLedger ?? []
                  }
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
                  onViewBond={onViewBond}
                  savingBond={savingBond}
                  setSavingBond={setSavingBond}
                  viewUser={viewUserDetails}
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
        userName={user?.name}
        userData={viewUserDetails}
        scheme={viewingBond?.schemeName || viewingBond?.scheme || user?.scheme}
        onClose={() => setViewingBond(null)}
      />
    </div>
  );
}
