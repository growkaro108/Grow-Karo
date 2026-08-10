import React, { useEffect, useRef, useState } from "react";
import { X, Search, UserRound, CircleX, Loader2 } from "lucide-react";
import { onSearchUsers } from "../../../../../../services/malikService";

export function RemitterFormModal({
  isOpen,
  isEditing,
  formData,
  formErrors,
  onChange,
  onSubmit,
  onClose,
  initialSelectedUser = null,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState(initialSelectedUser);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Reset local search state whenever the modal opens fresh (e.g. switching
  // between "add" and "edit", or closing/reopening).
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedUser(initialSelectedUser);
      setQuery("");
      setResults([]);
      setShowDropdown(false);
    }
  }, [isOpen, initialSelectedUser]);

  useEffect(() => {
    if (!query.trim() || selectedUser) {
      setResults([]);
      return;
    }
    //validate and sanitize query IF NOT THEN REPLACE
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
        console.log(users);
        setResults(users);
      } catch (err) {
        console.error("User search failed:", err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 1000);

    return () => clearTimeout(debounceRef.current);
  }, [query, selectedUser]);

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
    setSelectedUser(user);
    setQuery("");
    setResults([]);
    onChange({ target: { name: "userId", value: user.userId } });
    setShowDropdown(false);
  }

  function handleClearUser() {
    setSelectedUser(null);
    onChange({ target: { name: "userId", value: "" } });
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-all duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl transition-all duration-300 transform ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              {isEditing
                ? "Update Remitter Rail"
                : "Setup Authorized Remitter Rail"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditing
                ? "Modify access rights and disbursement details."
                : "Configure access rights and disbursement tracking nodes."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 bg-slate-800 p-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <hr className="border-slate-800" />

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div ref={containerRef} className="relative">
            {/* <input type="hidden" name="userId" value={formData.userId} /> */}
            <label className="block text-slate-400 font-medium mb-1.5">
              Linked Platform User
            </label>

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
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleClearUser}
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
                    placeholder="Search by user ID, name, or email"
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

            {formErrors.userId && (
              <p className="text-rose-500 text-[11px] mt-1">
                {formErrors.userId}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">
              Remitter Organization Name
            </label>
            <input
              type="text"
              name="remitterOrganizationName"
              required
              placeholder="e.g. Neha Payments Ltd"
              value={formData.remitterOrganizationName}
              onChange={onChange}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 transition-colors"
            />
            {formErrors.remitterOrganizationName && (
              <p className="text-rose-500 text-[11px] mt-1">
                {formErrors.remitterOrganizationName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">
              Status
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() =>
                  onChange({ target: { name: "status", value: "active" } })
                }
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  formData.status === "active"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({ target: { name: "status", value: "inactive" } })
                }
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  formData.status === "inactive"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Inactive
              </button>
            </div>
            {formErrors.status && (
              <p className="text-rose-500 text-[11px] mt-1">
                {formErrors.status}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">
                Allocation Limit (INR)
              </label>
              <input
                type="number"
                name="allocationLimit"
                required
                placeholder="100000"
                value={formData.allocationLimit}
                onChange={onChange}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 transition-colors"
              />
              {formErrors.allocationLimit && (
                <p className="text-rose-500 text-[11px] mt-1">
                  {formErrors.allocationLimit}
                </p>
              )}
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">
                Aadhar Number
              </label>
              <input
                type="text"
                name="aadharNumber"
                required
                maxLength={12}
                placeholder="e.g. 123456789012"
                value={formData.aadharNumber}
                onChange={onChange}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 font-mono tracking-wider outline-none focus:border-emerald-500 transition-colors"
              />
              {formErrors.aadharNumber && (
                <p className="text-rose-500 text-[11px] mt-1">
                  {formErrors.aadharNumber}
                </p>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-slate-400 font-medium mb-1.5">
                PAN Number
              </label>
              <input
                type="text"
                name="panNumber"
                required
                maxLength={10}
                placeholder="e.g. ABCDE1234F"
                value={formData.panNumber}
                onChange={onChange}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 transition-colors"
              />
              {formErrors.panNumber && (
                <p className="text-rose-500 text-[11px] mt-1">
                  {formErrors.panNumber}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 border border-slate-800 text-slate-300 font-semibold rounded-xl hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 shadow-md active:scale-[0.99] transition-all"
            >
              {isEditing ? "Save Changes" : "Onboard & Generate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
