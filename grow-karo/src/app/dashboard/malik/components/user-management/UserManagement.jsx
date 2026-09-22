import React, { useEffect, useMemo, useState } from "react";
import Toolbar from "./Toolbar";
// import UserTable from "./UserTable";
// import UserCardList from "./UserCardList";
// import UserDrawer from "./UserDrawer";
import { errorMessage } from "@/components/Message";
import {
  createManualUser,
  fetchAllUsers,
} from "../../../../../../services/malikService";
import { TableRowLoader } from "@/loader/TableRowLoader";
import dynamic from "next/dynamic";

const UserDrawer = dynamic(() => import("./UserDrawer"), {
  loading: () => (
    <div className="p-4 text-center text-slate-400">Loading...</div>
  ),
  ssr: false,
});
const UserCardList = dynamic(() => import("./UserCardList"), {
  loading: () => (
    <div className="p-4 text-center text-slate-400">Loading...</div>
  ),
  ssr: false,
});
const UserTable = dynamic(() => import("./UserTable"), {
  loading: () => <TableRowLoader colspan={5} loading={"user Details"} />,
  ssr: false,
});

const EMPTY_NEW_USER = {
  name: "",
  email: "",
  phone: "",
  passwordHash: "",
  dob: "",
  maritalStatus: "Single",
  aadharNo: "",
};

export default function UserManagement() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [schemeFilter, setSchemeFilter] = useState("all");
  const [sortDesc, setSortDesc] = useState(true);
  const [selected, setSelected] = useState(null);
  const [users, setUsers] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState(EMPTY_NEW_USER);
  const [creatingUser, setCreatingUser] = useState(false);
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const filtered = useMemo(() => {
    // Parse and normalize admin emails ONCE outside the filter loop
    const adminEmails =
      process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean) ?? [];

    const lowerQuery = query ? query.toLowerCase() : "";

    let list = users.filter((u) => {
      const userEmail = u.email?.toLowerCase() ?? "";

      // 1. Immediately exclude admin users
      if (adminEmails.includes(userEmail)) {
        return false;
      }

      // 2. Check query match across name, email, or id
      const matchesQuery =
        !lowerQuery ||
        u.name?.toLowerCase().includes(lowerQuery) ||
        userEmail.includes(lowerQuery) ||
        u.id?.toLowerCase().includes(lowerQuery);

      // 3. Check dropdown filters
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      const matchesScheme = schemeFilter === "all" || u.scheme === schemeFilter;

      return matchesQuery && matchesStatus && matchesScheme;
    });

    // Sort by join date safely
    return list.sort((a, b) => {
      const dateA = new Date(a.joined).getTime();
      const dateB = new Date(b.joined).getTime();
      return sortDesc ? dateB - dateA : dateA - dateB;
    });
  }, [users, query, statusFilter, schemeFilter, sortDesc]);
  async function fetchAllUser() {
    try {
      const res = await fetchAllUsers();
      if (!res || !Array.isArray(res.content)) {
        setUsers([]);
        return;
      }
      setUsers(res.content);
    } catch (e) {
      console.log(e);
      errorMessage("something went wrong ,try later..");
    }
  }

  useEffect(() => {
    fetchAllUser();
  }, []);

  const updateNewUserForm = (event) => {
    const { name, value } = event.target;
    setNewUserForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateManualUser = async (event) => {
    event.preventDefault();

    const name = newUserForm.name.trim();
    const email = newUserForm.email.trim();
    const phone = newUserForm.phone.trim();
    const passwordHash = newUserForm.passwordHash.trim();

    if (!name || !email || !phone || !passwordHash) {
      errorMessage("Name, email, phone, and password are required.");
      return;
    }

    setCreatingUser(true);
    try {
      const payload = {
        name,
        email,
        phone,
        passwordHash,
        dob: newUserForm.dob || null,
        maritalStatus: newUserForm.maritalStatus || "Single",
        aadharNo: newUserForm.aadharNo.trim(),
        guardian: null,
        address: {},
        nominee: null,
        bankName: "",
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
      };

      const response = await createManualUser(payload);
      if (!response) {
        return;
      }

      setShowAddUserModal(false);
      setNewUserForm(EMPTY_NEW_USER);
      await fetchAllUser();
    } catch (error) {
      console.error("Failed to create manual user:", error);
      errorMessage(error.message || "Unable to add user right now.");
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <div className="min-h-screen bg-inherit font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .font-sans { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
      `}</style>

      <div className="mx-auto max-w-6xl">
        {/* Page header */}
        {/* <div className="mb-6 flex flex-col gap-1">
          <h1 className="font-[Space_Grotesk] text-2xl font-semibold text-slate-100">
            User Management
          </h1>
          <p className="text-sm text-slate-400">
            View accounts, joined schemes, and bond holdings across the
            platform.
          </p>
        </div> */}

        <Toolbar
          query={query}
          onQueryChange={setQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          schemeFilter={schemeFilter}
          onSchemeChange={setSchemeFilter}
          sortDesc={sortDesc}
          onToggleSort={() => setSortDesc((v) => !v)}
          onAddUserClick={() => setShowAddUserModal(true)}
        />

        {/* <p className="mb-3 text-sm text-slate-400">
          {filtered.length} user{filtered.length !== 1 ? "s" : ""} found
        </p> */}

        <UserTable
          users={filtered}
          onSelect={setSelected}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filtered.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
        {/* on mobile size */}
        <UserCardList users={filtered} onSelect={setSelected} />
      </div>

      {showAddUserModal && (
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
      )}

      <UserDrawer
        user={selected}
        onClose={() => setSelected(null)}
        onSaved={async () => {
          await fetchAllUser();
          setSelected(null);
        }}
      />
    </div>
  );
}
