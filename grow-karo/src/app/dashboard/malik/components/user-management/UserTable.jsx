import React from "react";
import { ChevronRight } from "lucide-react";
import StatusPill from "./StatusPill";
import { dateFmt, initials } from "./format";

export default function UserTable({ users, onSelect }) {
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-[#111827] shadow-lg shadow-black/20 sm:block">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-800 bg-white/2 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3 font-medium">User</th>
            <th className="px-5 py-3 font-medium">Scheme</th>
            <th className="px-5 py-3 font-medium">Bonds</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Joined</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {users.map((u) => (
            <tr
              key={u.userSchemeId}
              onClick={() => onSelect(u)}
              className="cursor-pointer transition hover:bg-white/3"
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-400/10 text-xs font-semibold text-teal-400">
                    {initials(u.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {u.name}
                    </p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5 text-sm text-slate-300">{u.scheme}</td>
              <td className="px-5 py-3.5 text-sm tabular-nums text-slate-300">
                {u.bonds.length}
              </td>
              <td className="px-5 py-3.5">
                <StatusPill status={u.status} />
              </td>
              <td className="px-5 py-3.5 text-sm text-slate-500">
                {dateFmt(u.maturityDate)}
              </td>
              <td className="px-5 py-3.5 text-right">
                <ChevronRight className="ml-auto h-4 w-4 text-slate-600" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="px-5 py-14 text-center text-sm text-slate-500">
          No users match these filters. Try adjusting your search.
        </div>
      )}
    </div>
  );
}
