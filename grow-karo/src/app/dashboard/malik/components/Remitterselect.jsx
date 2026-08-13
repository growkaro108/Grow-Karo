import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Users, Wallet, CheckCircle2 } from "lucide-react";

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function initials(name) {
  return (name || "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Controlled or uncontrolled remitter picker.
 *
 * Props:
 * - remitters: array of Remitter objects (required — no fallback data)
 * - selected:  currently selected remitter object (controlled mode)
 * - onSelect:  (remitterId) => void, called when the user picks an item
 *
 * If `selected`/`onSelect` are omitted, the component manages its own
 * selection state internally (uncontrolled mode).
 */
export default function RemitterSelect({ selected, onSelect, remitters }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [localSelected, setLocalSelected] = useState(null);
  const rootRef = useRef(null);

  const activeSelected = selected !== undefined ? selected : localSelected;
  const activeRemitters = remitters ?? [];

  useEffect(() => {
    function onClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const filtered = activeRemitters.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      r.organizationName?.toLowerCase().includes(q) ||
      r.remitterEmail?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-md mx-auto font-sans">
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-left shadow-sm hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        >
          {activeSelected ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-300">
                {initials(activeSelected.organizationName)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-100">
                  {activeSelected.organizationName}
                </div>
                <div className="truncate text-xs text-slate-400">
                  {activeSelected.remitterEmail}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-sm text-slate-500">Select a remitter…</span>
          )}
          <ChevronDown
            size={18}
            className={`shrink-0 text-slate-500 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div className="absolute z-20 mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 shadow-lg shadow-black/40">
            <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-2">
              <Search size={16} className="text-slate-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email"
                className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
            </div>

            <ul className="max-h-80 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-3.5 py-6 text-center text-sm text-slate-500">
                  {activeRemitters.length === 0
                    ? "No remitters available"
                    : `No remitters match "${query}"`}
                </li>
              )}

              {filtered.map((r) => {
                const isSelected = activeSelected?.id === r.id;
                const pctPaid = Math.min(
                  100,
                  Math.round((r.totalPaid / r.allocationLimit) * 100),
                );
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelect) {
                          onSelect(r.id);
                        } else {
                          setLocalSelected(r);
                        }
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`w-full px-3.5 py-2.5 text-left transition-colors hover:bg-slate-800/60 ${
                        isSelected ? "bg-indigo-500/10" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-300">
                          {initials(r.organizationName)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium text-slate-100">
                              {/* {r.organizationName} */}
                              {r.organizationName.length > 20
                                ? r.organizationName.slice(0, 20) + "..."
                                : r.organizationName}
                            </span>
                            {isSelected && (
                              <CheckCircle2
                                size={16}
                                className="shrink-0 text-indigo-400"
                              />
                            )}
                          </div>
                          <div className="truncate text-xs text-slate-400">
                            {r.remitterEmail}
                          </div>

                          <div className="mt-2 grid grid-cols-3 gap-2">
                            <div className="rounded-md bg-slate-800/60 px-2 py-1.5">
                              <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                Allocated
                              </div>
                              <div className="text-xs font-semibold text-slate-200">
                                {formatINR(r.allocationLimit)}
                              </div>
                            </div>
                            <div className="rounded-md bg-slate-800/60 px-2 py-1.5">
                              <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                Paid
                              </div>
                              <div className="text-xs font-semibold text-emerald-400">
                                {formatINR(r.totalPaid)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 rounded-md bg-slate-800/60 px-2 py-1.5">
                              <Users size={12} className="text-slate-500" />
                              <div>
                                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                  Users
                                </div>
                                <div className="text-xs font-semibold text-slate-200">
                                  {r.users?.length ?? 0}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-indigo-500"
                              style={{ width: `${pctPaid}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {activeSelected && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <Wallet size={13} />
          Allocation limit {formatINR(activeSelected.allocationLimit)} ·
          remaining{" "}
          {formatINR(activeSelected.allocationLimit - activeSelected.totalPaid)}
        </div>
      )}
    </div>
  );
}
