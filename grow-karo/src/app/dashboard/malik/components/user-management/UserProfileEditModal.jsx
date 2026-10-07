import { useState } from "react";
import { X } from "lucide-react";
import { errorMessage } from "@/components/Message";
import { toDateInputValue } from "./format";

const inputClass =
  "w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 [color-scheme:dark]";

function profileToForm(profile, user) {
  return {
    name: profile?.name ?? user?.name ?? "",
    email: profile?.email ?? user?.email ?? "",
    phone: profile?.phone ?? user?.phone ?? "",
    dob: toDateInputValue(profile?.dob),
    maritalStatus: profile?.maritalStatus ?? "",
    aadharNo: profile?.aadhaarNo ?? "",
    address: profile?.address ?? "",
    guardianName: profile?.gaurdianName ?? profile?.guardianName ?? "",
    guardianRelation: profile?.guardianRelation ?? "",
    bankName: profile?.bankName ?? "",
    accountNumber: profile?.accountNo ?? profile?.accountNumber ?? "",
    ifscCode: profile?.ifsc ?? profile?.ifscCode ?? "",
    accountHolderName: profile?.accountHolderName ?? "",
    active: user?.isActive ?? user?.active ?? user?.status !== "Inactive",
  };
}

export default function UserProfileEditModal({
  user,
  profile,
  nominees = [],
  saving,
  onClose,
  onSave,
  onSaveNominee,
}) {
  const [form, setForm] = useState(() => profileToForm(profile, user));
  const [nomineeForms, setNomineeForms] = useState(() =>
    Object.fromEntries(
      nominees.map((nominee) => [
        nominee.nomineeId,
        {
          name: nominee.name ?? "",
          relation: nominee.relation ?? "",
          aadhaarNo: nominee.aadharNo ?? nominee.aadhaarNo ?? "",
          phone: nominee.mobileNo ?? nominee.phone ?? "",
        },
      ]),
    ),
  );
  const [savingNomineeId, setSavingNomineeId] = useState(null);

  const updateField = ({ target: { name, value, type, checked } }) =>
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

  const updateNomineeField = (nomineeId, event) => {
    const { name, value } = event.target;
    setNomineeForms((current) => ({
      ...current,
      [nomineeId]: { ...current[nomineeId], [name]: value },
    }));
  };

  const saveNominee = async (nomineeId) => {
    const nominee = nomineeForms[nomineeId];
    if (
      !nominee.name.trim() ||
      !nominee.relation.trim() ||
      !/^\d{12}$/.test(nominee.aadhaarNo) ||
      !/^\d{10}$/.test(nominee.phone)
    ) {
      errorMessage("Enter nominee name, relation, 12-digit Aadhaar, and 10-digit phone.");
      return;
    }

    setSavingNomineeId(nomineeId);
    try {
      await onSaveNominee(nomineeId, nominee);
    } catch (error) {
      errorMessage(error?.message || "Failed to update nominee.");
    } finally {
      setSavingNomineeId(null);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const bankFields = [
      form.bankName.trim(),
      form.accountNumber.trim(),
      form.ifscCode.trim(),
      form.accountHolderName.trim(),
    ];
    if (bankFields.some(Boolean) && bankFields.some((value) => !value)) {
      errorMessage("Fill in all bank fields or clear them all.");
      return;
    }
    if (form.aadharNo && !/^\d{12}$/.test(form.aadharNo)) {
      errorMessage("Aadhaar number must contain 12 digits.");
      return;
    }
    if (form.ifscCode && !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(form.ifscCode)) {
      errorMessage("Enter a valid 11-character IFSC code.");
      return;
    }

    await onSave({
      name: form.name.trim(),
      phone: form.phone.trim(),
      dob: form.dob || null,
      maritalStatus: form.maritalStatus,
      aadharNo: form.aadharNo.trim(),
      address: form.address.trim(),
      guardianName: form.guardianName.trim(),
      guardianRelation: form.guardianRelation.trim(),
      bankName: form.bankName.trim(),
      accountNumber: form.accountNumber.trim(),
      ifscCode: form.ifscCode.trim().toUpperCase(),
      accountHolderName: form.accountHolderName.trim(),
      active: form.active,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#111827] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 id="edit-user-title" className="text-lg font-semibold text-slate-100">
              Edit user details
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Update personal, guardian, and bank information.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close edit user form"
            className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid gap-4 overflow-y-auto p-5 sm:grid-cols-2">
            <label className="text-xs text-slate-400">
              Full name
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                required
                maxLength={100}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="text-xs text-slate-400">
              Email (cannot be changed)
              <input
                value={form.email}
                readOnly
                className={`mt-1 cursor-not-allowed opacity-60 ${inputClass}`}
              />
            </label>
            <label className="text-xs text-slate-400">
              Phone
              <input
                name="phone"
                value={form.phone}
                onChange={updateField}
                required
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                title="Enter a 10-digit phone number"
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="text-xs text-slate-400">
              Date of birth
              <input
                name="dob"
                type="date"
                value={form.dob}
                onChange={updateField}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="text-xs text-slate-400">
              Marital status
              <select
                name="maritalStatus"
                value={form.maritalStatus}
                onChange={updateField}
                className={`mt-1 ${inputClass}`}
              >
                <option value="">Not specified</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </label>
            <label className="text-xs text-slate-400">
              Aadhaar number
              <input
                name="aadharNo"
                value={form.aadharNo}
                onChange={updateField}
                inputMode="numeric"
                maxLength={12}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="text-xs text-slate-400 sm:col-span-2">
              Address
              <textarea
                name="address"
                value={form.address}
                onChange={updateField}
                rows={2}
                maxLength={200}
                className={`mt-1 ${inputClass}`}
              />
            </label>

            <h3 className="border-b border-slate-800 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-300 sm:col-span-2">
              Guardian
            </h3>
            <label className="text-xs text-slate-400">
              Guardian name
              <input
                name="guardianName"
                value={form.guardianName}
                onChange={updateField}
                maxLength={100}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="text-xs text-slate-400">
              Relation
              <input
                name="guardianRelation"
                value={form.guardianRelation}
                onChange={updateField}
                maxLength={30}
                className={`mt-1 ${inputClass}`}
              />
            </label>

            <h3 className="border-b border-slate-800 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-300 sm:col-span-2">
              Bank details
            </h3>
            <label className="text-xs text-slate-400">
              Bank name
              <input
                name="bankName"
                value={form.bankName}
                onChange={updateField}
                maxLength={60}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="text-xs text-slate-400">
              Account holder
              <input
                name="accountHolderName"
                value={form.accountHolderName}
                onChange={updateField}
                maxLength={50}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="text-xs text-slate-400">
              Account number
              <input
                name="accountNumber"
                value={form.accountNumber}
                onChange={updateField}
                inputMode="numeric"
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="text-xs text-slate-400">
              IFSC
              <input
                name="ifscCode"
                value={form.ifscCode}
                onChange={updateField}
                maxLength={11}
                className={`mt-1 uppercase ${inputClass}`}
              />
            </label>

            <h3 className="border-b border-slate-800 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-300 sm:col-span-2">
              Nominees
            </h3>
            {!nominees.length && (
              <p className="text-xs text-slate-500 sm:col-span-2">
                No nominees are registered for this account.
              </p>
            )}
            {nominees.map((nominee) => (
              <div
                key={nominee.nomineeId}
                className="grid gap-3 rounded-lg border border-slate-800 p-3 sm:col-span-2 sm:grid-cols-2"
              >
                <label className="text-xs text-slate-400">
                  Nominee name
                  <input
                    name="name"
                    value={nomineeForms[nominee.nomineeId]?.name ?? ""}
                    onChange={(event) =>
                      updateNomineeField(nominee.nomineeId, event)
                    }
                    required
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Relation
                  <input
                    name="relation"
                    value={nomineeForms[nominee.nomineeId]?.relation ?? ""}
                    onChange={(event) =>
                      updateNomineeField(nominee.nomineeId, event)
                    }
                    required
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Aadhaar
                  <input
                    name="aadhaarNo"
                    value={nomineeForms[nominee.nomineeId]?.aadhaarNo ?? ""}
                    onChange={(event) =>
                      updateNomineeField(nominee.nomineeId, event)
                    }
                    inputMode="numeric"
                    maxLength={12}
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Phone
                  <input
                    name="phone"
                    value={nomineeForms[nominee.nomineeId]?.phone ?? ""}
                    onChange={(event) =>
                      updateNomineeField(nominee.nomineeId, event)
                    }
                    inputMode="numeric"
                    maxLength={10}
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => saveNominee(nominee.nomineeId)}
                  disabled={savingNomineeId === nominee.nomineeId}
                  className="rounded-lg border border-teal-700/70 px-3 py-2 text-xs font-medium text-teal-300 hover:bg-teal-500/10 disabled:opacity-50 sm:col-span-2"
                >
                  {savingNomineeId === nominee.nomineeId
                    ? "Saving nominee..."
                    : "Save nominee"}
                </button>
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-2">
              <input
                name="active"
                type="checkbox"
                checked={form.active}
                onChange={updateField}
                className="h-4 w-4 accent-teal-400"
              />
              Account active
            </label>
          </div>
          <footer className="flex justify-end gap-3 border-t border-slate-800 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save user"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
