import React from "react";
import { ChevronRight, StepBack, StepForward } from "lucide-react";
import StatusPill from "./StatusPill";
import { dateFmt, initials } from "./format";
import TablePagination from "@/components/TablePagination";
import { currency } from "../../utils";

export default function UserTable({
  users,
  onSelect,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) {
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
            <th className="px-5 py-3 font-medium">Total Redeem</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {users.map((u) => (
            <tr
              key={u.userId}
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
              <td className="px-5 py-3.5 text-sm text-slate-300">
                {u.enrolledSchemes.length > 0
                  ? u.enrolledSchemes[0].schemeName
                  : "N/A"}
              </td>
              <td className="px-5 py-3.5 text-sm tabular-nums text-slate-300">
                {u.enrolledSchemes.length}
              </td>
              <td className="px-5 py-3.5">
                <StatusPill status={u.isActive ? "Active" : "Inactive"} />
              </td>
              <td className="px-5 py-3.5 text-sm text-slate-500">
                {u.joined ? u.joined : "N/A"}
                {/* {dateFmt(u.maturityDate)} */}
              </td>
              <td className="px-5 py-3.5 text-sm text-slate-500">
                {u.totalRedeem ? currency(u.totalRedeem) : "N/A"}
                {/* {dateFmt(u.maturityDate)} */}
              </td>
              <td className="px-5 py-3.5 text-right">
                <ChevronRight className="ml-auto h-4 w-4 text-slate-600" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* //pagination button */}
      <TablePagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        darkMode={true}
      />

      {users.length === 0 && (
        <div className="px-5 py-14 text-center text-sm text-slate-500">
          No users match these filters. Try adjusting your search.
        </div>
      )}
    </div>
  );
}
