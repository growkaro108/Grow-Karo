import React from 'react'
import { Avatar, displayStatus, ReturnBadge, StatusPill } from './reportUtils';
import { CalendarDays, ChevronDown, Mail, Phone } from 'lucide-react';
import { currency } from '../../utils';

export default function UserRow({ user: u, isOpen, onToggle }) {
  const g = u.currentValue - u.totalInvested;
  const pct = u.totalInvested > 0 ? (g / u.totalInvested) * 100 : 0;
  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer border-b border-white/5 transition hover:bg-white/[0.04] ${isOpen ? "bg-white/[0.04]" : ""}`}
      >
        <td className="px-4 py-3.5">
          <ChevronDown
            size={15}
            className={`text-slate-500 transition ${isOpen ? "rotate-180 text-[#D8BC82]" : ""}`}
          />
        </td>
        <td className="px-2 py-3.5">
          <div className="flex items-center gap-3">
            <Avatar name={u.name} seed={u.id} />
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{u.name}</p>
              <p className="truncate text-xs text-slate-500">{u.email}</p>
            </div>
          </div>
        </td>
        <td className="px-2 py-3.5">
          <StatusPill status={u.status} />
        </td>
        <td className="px-2 py-3.5">
          <span className="inline-flex items-center rounded-lg bg-white/[0.05] px-2 py-1 text-xs font-medium text-slate-300 ring-1 ring-white/10">
            {u.schemes.length} scheme{u.schemes.length !== 1 ? "s" : ""}
          </span>
        </td>
        <td className="px-2 py-3.5 text-right tabular-nums text-slate-300">
          {currency(u.totalInvested)}
        </td>
        <td className="px-2 py-3.5 text-right font-medium tabular-nums text-slate-100">
          {currency(u.currentValue)}
        </td>
        <td className="px-2 py-3.5 text-right">
          {u.totalInvested > 0 ? (
            <ReturnBadge value={pct} />
          ) : (
            <span className="text-slate-600">—</span>
          )}
        </td>
        <td className="px-4 py-3.5 text-xs text-slate-400">
          {u.joinedDate || "—"}
        </td>
      </tr>
      {isOpen && (
        <tr className="border-b border-white/5 bg-slate-950/60">
          <td colSpan={8} className="px-4 py-5 sm:px-10">
            <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Mail size={13} className="text-slate-500" />
                {u.email || "No email"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone size={13} className="text-slate-500" />
                {u.phone || "No phone"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={13} className="text-slate-500" />
                {u.joinedDate
                  ? `Joined ${u.joinedDate}`
                  : "Join date unavailable"}
              </span>
              <span className="ml-auto font-mono text-[11px] text-slate-600">
                ID · {u.id}
              </span>
            </div>

            {u.schemes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 py-6 text-center text-xs text-slate-500">
                This investor has no scheme enrollments.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2.5 text-left font-medium">
                        Scheme
                      </th>
                      <th className="px-2 py-2.5 text-right font-medium">
                        Invested
                      </th>
                      <th className="px-2 py-2.5 text-right font-medium">
                        Current
                      </th>
                      <th className="px-2 py-2.5 text-right font-medium">
                        Returns
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium">
                        Enrolled on
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {u.schemes.map((s) => (
                      <tr key={s.id} className="border-t border-white/5">
                        <td className="px-4 py-2.5 font-medium text-slate-200">
                          {s.name}
                        </td>
                        <td className="px-2 py-2.5 text-right tabular-nums text-slate-300">
                          {currency(s.investedAmount)}
                        </td>
                        <td className="px-2 py-2.5 text-right tabular-nums text-slate-300">
                          {currency(s.currentValue)}
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <ReturnBadge value={s.returns} />
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusPill
                            status={s.status}
                            label={displayStatus(s.status)}
                          />
                        </td>
                        <td className="px-4 py-2.5 text-slate-400">
                          {s.enrolledOn || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
