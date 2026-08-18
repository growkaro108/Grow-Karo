import React from "react";
import { ChevronRight, Wallet } from "lucide-react";
import StatusPill from "./StatusPill";
import { dateFmt, initials } from "./format";

export default function UserCardList({ users, onSelect }) {
  return (
    <div className="space-y-3 sm:hidden">
      {users.map((u) => (
        <button
          key={u.userSchemeId}
          onClick={() => onSelect(u)}
          className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-[#111827] p-4 text-left shadow-lg shadow-black/20 active:bg-white/[0.03]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-400/10 text-xs font-semibold text-teal-400">
            {initials(u.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-slate-100">
                {u.name}
              </p>
              <StatusPill status={u.status} />
            </div>
            <p className="truncate text-xs text-slate-500">{u.scheme}</p>
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Wallet className="h-3 w-3" /> {u.bonds.length} bonds
              </span>
              <span>{dateFmt(u.maturityDate)}</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
        </button>
      ))}

      {users.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 px-5 py-14 text-center text-sm text-slate-500">
          No users match these filters.
        </div>
      )}
    </div>
  );
}
