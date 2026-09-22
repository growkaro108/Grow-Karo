import React from "react";

export default function AddUser({
    handleCreateManualUser,
    newUserForm,
    updateNewUserForm,
    setShowAddUserModal,
    creatingUser,
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-2xl shadow-black/40">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-teal-300">
                            Admin action
                        </p>
                        <h3 className="mt-1 font-[Space_Grotesk] text-xl font-semibold text-slate-100">
                            Add manual user
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowAddUserModal(false)}
                        className="rounded-full px-2 py-1 text-sm text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleCreateManualUser} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs text-slate-400">
                            Full name
                            <input
                                name="name"
                                value={newUserForm.name}
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
                                value={newUserForm.phone}
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
                                value={newUserForm.email}
                                onChange={updateNewUserForm}
                                required
                                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                placeholder="user@example.com"
                            />
                        </label>
                        <label className="text-xs text-slate-400">
                            Password
                            <input
                                name="passwordHash"
                                type="text"
                                value={newUserForm.passwordHash}
                                onChange={updateNewUserForm}
                                required
                                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                                placeholder="StrongPass@123"
                            />
                        </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs text-slate-400">
                            DOB
                            <input
                                name="dob"
                                type="date"
                                value={newUserForm.dob}
                                onChange={updateNewUserForm}
                                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                            />
                        </label>
                        <label className="text-xs text-slate-400">
                            Marital status
                            <select
                                name="maritalStatus"
                                value={newUserForm.maritalStatus}
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
                            value={newUserForm.aadharNo}
                            onChange={updateNewUserForm}
                            placeholder="123456789012"
                            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                        />
                    </label>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowAddUserModal(false)}
                            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creatingUser}
                            className="rounded-lg bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {creatingUser ? "Creating..." : "Create user"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
