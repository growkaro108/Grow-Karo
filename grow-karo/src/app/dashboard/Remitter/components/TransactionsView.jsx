'use client';

import React from 'react';

export default function TransactionsView({ transactions = [] }) {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Historical Ledger</h2>
          <p className="text-xs text-gray-500">A comprehensive chronological index of all outbound assets.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase">
              <th className="pb-3">Reference / Beneficiary</th>
              <th className="pb-3">Value</th>
              <th className="pb-3">Execution Date</th>
              <th className="pb-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {safeTransactions.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-8 text-center text-sm text-gray-500">No transactions available.</td>
              </tr>
            ) : safeTransactions.map((tx) => (
              <tr key={tx.id}>
                <td className="py-4">
                  <p className="font-semibold text-gray-900">{tx.name}</p>
                  <p className="text-xs text-gray-400">{tx.id} • {tx.method}</p>
                </td>
                <td className="py-4">
                  <p className="font-semibold text-gray-900">{tx.amount}</p>
                  <p className="text-xs text-gray-400">{tx.foreign}</p>
                </td>
                <td className="py-4 text-gray-500">{tx.date}</td>
                <td className="py-4 text-right">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tx.status === 'Completed' ? 'bg-green-50 text-green-700' : tx.status === 'Processing' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
