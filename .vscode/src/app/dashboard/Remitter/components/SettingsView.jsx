'use client';

import React, { useState } from 'react';

function sanitizeInput(value, maxLength = 40) {
  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

export default function SettingsView({ onCancel }) {
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Doe');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanedFirst = sanitizeInput(firstName, 40);
    const cleanedLast = sanitizeInput(lastName, 40);

    if (!cleanedFirst || !cleanedLast) {
      setError('Both names are required.');
      return;
    }

    setError('');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-3xl">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Configuration Profiles</h2>
      <p className="text-xs text-gray-500 mb-6">Manage global remitting limits, profile tiers, and KYC structures.</p>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              maxLength={40}
              onChange={(e) => setFirstName(sanitizeInput(e.target.value, 40))}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              maxLength={40}
              onChange={(e) => setLastName(sanitizeInput(e.target.value, 40))}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
        <div className="flex justify-end space-x-2 pt-4">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm">Save Profiles</button>
        </div>
      </form>
    </div>
  );
}
