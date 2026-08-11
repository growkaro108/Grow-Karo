import React, { useEffect, useRef, useState } from "react";
import { Search, UserRound, CircleX, Loader2 } from "lucide-react";
import { onSearchUsers } from "../../../../../services/malikService";

/**
 for use 

 <UserSearchSelect
  selectedUser={selectedUser}
  onSelect={(user) => setSelectedUser(user)}
  onClear={() => setSelectedUser(null)}
  label="Assign Manager"
  error={formErrors.managerId}

/>

 */
export function UserSearchSelect({
  selectedUser = null,
  onSelect,
  onClear,
  error,
  disabled = false,
  placeholder = "Search by user ID, name, or email",
  label = "Linked Platform User",
  debounceMs = 1000,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Reset local search state whenever selection is cleared externally.
  useEffect(() => {
    if (!selectedUser) {
      setQuery("");
      setResults([]);
      setShowDropdown(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!query.trim() || selectedUser) {
      setResults([]);
      return;
    }

    if (query.trim().length > 60) {
      setQuery(" ");
      setResults([]);
      return;
    }

    const validQuery = query.trim().replace(/[^a-zA-Z0-9@.\-+\s]/g, "");
    if (!validQuery) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const users = await onSearchUsers(query.trim());
        setResults(users);
      } catch (err) {
        console.error("User search failed:", err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => clearTimeout(debounceRef.current);
  }, [query, selectedUser, debounceMs]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelectUser(user) {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    onSelect(user);
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-slate-400 font-medium mb-1.5">{label}</label>

      {selectedUser ? (
        <div className="flex items-center justify-between gap-2 bg-slate-950 border border-emerald-600/40 rounded-xl px-3.5 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-600/20 flex items-center justify-center">
              <UserRound className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-slate-100 font-medium truncate">
                {selectedUser.fullName}
              </p>
              <p className="text-slate-500 text-[11px] truncate">
                {selectedUser.email} · ID: {selectedUser.userId}
              </p>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={onClear}
              className="shrink-0 text-slate-500 hover:text-slate-300"
              aria-label="Clear selected user"
            >
              <CircleX className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl pl-9 pr-9 py-2.5 outline-none focus:border-emerald-500 transition-colors"
            />
            {isSearching && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 animate-spin" />
            )}
          </div>

          {showDropdown && query.trim() && (
            <div className="absolute z-10 mt-1.5 w-full max-h-52 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl shadow-xl">
              {isSearching ? (
                <p className="text-slate-500 px-3.5 py-3">Searching…</p>
              ) : results.length > 0 ? (
                results.map((user) => (
                  <button
                    type="button"
                    key={user.userId}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="shrink-0 w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center">
                      <UserRound className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-100 font-medium truncate">
                        {user.fullName}
                      </p>
                      <p className="text-slate-500 text-[11px] truncate">
                        {user.email} · ID: {user.userId}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-slate-500 px-3.5 py-3">
                  No matching users found.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {error && <p className="text-rose-500 text-[11px] mt-1">{error}</p>}
    </div>
  );
}
