import React, { useEffect, useMemo, useState } from "react";
import Toolbar from "./Toolbar";
import UserTable from "./UserTable";
import UserCardList from "./UserCardList";
import UserDrawer from "./UserDrawer";
import { USERS } from "./mockData";
import { errorMessage } from "@/components/Message";
import { fetchAllUsers } from "../../../../../../services/malikService";

export default function UserManagement() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [schemeFilter, setSchemeFilter] = useState("all");
  const [sortDesc, setSortDesc] = useState(true);
  const [selected, setSelected] = useState(null);
  const [users, setUsers] = useState([]);
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const filtered = useMemo(() => {
    let list = users.filter((u) => {
      const matchesQuery =
        !query ||
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase()) ||
        u.id.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      const matchesScheme = schemeFilter === "all" || u.scheme === schemeFilter;
      return matchesQuery && matchesStatus && matchesScheme;
    });
    list = [...list].sort((a, b) =>
      sortDesc
        ? new Date(b.joined) - new Date(a.joined)
        : new Date(a.joined) - new Date(b.joined),
    );
    return list;
  }, [users, query, statusFilter, schemeFilter, sortDesc]);

  useEffect(() => {
    async function fetchAllUser() {
      try {
        const res = await fetchAllUsers();
        // console.log(res);
        if (!res || res?.content?.length === 0) return;
        setUsers(res.content);
      } catch (e) {
        console.log(e);
        errorMessage("something went wrong ,try later..");
      }
    }
    fetchAllUser();
  }, []);

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

      <UserDrawer user={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
