import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Mail,
  Phone,
  Calendar,
  HandCoins,
  ChevronDown,
  CalendarClock,
  Percent,
  ArrowUpToLine,
  ArrowDownToLine,
  User,
  Plus,
} from "lucide-react";
import StatusPill from "./StatusPill";
import {
  calculateMaturityDate,
  currency,
  daysToMonths,
  initials,
  toDateInputValue,
} from "./format";
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
  updateUserSchemeDetails,
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

/* ------------------------------------------------------------------ */
/* Ledger config: one description for both profit and redeem ledgers   */
/* ------------------------------------------------------------------ */
const LEDGER = {
  profit: {
    key: "profitLedger",
    amount: "profitAmount",
    date: "profitDate",
    blank: () => ({ profitAmount: "", profitDate: "" }),
    blankExisting: () => ({ profitAmount: "0", profitDate: "" }),
  },
  redeem: {
    key: "reedemLedger",
    amount: "redeemAmount",
    date: "redeemDate",
    blank: () => ({ redeemAmount: "0", redeemDate: "" }),
    blankExisting: () => ({ redeemAmount: "0", redeemDate: "" }),
  },
};

const emptyForm = (schemeId = "") => ({
  schemeId,
  nomineeId: "",
  paidAmount: "",
  paidDate: "",
  maturityDate: "",
  profitLedger: [LEDGER.profit.blank()],
  reedemLedger: [LEDGER.redeem.blank()],
});

const emptyNominee = { name: "", relation: "", aadhaarNo: "", phone: "" };

// Convert ledger rows from the form into the API shape. Rows with no date and
// no amount are dropped; ids are kept so existing rows are updated, not duplicated.
const normalizeLedgerEntries = (entries, type) => {
  const { amount, date } = LEDGER[type];
  return (entries ?? []).reduce((acc, entry) => {
    if (!entry) return acc;
    const rawAmount = entry[amount];
    const rawDate = entry[date];
    const value =
      rawAmount === "" || rawAmount == null ? 0 : Number(rawAmount);
    const hasAmount = Number.isFinite(value) && value > 0;
    if (!rawDate && !hasAmount) return acc;
    acc.push({
      ...(entry.id ? { id: entry.id } : {}),
      [amount]: Number.isFinite(value) ? value : 0,
      [date]: rawDate || null,
    });
    return acc;
  }, []);
};

// Ledger rows -> editable form rows
const toFormLedger = (entries, type) => {
  const { amount, date, blank } = LEDGER[type];
  if (!entries?.length) return [blank()];
  return entries.map((entry) => ({
    id: entry.id,
    [amount]: entry[amount] ?? "0",
    [date]: toDateInputValue(entry[date]),
  }));
};

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */
function SchemeSummary({ scheme }) {
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
        <span className="text-[13px] text-slate-500">Interest</span>
        <span className="text-[15px] font-semibold text-emerald-400">
          {scheme.profitPercentage ?? "0"}%
        </span>
      </div>
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-slate-500" />
        <span className="text-[13px] text-slate-500">Tenure</span>
        <span className="text-[14px] font-medium text-slate-100">
          {daysToMonths(scheme.tenure) ?? "0 days"}
        </span>
      </div>
    </div>
  );
}

