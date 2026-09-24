import React, { useCallback, useEffect, useMemo, useState } from "react";
import Toolbar from "./Toolbar";
import { errorMessage } from "@/components/Message";
import {
  createManualUser,
  fetchAllUsers,
} from "../../../../../../services/malikService";
import { TableRowLoader } from "@/loader/TableRowLoader";
import dynamic from "next/dynamic";
// import { AddUser } from "./AddUser";
const AddUser = dynamic(() => import("./AddUser"), {
  loading: () => (
    <div className="p-4 h-7 w-7 z-60 animate-pulse justify-center flex items-center text-center text-slate-400"></div>
  ),
  ssr: false,
});

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
  const [pageSize, setPageSize] = useState(5);
  const [totalUsers, setTotalUsers] = useState(0);
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
  const fetchAllUser = useCallback(async () => {
    try {
      const res = await fetchAllUsers(currentPage, pageSize);
      if (!res || !Array.isArray(res.content)) {
        setUsers([]);
        return;
      }
      setUsers(res.content);
      setTotalUsers(res.totalElements);
    } catch (e) {
      console.log(e);
      errorMessage("something went wrong ,try later..");
    }
  }, [currentPage, pageSize])

  useEffect(() => {
    console.log("called", currentPage, pageSize)
    fetchAllUser();
  }, [currentPage, fetchAllUser, pageSize]);

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
          totalItems={totalUsers}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
        {/* on mobile size */}
        <UserCardList users={filtered} onSelect={setSelected} />
      </div>

      {showAddUserModal && <AddUser
        handleCreateManualUser={handleCreateManualUser}
        newUserForm={newUserForm}
        updateNewUserForm={updateNewUserForm}
        setShowAddUserModal={setShowAddUserModal}
        creatingUser={creatingUser}
      />}

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
