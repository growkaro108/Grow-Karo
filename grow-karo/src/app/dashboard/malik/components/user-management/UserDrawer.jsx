import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Mail,
  Phone,
  Calendar,
  HandCoins,
  User,
  Pencil,
} from "lucide-react";
import StatusPill from "./StatusPill";
import SchemeManagementPanel from "./SchemeManagementPanel";
// import EnrolledSchemes from "./EnrolledSchemes";
import AddUser from "./AddUser";
import {
  calculateMaturityDate,
  currency,
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
  deleteAdminUserNominee,
  fetchAdminUserNominees,
  getUserProfile,
  updateAdminUserNominee,
  updateUserSchemeDetails,
  updateUserSchemeLedger,
  updateAdminUserProfile,
} from "../../../../../../services/malikService";

const CertificateLightbox = dynamic(() => import("../Certificatelightbox"), {
  loading: () => <TabLoader message="Loading certificate..." />,
  ssr: false,
});
const EnrolledSchemes = dynamic(() => import("./EnrolledSchemes"), {
  loading: () => <TabLoader message="Loading enrolled schemes..." />,
  ssr: false,
});
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
const MAX_BOND_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const TARGET_BOND_IMAGE_SIZE_BYTES = 1.5 * 1024 * 1024;
const MAX_SOURCE_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;