function LedgerRows({ type, rows, onChange, onAdd }) {
  const { amount, date } = LEDGER[type];
  const isProfit = type === "profit";
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
            onChange={(e) => onChange(index, amount, e.target.value)}
            className={inputClass}
          />
          <input
            aria-label={isProfit ? "Profit date" : "Redeem date"}
            type="date"
            value={entry[date]}
            onChange={(e) => onChange(index, date, e.target.value)}
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

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
export default function UserDrawer({ user, onClose, onSaved }) {
  const [viewingBond, setViewingBond] = useState(null);
  const [viewUserDetails, setViewUserDetails] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [nominees, setNominees] = useState([]);

  // Shared add / edit form. editingBond === null  -> add mode
  const [form, setForm] = useState(emptyForm);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [editingBond, setEditingBond] = useState(null);
  const [saving, setSaving] = useState(false);

  const [nomineeForm, setNomineeForm] = useState(emptyNominee);
  const [nomineeFormOpen, setNomineeFormOpen] = useState(false);
  const [nomineeSaving, setNomineeSaving] = useState(false);

  // Per-bond state used by BondCard (quick ledger edit + certificate upload)
  const [ledgerEdits, setLedgerEdits] = useState({});
  const [bondForms, setBondForms] = useState({});
  const [savingBond, setSavingBond] = useState(false);

  const formTopRef = useRef(null);

  const currentUserId = user?.userId || user?.id;
  const isEditing = Boolean(editingBond);

  /* ---------------------------- data loading ---------------------------- */
  useEffect(() => {
    let cancelled = false;
    getAllPlans()
      .then((response) => {
        if (cancelled) return;
        const available = response?.data ?? [];
        setSchemes(available);
        setForm((current) => {
          const first = available[0];
          if (current.schemeId || !first?.schemeId) return current;
          return {
            ...current,
            schemeId: first.schemeId,
            maturityDate: calculateMaturityDate(current.paidDate, first.tenure),
          };
        });
      })
      .catch(() => !cancelled && setSchemes([]));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.userId) return;
    let cancelled = false;
    fetchAdminUserNominees(user.userId)
      .then((list) => !cancelled && setNominees(list))
      .catch(() => !cancelled && setNominees([]));
    return () => {
      cancelled = true;
    };
  }, [user?.userId]);

  const getUserFullDetails = useCallback(async (id) => {
    if (!id) return;
    try {
      const details = await getUserProfile(id);
      if (details) setViewUserDetails(details);
    } catch (e) {
      console.error("Error fetching user details", e);
    }
  }, []);

  useEffect(() => {
    getUserFullDetails(currentUserId);
  }, [currentUserId, getUserFullDetails]);

  // Rebuild per-bond ledger edits whenever fresh user data arrives
  useEffect(() => {
    setLedgerEdits(
      Object.fromEntries(
        (user?.enrolledSchemes ?? []).map((bond) => [
          bond.userSchemeId,
          {
            profitLedger: (bond.profitLedger ?? []).map((e) => ({
              id: e.id,
              profitAmount: e.profitAmount ?? "0",
              profitDate: e.profitDate ?? "",
            })),
            reedemLedger: (bond.reedemLedger ?? []).map((e) => ({
              id: e.id,
              redeemAmount: e.redeemAmount ?? "0",
              redeemDate: e.redeemDate ?? "",
            })),
          },
        ]),
      ),
    );
  }, [user]);

  /* ------------------------------ derived ------------------------------ */
  // Bonds without a certificate first, then newest first.
  const sortedBonds = useMemo(
    () =>
      [...(user?.enrolledSchemes ?? [])].sort((a, b) => {
        const aNone = a.bondUrl == null;
        const bNone = b.bondUrl == null;
        if (aNone !== bNone) return aNone ? -1 : 1;
        return b.id - a.id;
      }),
    [user],
  );

  const totalPrincipal = useMemo(
    () =>
      (user?.enrolledSchemes ?? []).reduce(
        (sum, b) => sum + (b.paidAmount ?? 0),
        0,
      ),
    [user],
  );

  const selectedScheme = useMemo(
    () => schemes.find((s) => s.schemeId === form.schemeId),
    [schemes, form.schemeId],
  );

  if (!user) return null;

  /* ------------------------- add / edit form logic ------------------------- */
  const resetForm = () => {
    setForm(emptyForm(schemes[0]?.schemeId ?? ""));
    setEditingBond(null);
    setAddFormOpen(false);
  };

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      const updated = { ...current, [name]: value };
      if (name === "paidDate" || name === "schemeId") {
        const scheme = schemes.find((s) => s.schemeId === updated.schemeId);
        updated.maturityDate = calculateMaturityDate(
          updated.paidDate,
          scheme?.tenure,
        );
      }
      return updated;
    });
  };

  const updateFormLedger = (type) => (index, field, value) =>
    setForm((current) => ({
      ...current,
      [LEDGER[type].key]: current[LEDGER[type].key].map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry,
      ),
    }));

  const addFormLedgerRow = (type) => () =>
    setForm((current) => ({
      ...current,
      [LEDGER[type].key]: [
        ...current[LEDGER[type].key],
        LEDGER[type].blank(),
      ],
    }));

  // Edit button on a bond: load it into the shared form
  const startEditingScheme = (bond) => {
    const matched =
      schemes.find((s) => s.schemeId === bond.schemeId) ??
      schemes.find((s) => s.schemeName === bond.schemeName);

    setEditingBond(bond);
    setForm({
      schemeId: matched?.schemeId ?? "",
      nomineeId: bond.nominee?.nomineeId ?? "",
      paidAmount: String(bond.paidAmount ?? ""),
      paidDate: toDateInputValue(bond.paidDate),
      maturityDate: toDateInputValue(bond.maturityDate),
      profitLedger: toFormLedger(bond.profitLedger, "profit"),
      reedemLedger: toFormLedger(bond.reedemLedger, "redeem"),
    });
    setAddFormOpen(true);
    setTimeout(
      () =>
        formTopRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50,
    );
  };

  const validateForm = () => {
    if (!form.schemeId) return "Please select a scheme first.";
    if (!form.nomineeId)
      return "Please add or select a nominee before saving the scheme.";
    if (!form.paidAmount || Number(form.paidAmount) <= 0)
      return "Paid amount must be greater than zero.";
    if (!form.paidDate) return "Please choose a valid paid date.";
    if (!form.maturityDate) return "Please choose a valid maturity date.";
    return null;
  };

  const saveScheme = async (event) => {
    event.preventDefault();
    const problem = validateForm();
    if (problem) {
      errorMessage(problem);
      return;
    }

    setSaving(true);
    const base = {
      schemeId: form.schemeId,
      nomineeId: form.nomineeId,
      paidAmount: Number(form.paidAmount),
      paidDate: form.paidDate,
      maturityDate: form.maturityDate,
    };
    const ledgers = {
      profitLedger: normalizeLedgerEntries(form.profitLedger, "profit"),
      reedemLedger: normalizeLedgerEntries(form.reedemLedger, "redeem"),
    };

    try {
      let saved;
      if (isEditing) {
        const id = editingBond.userSchemeId;
        saved = await updateUserSchemeDetails(id, base);
        if (saved) saved = await updateUserSchemeLedger(id, ledgers);
      } else {
        saved = await addManualUserScheme({
          userId: user.userId,
          ...base,
          ...ledgers,
        });
      }
      if (saved) {
        resetForm();
        await onSaved?.();
      }
    } catch (error) {
      errorMessage(error?.message || "Failed to save scheme");
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------- nominee ------------------------------- */
  const updateNomineeForm = (event) =>
    setNomineeForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  const saveNominee = async () => {
    const { name, relation, aadhaarNo, phone } = nomineeForm;
    if (!name.trim() || !relation.trim() || !aadhaarNo || !phone) {
      errorMessage("Please fill all nominee details.");
      return;
    }
    setNomineeSaving(true);
    try {
      const nominee = await createAdminUserNominee(user.userId, nomineeForm);
      if (nominee) {
        setNominees((current) => [...current, nominee]);
        setForm((current) => ({ ...current, nomineeId: nominee.nomineeId }));
        setNomineeForm(emptyNominee);
        setNomineeFormOpen(false);
      }
    } finally {
      setNomineeSaving(false);
    }
  };

  /* ---------------- quick ledger edit on existing BondCards ---------------- */
  const updateExistingLedger = (userSchemeId, type, index, field, value) =>
    setLedgerEdits((current) => {
      const key = LEDGER[type].key;
      return {
        ...current,
        [userSchemeId]: {
          ...current[userSchemeId],
          [key]: (current[userSchemeId]?.[key] ?? []).map((entry, i) =>
            i === index ? { ...entry, [field]: value } : entry,
          ),
        },
      };
    });

  const addExistingLedgerRow = (userSchemeId, type) =>
    setLedgerEdits((current) => {
      const key = LEDGER[type].key;
      return {
        ...current,
        [userSchemeId]: {
          ...current[userSchemeId],
          [key]: [
            ...(current[userSchemeId]?.[key] ?? []),
            LEDGER[type].blankExisting(),
          ],
        },
      };
    });

  const saveLedger = async (userSchemeId) => {
    const saved = await updateUserSchemeLedger(
      userSchemeId,
      ledgerEdits[userSchemeId] ?? {},
    );
    if (saved) await onSaved?.();
  };

  /* ------------------------------ bond upload ------------------------------ */
  const updateBondForm = (userSchemeId, field, value) =>
    setBondForms((current) => ({
      ...current,
      [userSchemeId]: { ...current[userSchemeId], [field]: value },
    }));

  const updateBond = async (bond) => {
    const details = bondForms[bond.userSchemeId] ?? {};
    if (!details.bondNumber && !details.image) return;

    setSavingBond(true);
    const payload = new FormData();
    if (details.bondNumber) payload.append("bondNumber", details.bondNumber);
    if (details.image) payload.append("image", details.image);
    try {
      const saved = await addBond(user.userId, bond.userSchemeId, payload, true);
      if (saved) await onSaved?.();
    } catch (error) {
      errorMessage("Failed to save bond details. Please try again.");
      console.error("Failed to save bond details:", error);
    } finally {
      setSavingBond(false);
    }
  };

  const onViewBond = async (bond) => {
    setViewingBond(bond);
    if (!viewUserDetails) await getUserFullDetails(currentUserId);
  };

  /* --------------------------------- render --------------------------------- */
  const showLedgers = selectedScheme?.payoutFrequency !== "tenure-complete";

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

          {/* Add / Edit scheme — one shared form */}
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
              onClick={() => setAddFormOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left"
            >
              <span
                className={`flex items-center font-[Space_Grotesk] text-sm font-semibold ${
                  isEditing ? "text-amber-300" : "text-teal-300"
                }`}
              >
                <Plus className="mr-0.5 h-5 w-5" />
                {isEditing
                  ? `Edit scheme${
                      editingBond.schemeName ? `: ${editingBond.schemeName}` : ""
                    }`
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
                  onClick={() => setNomineeFormOpen((v) => !v)}
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

                {/* Invested amount, paid date, maturity date */}
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
              {sortedBonds.map((bond) => {
                const id = bond.userSchemeId;
                return (
                  <BondCard
                    key={id}
                    bond={bond}
                    user={user}
                    profitRows={ledgerEdits[id]?.profitLedger ?? []}
                    reedemRows={ledgerEdits[id]?.reedemLedger ?? []}
                    bondFormState={bondForms[id] ?? {}}
                    onProfitFieldChange={(index, field, value) =>
                      updateExistingLedger(id, "profit", index, field, value)
                    }
                    onReedemFieldChange={(index, field, value) =>
                      updateExistingLedger(id, "redeem", index, field, value)
                    }
                    onAddProfitRow={() => addExistingLedgerRow(id, "profit")}
                    onAddReedemRow={() => addExistingLedgerRow(id, "redeem")}
                    onSaveLedgers={() => saveLedger(id)}
                    nominees={nominees}
                    onStartEditingScheme={() => startEditingScheme(bond)}
                    onBondFormChange={(field, value) =>
                      updateBondForm(id, field, value)
                    }
                    onSaveBond={() => updateBond(bond)}
                    onViewBond={onViewBond}
                    savingBond={savingBond}
                    setSavingBond={setSavingBond}
                    viewUser={viewUserDetails}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 px-6 py-4">
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-teal-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827]">
            <User className="h-4 w-4" /> Manage Users here
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