import React, { useState } from "react";
import { errorMessage } from "@/components/Message";

export default function AddUser({
    handleCreateManualUser,
    newUserForm,
    updateNewUserForm,
    setShowAddUserModal,
    creatingUser,
    isEditing = false,
    nominees = [],
    onSaveNominee,
    onDeleteNominee,
    active,
}) {
    const [nomineeForms, setNomineeForms] = useState(() =>
        Object.fromEntries(nominees.map((nominee) => [
            nominee.nomineeId,
            {
                name: nominee.name ?? "",
                relation: nominee.relation ?? "",
                aadhaarNo: nominee.aadharNo ?? nominee.aadhaarNo ?? "",
                phone: nominee.mobileNo ?? nominee.phone ?? "",
            },
        ])),
    );
    const [savingNomineeId, setSavingNomineeId] = useState(null);
    const [deletingNomineeId, setDeletingNomineeId] = useState(null);

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
            !nominee?.name.trim() ||
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
        } finally {
            setSavingNomineeId(null);
        }
    };

    const deleteNominee = async (nomineeId) => {
        if (!window.confirm("Delete this nominee? This cannot be undone.")) return;
        setDeletingNomineeId(nomineeId);
        try {
            await onDeleteNominee(nomineeId);
        } finally {
            setDeletingNomineeId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
            <div className={`w-full ${isEditing ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-2xl shadow-black/40`}>
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-teal-300">
                            {isEditing ? "User details" : "Admin action"}
                        </p>
                        <h3 className="mt-1 font-[Space_Grotesk] text-xl font-semibold text-slate-100">
                            {isEditing ? "Edit user details" : "Add manual user"}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowAddUserModal(false)}
                        disabled={creatingUser}
                        className="rounded-full px-2 py-1 text-sm text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleCreateManualUser} className="space-y-5">
                    {/* ---- Core details (required) ---- */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs text-slate-400">
                            Full name
                            <input
                                name="name"
                                value={newUserForm.name ?? ""}
                                onChange={updateNewUserForm}
                                required
                                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                placeholder="John Doe"
                            />
                        </label>
                        <label className="text-xs text-slate-400">
                            Phone
                            <input
                                name="phone"
                                value={newUserForm.phone ?? ""}
                                onChange={updateNewUserForm}
                                required
                                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                placeholder="9876543210"
                            />
                        </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs text-slate-400">
                            Email
                            <input
                                name="email"
                                type="email"
                                value={newUserForm.email ?? ""}
                                readOnly={isEditing}
                                className={`mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none ${isEditing ? "cursor-not-allowed opacity-60" : ""}`}
                                onChange={updateNewUserForm}
                                required={!isEditing}
                                placeholder="user@example.com"
                            />
                        </label>
                        {!isEditing && (
                            <label className="text-xs text-slate-400">
                                Password
                                <input
                                    name="passwordHash"
                                    type="password"
                                    value={newUserForm.passwordHash ?? ""}
                                    onChange={updateNewUserForm}
                                    required
                                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                    placeholder="StrongPass@123"
                                />
                            </label>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs text-slate-400">
                            DOB
                            <input
                                name="dob"
                                type="date"
                                value={newUserForm.dob ?? ""}
                                onChange={updateNewUserForm}
                                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                            />
                        </label>
                        <label className="text-xs text-slate-400">
                            Marital status
                            <select
                                name="maritalStatus"
                                value={newUserForm.maritalStatus ?? ""}
                                onChange={updateNewUserForm}
                                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                            >
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Widowed">Widowed</option>
                                <option value="Divorced">Divorced</option>
                            </select>
                        </label>
                    </div>

                    <label className="block text-xs text-slate-400">
                        Aadhaar number
                        <input
                            name="aadharNo"
                            value={newUserForm.aadharNo ?? ""}
                            onChange={updateNewUserForm}
                            placeholder="123456789012"
                            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                        />
                    </label>

                    {/* ---- Bank details (all optional) ---- */}
                    <div className="border-t border-slate-800 pt-4">
                        <details open={isEditing}>
                            <summary className="cursor-pointer mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                                Add  Bank details
                            </summary>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="text-xs text-slate-400">
                                    Account holder name
                                    <input
                                        name="accountHolderName"
                                        value={newUserForm.accountHolderName ?? ""}
                                        onChange={updateNewUserForm}
                                        placeholder="As per bank records"
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                    />
                                </label>
                                <label className="text-xs text-slate-400">
                                    Bank name
                                    <input
                                        name="bankName"
                                        value={newUserForm.bankName ?? ""}
                                        onChange={updateNewUserForm}
                                        placeholder="Bank of Baroda"
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                    />
                                </label>
                            </div>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <label className="text-xs text-slate-400">
                                    Account number
                                    <input
                                        name="accountNumber"
                                        value={newUserForm.accountNumber ?? ""}
                                        onChange={updateNewUserForm}
                                        placeholder="809990119998510"
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                    />
                                </label>
                                <label className="text-xs text-slate-400">
                                    IFSC code
                                    <input
                                        name="ifscCode"
                                        value={newUserForm.ifscCode ?? ""}
                                        onChange={updateNewUserForm}
                                        placeholder="BKID0005811"
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                    />
                                </label>
                            </div></details>
                    </div>

                    {/* ---- Address (all optional) ---- */}
                    <div className="border-t border-slate-800 pt-4">
                        <details open={isEditing}>
                            <summary className="cursor-pointer mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                                Add  Address
                            </summary>
                            {/* <label className="block text-xs text-slate-400">
                                Street
                                <input
                                    name="address.street"
                                    value={newUserForm["address.street"]}
                                    onChange={updateNewUserForm}
                                    placeholder="Amanda home"
                                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                />
                            </label>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <label className="text-xs text-slate-400">
                                    Village
                                    <input
                                        name="address.village"
                                        value={newUserForm["address.village"]}
                                        onChange={updateNewUserForm}
                                        placeholder="jkilof"
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                    />
                                </label>
                                <label className="text-xs text-slate-400">
                                    City
                                    <input
                                        name="address.city"
                                        value={newUserForm["address.city"]}
                                        onChange={updateNewUserForm}
                                        placeholder="Bhagalpur"
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                    />
                                </label>
                            </div>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <label className="text-xs text-slate-400">
                                    State
                                    <input
                                        name="address.state"
                                        value={newUserForm["address.state"]}
                                        onChange={updateNewUserForm}
                                        placeholder="Bihar"
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                    />
                                </label>
                                <label className="text-xs text-slate-400">
                                    Pincode
                                    <input
                                        name="address.pincode"
                                        value={newUserForm["address.pincode"]}
                                        onChange={updateNewUserForm}
                                        placeholder="813113"
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                    />
                                </label>
                            </div> */}
                            <label className="block text-xs text-slate-400">
                                Address
                                <textarea
                                    name="address"
                                    value={newUserForm.address ?? ""}
                                    onChange={updateNewUserForm}
                                    placeholder="Amanda home"
                                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                />
                            </label>
                            
                                
                            

                            </details>
                    </div>

                    {/* ---- Guardian (all optional) ---- */}
                    <div className="border-t border-slate-800 pt-4">
                        <details open={isEditing}>
                            <summary className="cursor-pointer mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                                Add  Guardian
                            </summary>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="text-xs text-slate-400">
                                    Guardian name
                                    <input
                                        name="guardian.name"
                                        value={newUserForm["guardian.name"] ?? ""}
                                        onChange={updateNewUserForm}
                                        placeholder="Hasrajan sah"
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                    />
                                </label>
                                <label className="text-xs text-slate-400">
                                    Relation
                                    <select
                                        name="guardian.relation"
                                        value={newUserForm["guardian.relation"] ?? ""}
                                        onChange={updateNewUserForm}
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                                    >
                                        <option value="">Select</option>
                                        <option value="Father">Father</option>
                                        <option value="Mother">Mother</option>
                                        <option value="Spouse">Husband</option>
                                        <option value="Spouse">Wife</option>
                                        <option value="Spouse">Brother</option>
                                        <option value="Spouse">Sister</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </label>
                            </div>
                        </details>
                    </div>

                    {!isEditing && <div className="border-t border-slate-800 pt-4">
                        <details>
                            <summary className="cursor-pointer mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                                Add  Nominee
                            </summary>
                            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                                Nominee (optional)
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="text-xs text-slate-400">
                                    Nominee name
                                    <input
                                        name="nominee.name"
                                        value={newUserForm["nominee.name"] ?? ""}
                                        onChange={updateNewUserForm}
                                        placeholder="Anandi"
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                    />
                                </label>
                                <label className="text-xs text-slate-400">
                                    Relation
                                    <select
                                        name="nominee.relation"
                                        value={newUserForm["nominee.relation"] ?? ""}
                                        onChange={updateNewUserForm}
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                                    >
                                        <option value="">Select</option>
                                        <option value="Father">Father</option>
                                        <option value="Mother">Mother</option>
                                        <option value="Spouse">Spouse</option>
                                        <option value="Child">Child</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </label>
                            </div>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <label className="text-xs text-slate-400">
                                    Nominee Aadhaar number
                                    <input
                                        name="nominee.aadharNo"
                                        value={newUserForm["nominee.aadharNo"] ?? ""}
                                        onChange={updateNewUserForm}
                                        placeholder="763274623266"
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                    />
                                </label>
                                <label className="text-xs text-slate-400">
                                    Nominee mobile number
                                    <input
                                        name="nominee.mobileNo"
                                        value={newUserForm["nominee.mobileNo"] ?? ""}
                                        onChange={updateNewUserForm}
                                        placeholder="7654321985"
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                    />
                                </label>
                            </div>
                        </details>
                    </div>}

                    {isEditing && (
                                <>
                                    <label className="flex items-center gap-2 text-sm text-slate-300">
                                        <input
                                            name="active"
                                            type="checkbox"
                                            checked={Boolean(active)}
                                            onChange={updateNewUserForm}
                                            className="h-4 w-4 accent-teal-400"
                                        />
                                        Account active
                                    </label>

                                    <section className="space-y-3 border-t border-slate-800 pt-4">
                                        <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                                            Nominees
                                        </h4>
                                        {!nominees.length && (
                                            <p className="text-xs text-slate-500">No nominees registered.</p>
                                        )}
                                        {nominees.map((nominee) => (
                                            <div
                                                key={nominee.nomineeId}
                                                className="grid gap-3 rounded-lg border border-slate-800 p-3 sm:grid-cols-2"
                                            >
                                                {[
                                                    ["name", "Name"],
                                                    ["relation", "Relation"],
                                                    ["aadhaarNo", "Aadhaar number"],
                                                    ["phone", "Phone"],
                                                ].map(([field, label]) => (
                                                    <label key={field} className="text-xs text-slate-400">
                                                        {label}
                                                        <input
                                                            name={field}
                                                            value={nomineeForms[nominee.nomineeId]?.[field] ?? ""}
                                                            onChange={(event) => updateNomineeField(nominee.nomineeId, event)}
                                                            inputMode={field === "aadhaarNo" || field === "phone" ? "numeric" : undefined}
                                                            maxLength={field === "aadhaarNo" ? 12 : field === "phone" ? 10 : undefined}
                                                            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                                                        />
                                                    </label>
                                                ))}
                                                <div className="flex gap-2 sm:col-span-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => saveNominee(nominee.nomineeId)}
                                                        disabled={savingNomineeId === nominee.nomineeId}
                                                        className="flex-1 rounded-lg border border-teal-700/70 px-3 py-2 text-xs font-medium text-teal-300 hover:bg-teal-500/10 disabled:opacity-50"
                                                    >
                                                        {savingNomineeId === nominee.nomineeId ? "Saving..." : "Save nominee"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteNominee(nominee.nomineeId)}
                                                        disabled={deletingNomineeId === nominee.nomineeId}
                                                        className="rounded-lg border border-red-800 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                                                    >
                                                        {deletingNomineeId === nominee.nomineeId ? "Deleting..." : "Delete"}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </section>
                                </>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowAddUserModal(false)}
                            disabled={creatingUser}
                            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creatingUser}
                            className="rounded-lg bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {creatingUser
                                ? isEditing ? "Saving..." : "Creating..."
                                : isEditing ? "Save user" : "Create user"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}