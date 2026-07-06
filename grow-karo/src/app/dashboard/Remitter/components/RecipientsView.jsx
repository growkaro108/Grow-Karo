'use client';

import React from 'react';

export default function RecipientsView({ recipients = [] }) {
  const safeRecipients = Array.isArray(recipients) ? recipients : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Verified Beneficiaries</h2>
          <p className="text-xs text-gray-500">Manage payment channels and destination delivery rails</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all">+ Add Recipient</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {safeRecipients.length === 0 ? (
          <div className="md:col-span-2 rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">No recipients available yet.</div>
        ) : safeRecipients.map((rec) => (
          <div key={rec.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${rec.color}`}>{rec.initial}</div>
              <div>
                <h4 className="font-bold text-gray-900">{rec.name}</h4>
                <p className="text-xs text-gray-500">{rec.country} • {rec.details}</p>
              </div>
            </div>
            <button type="button" className="text-gray-400 hover:text-blue-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></button>
          </div>
        ))}
      </div>
    </div>
  );
}
