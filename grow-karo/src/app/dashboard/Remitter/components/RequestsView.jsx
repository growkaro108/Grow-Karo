'use client';

import React, { useState } from 'react';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

function sanitizeText(value, maxLength = 240) {
  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

export default function RequestsView({ requests = [] }) {
  const [activeSettlement, setActiveSettlement] = useState(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [remitterMessage, setRemitterMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const safeRequests = Array.isArray(requests) ? requests : [];

  const handleOpenSettlement = (req) => {
    if (!req?.id || !req?.sender) return;

    setActiveSettlement(req);
    const numericAmount = Number.parseFloat(String(req.amount ?? '').replace(/[^0-9.]/g, ''));
    setSettlementAmount(Number.isFinite(numericAmount) ? numericAmount.toString() : '');
    setFormError('');
    setProofFile(null);
    setRemitterMessage('');
  };

  const handleCloseSettlement = () => {
    setActiveSettlement(null);
    setSettlementAmount('');
    setProofFile(null);
    setRemitterMessage('');
    setFormError('');
    setIsSubmitting(false);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setProofFile(null);
      setFormError('Please choose a valid proof file.');
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setProofFile(null);
      setFormError('Only JPG, PNG, WEBP, or PDF files are supported.');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setProofFile(null);
      setFormError('Proof file must be 5MB or smaller.');
      return;
    }

    setProofFile({ name: selectedFile.name, size: selectedFile.size, type: selectedFile.type });
    setFormError('');
  };

  const handleSubmitSettlement = (e) => {
    e.preventDefault();

    if (!activeSettlement) {
      setFormError('No request selected.');
      return;
    }

    const parsedAmount = Number(settlementAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 1000000) {
      setFormError('Enter a valid settlement amount between ₹0.01 and ₹1,000,000.');
      return;
    }

    if (!proofFile) {
      setFormError('Please upload payment proof before submitting.');
      return;
    }

    const sanitizedMessage = sanitizeText(remitterMessage);
    if (sanitizedMessage.length > 240) {
      setFormError('Your message is too long. Please keep it under 240 characters.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    window.setTimeout(() => {
      setIsSubmitting(false);
      handleCloseSettlement();
    }, 600);
  };

  return (
    <div className="relative">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6">
        <div className="pb-6">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Pending Remittance Demands</h2>
          <p className="text-xs text-gray-500">Incoming counterparty calls requesting matching secure liquidation.</p>
        </div>

        {safeRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-400 font-medium">No active pending remittance invoices found.</div>
        ) : (
          <div className="space-y-4">
            {safeRequests.map((req) => (
              <div key={req.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-gray-200">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-900 text-sm">{sanitizeText(req.sender)}</span>
                    <span className="text-xs text-gray-400">• {sanitizeText(req.date)}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 italic">"{sanitizeText(req.note)}"</p>
                  <p className="text-sm font-bold text-blue-600 mt-1">{sanitizeText(req.amount)}</p>
                </div>
                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button type="button" className="px-3.5 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-100 transition-all">Decline</button>
                  <button
                    type="button"
                    onClick={() => handleOpenSettlement(req)}
                    className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm transition-all"
                  >
                    Settle Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-100 shadow-2xl overflow-hidden transform transition-all scale-100 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Settle Remittance Demand</h3>
                <p className="text-xs text-gray-500 mt-0.5">Fulfilling order request for <span className="font-semibold text-gray-700">{sanitizeText(activeSettlement.sender)}</span></p>
              </div>
              <button
                type="button"
                onClick={handleCloseSettlement}
                className="text-gray-400 hover:text-gray-600 bg-gray-50 p-1.5 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <hr className="border-gray-100" />

            <form onSubmit={handleSubmitSettlement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Confirm Settlement Amount</label>
                <div className="relative rounded-xl border border-gray-200 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-all px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1000000"
                    inputMode="decimal"
                    required
                    value={settlementAmount}
                    onChange={(e) => setSettlementAmount(e.target.value)}
                    className="w-full bg-transparent font-bold text-lg text-gray-900 outline-none"
                  />
                  <span className="absolute right-4 top-2.5 font-bold text-xs text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-md shadow-2xs">USD</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Payment Receipt / Screenshot</label>
                <div className="relative group border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl p-4 bg-gray-50/50 hover:bg-white transition-all text-center cursor-pointer">
                  <input
                    type="file"
                    required
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <svg className="w-6 h-6 mx-auto text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-xs font-medium text-gray-600 truncate">
                      {proofFile ? `Attached: ${proofFile.name}` : 'Click or drag to upload transaction proof'}
                    </p>
                    <p className="text-[10px] text-gray-400">Supports PNG, JPG, WEBP, PDF up to 5MB</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Message to Beneficiary <span className="text-gray-300 font-normal lowercase">(optional)</span></label>
                <textarea
                  rows="2"
                  value={remitterMessage}
                  onChange={(e) => setRemitterMessage(e.target.value)}
                  maxLength={240}
                  placeholder="e.g. Funds cleared via secure SWIFT rails. Reference code enclosed."
                  className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-300 resize-none"
                />
              </div>

              {formError ? (
                <p className="text-xs font-medium text-red-600">{formError}</p>
              ) : null}

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseSettlement}
                  className="w-1/2 py-2.5 border border-gray-200 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 shadow-md hover:shadow transition-all disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Submitting…' : 'Authorize Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