async function prepareBondUpload(file) {
  if (
    file.type === "application/pdf" ||
    /\.pdf$/i.test(file.name) ||
    file.size <= TARGET_BOND_IMAGE_SIZE_BYTES
  ) {
    return file;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only JPG, PNG, WEBP, or PDF files are allowed.");
  }

  let bitmap;
  let imageUrl;
  try {
    if (typeof createImageBitmap === "function") {
      bitmap = await createImageBitmap(file);
    } else {
      imageUrl = URL.createObjectURL(file);
      bitmap = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () =>
          reject(new Error("Could not read the selected image."));
        image.src = imageUrl;
      });
    }

    const maxDimension = 2200;
    let width = bitmap.width;
    let height = bitmap.height;
    const initialScale = Math.min(1, maxDimension / Math.max(width, height));
    width = Math.round(width * initialScale);
    height = Math.round(height * initialScale);

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare the selected image.");

    const qualityLevels = [0.86, 0.78, 0.7, 0.62, 0.54];
    while (true) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of qualityLevels) {
        const compressed = await new Promise((resolve, reject) => {
          canvas.toBlob(
            (blob) =>
              blob
                ? resolve(blob)
                : reject(new Error("Could not compress the selected image.")),
            "image/jpeg",
            quality,
          );
        });
        if (
          compressed.size <= TARGET_BOND_IMAGE_SIZE_BYTES &&
          compressed.size < file.size
        ) {
          const name = file.name.replace(/\.[^.]+$/, "") || "bond";
          return new File([compressed], `${name}.jpg`, {
            type: "image/jpeg",
            lastModified: file.lastModified,
          });
        }
      }

      const longestSide = Math.max(width, height);
      if (longestSide <= 1100) {
        if (file.size <= MAX_BOND_FILE_SIZE_BYTES) return file;
        throw new Error(
          "This image cannot be reduced to 2 MB while keeping it readable. Please choose a smaller image.",
        );
      }
      const scale = Math.max(1100 / longestSide, 0.85);
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }
  } finally {
    bitmap?.close?.();
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }
}

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
/* Main component                                                      */
/* ------------------------------------------------------------------ */
export default function UserDrawer({ user, onClose, onSaved }) {
  const [viewingBond, setViewingBond] = useState(null);
  const [viewUserDetails, setViewUserDetails] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [nominees, setNominees] = useState([]);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({});

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
      return details;
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
    try {
      if (details.image) {
        payload.append("image", await prepareBondUpload(details.image));
      }
      const saved = await addBond(user.userId, bond.userSchemeId, payload, true);
      if (saved) await onSaved?.();
    } catch (error) {
      errorMessage(error?.message || "Failed to save bond details. Please try again.");
      console.error("Failed to save bond details:", error);
    } finally {
      setSavingBond(false);
    }
  };

  const onViewBond = async (bond) => {
    setViewingBond(bond);
    if (!viewUserDetails) await getUserFullDetails(currentUserId);
  };

  const updateProfileForm = (event) => {
    const { name, value, type, checked } = event.target;
    setProfileForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveUserProfile = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    try {
      const updated = await updateAdminUserProfile(currentUserId, {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        dob: profileForm.dob || null,
        maritalStatus: profileForm.maritalStatus || "",
        aadharNo: profileForm.aadharNo.trim(),
        address: profileForm.address.trim(),
        guardianName: profileForm["guardian.name"].trim(),
        guardianRelation: profileForm["guardian.relation"].trim(),
        bankName: profileForm.bankName.trim(),
        accountNumber: profileForm.accountNumber.trim(),
        ifscCode: profileForm.ifscCode.trim().toUpperCase(),
        accountHolderName: profileForm.accountHolderName.trim(),
        active: profileForm.active,
      });
      if (!updated) return;
      setViewUserDetails(updated);
      setProfileEditOpen(false);
      await onSaved?.();
    } catch (error) {
      errorMessage(error?.message || "Failed to update user details.");
    } finally {
      setProfileSaving(false);
    }
  };

  const openProfileEditor = async () => {
    try {
      const [details, userNominees] = await Promise.all([
        viewUserDetails ?? getUserFullDetails(currentUserId),
        fetchAdminUserNominees(currentUserId),
      ]);
      if (details) setViewUserDetails(details);
      setNominees(Array.isArray(userNominees) ? userNominees : []);
      setProfileForm({
        name: details?.name ?? user?.name ?? "",
        email: details?.email ?? user?.email ?? "",
        phone: details?.phone ?? user?.phone ?? "",
        dob: toDateInputValue(details?.dob),
        maritalStatus: details?.maritalStatus ?? "",
        aadharNo: details?.aadhaarNo ?? details?.aadharNo ?? "",
        address: details?.address ?? "",
        "guardian.name": details?.gaurdianName ?? details?.guardianName ?? "",
        "guardian.relation": details?.guardianRelation ?? "",
        bankName: details?.bankName ?? "",
        accountNumber: details?.accountNo ?? details?.accountNumber ?? "",
        ifscCode: details?.ifsc ?? details?.ifscCode ?? "",
        accountHolderName: details?.accountHolderName ?? "",
        active: user?.isActive ?? user?.active ?? user?.status !== "Inactive",
      });
      setProfileEditOpen(true);
    } catch (error) {
      errorMessage(error?.message || "Failed to load user details.");
    }
  };

  const saveUserNominee = async (nomineeId, nominee) => {
    try {
      const updated = await updateAdminUserNominee(currentUserId, nomineeId, {
        name: nominee.name.trim(),
        relation: nominee.relation.trim(),
        aadhaarNo: nominee.aadhaarNo.trim(),
        phone: nominee.phone.trim(),
      });
      if (!updated) return;
      setNominees((current) =>
        current.map((item) =>
          item.nomineeId === nomineeId ? { ...item, ...updated } : item,
        ),
      );
    } catch (error) {
      errorMessage(error?.message || "Failed to update nominee.");
    }
  };

  const removeUserNominee = async (nomineeId) => {
    try {
      const deleted = await deleteAdminUserNominee(currentUserId, nomineeId);
      if (deleted) {
        setNominees((current) =>
          current.filter((item) => item.nomineeId !== nomineeId),
        );
        setForm((current) =>
          current.nomineeId === nomineeId
            ? { ...current, nomineeId: "" }
            : current,
        );
      }
    } catch (error) {
      errorMessage(error?.message || "Failed to delete nominee.");
    }
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
            <button
              type="button"
              onClick={openProfileEditor}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-teal-700/70 px-3 py-2 text-sm font-medium text-teal-300 transition hover:bg-teal-500/10"
            >
              <Pencil className="h-4 w-4" />
              Edit user details
            </button>
          </div>

          <SchemeManagementPanel
            formTopRef={formTopRef}
            isEditing={isEditing}
            editingBond={editingBond}
            form={form}
            addFormOpen={addFormOpen}
            setAddFormOpen={setAddFormOpen}
            updateForm={updateForm}
            schemes={schemes}
            selectedScheme={selectedScheme}
            nominees={nominees}
            nomineeFormOpen={nomineeFormOpen}
            setNomineeFormOpen={setNomineeFormOpen}
            nomineeForm={nomineeForm}
            updateNomineeForm={updateNomineeForm}
            saveNominee={saveNominee}
            nomineeSaving={nomineeSaving}
            updateFormLedger={updateFormLedger}
            addFormLedgerRow={addFormLedgerRow}
            showLedgers={showLedgers}
            saveScheme={saveScheme}
            saving={saving}
            resetForm={resetForm}
          />

          <EnrolledSchemes
            bonds={sortedBonds}
            user={user}
            ledgerEdits={ledgerEdits}
            bondForms={bondForms}
            nominees={nominees}
            onProfitFieldChange={(id, index, field, value) =>
              updateExistingLedger(id, "profit", index, field, value)
            }
            onRedeemFieldChange={(id, index, field, value) =>
              updateExistingLedger(id, "redeem", index, field, value)
            }
            onAddProfitRow={(id) => addExistingLedgerRow(id, "profit")}
            onAddRedeemRow={(id) => addExistingLedgerRow(id, "redeem")}
            onSaveLedgers={saveLedger}
            onStartEditingScheme={startEditingScheme}
            onBondFormChange={updateBondForm}
            onSaveBond={updateBond}
            onViewBond={onViewBond}
            savingBond={savingBond}
            setSavingBond={setSavingBond}
            viewUser={viewUserDetails}
          />
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
      {profileEditOpen && (
        <AddUser
          isEditing
          newUserForm={profileForm}
          updateNewUserForm={updateProfileForm}
          setShowAddUserModal={setProfileEditOpen}
          handleCreateManualUser={saveUserProfile}
          creatingUser={profileSaving}
          nominees={nominees}
          onSaveNominee={saveUserNominee}
          onDeleteNominee={removeUserNominee}
          active={profileForm.active}
        />
      )}
    </div>
  );
}