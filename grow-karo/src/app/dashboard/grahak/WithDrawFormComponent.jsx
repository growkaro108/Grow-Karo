import React, { useState } from "react";

// Mock data representing what is already saved in the user's profile
const USER_PROFILE_BANK_DATA = {
  accountNumber: "987654321098",
  ifscCode: "HDFC0000123",
  accountHolderName: "ANAND RAJ",
};

const CURRENT_BALANCE = 24500.0;
const MIN_WITHDRAWAL_AMOUNT = 100.0;
const MAX_WITHDRAWAL_AMOUNT = 1000.0;

export default function WithdrawFormComponent({ onCancel }) {
  const [amount, setAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [useProfileAccount, setUseProfileAccount] = useState(false); // Checkbox state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  // Handle checking/unchecking the "Same as profile account" box
  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setUseProfileAccount(checked);

    if (checked) {
      // Automatically autofill with user data from profile
      setBankAccount(USER_PROFILE_BANK_DATA.accountNumber);
      setIfscCode(USER_PROFILE_BANK_DATA.ifscCode);
    } else {
      // Clear fields if unchecked so they can write manually
      setBankAccount("");
      setIfscCode("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid withdrawal amount.");
      return;
    }
    if (numericAmount > CURRENT_BALANCE) {
      setError(
        `Insufficient balance. You can withdraw up to $${CURRENT_BALANCE.toLocaleString()}.`,
      );
      return;
    }
    if (!bankAccount || !ifscCode) {
      setError("Please fill in all bank details.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto my-8 p-8 bg-white rounded-xl shadow-sm border border-slate-100 font-sans text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800">
          Withdrawal Requested Successfully!
        </h3>
        <p className="text-sm text-slate-600 mt-3 px-2">
          Your request for{" "}
          <span className="font-semibold text-slate-800">
            ${parseFloat(amount).toLocaleString()}
          </span>{" "}
          has been initiated.
        </p>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs font-medium text-amber-800">
          ⚠️ Your amount will credit in your account within 24-48hrs.
        </div>
        <button
          onClick={onCancel}
          className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-lg transition-colors"
        >
          Go Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-xl shadow-sm border border-slate-100 font-sans relative overflow-hidden">
      {isSubmitting && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-2">
          <div className="w-9 h-9 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-indigo-600 tracking-wide animate-pulse">
            Processing Request...
          </span>
        </div>
      )}

      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Withdraw Funds</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transfer funds securely to your bank account.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 text-sm p-1 rounded-md hover:bg-slate-50"
        >
          ✕
        </button>
      </div>

      {/* AVAILABLE BALANCE */}
      <div className="mb-4 p-3.5 bg-indigo-50/60 rounded-lg flex justify-between items-center text-sm border border-indigo-100/40">
        <span className="text-slate-600 font-medium">Available Balance</span>
        <span className="font-bold text-indigo-700">
          $
          {CURRENT_BALANCE.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </span>
      </div>

      {/* LIMITS GRID (2-Column Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {/* Limit 1 */}
        <div className="p-3.5 bg-yellow-50/60 rounded-lg flex justify-between items-center text-xs border border-yellow-100/40">
          <span className="text-slate-600 font-medium uppercase text-xs tracking-wider">
            Min Limit
          </span>
          <span className="font-bold text-yellow-700">
            $
            {MIN_WITHDRAWAL_AMOUNT.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* Limit 2 */}
        <div className="p-3.5 bg-green-50/60 rounded-lg flex justify-between items-center text-xs border border-green-100/40">
          <span className="text-green-600 font-medium uppercase text-xs tracking-wider">
            Max Limit
          </span>
          <span className="font-bold text-green-700">
            $
            {MAX_WITHDRAWAL_AMOUNT.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-xs font-medium">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 grid grid-cols-2 gap-4"
      >
        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Amount to Withdraw ($)
          </label>
          <input
            type="number"
            step="0.01"
            required
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
        </div>

        {/* Bank Account Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Bank Account Number
          </label>
          <input
            type="text"
            required
            placeholder="Enter account number"
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            disabled={useProfileAccount} // Disable field if autofilled
            className={`w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
              useProfileAccount
                ? "bg-slate-50 text-slate-500 cursor-not-allowed"
                : "text-slate-800"
            }`}
          />
        </div>

        {/* IFSC / Bank Routing Code */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            IFSC / Bank Routing Code
          </label>
          <input
            type="text"
            required
            placeholder="e.g. SBIN0001234"
            value={ifscCode}
            onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
            disabled={useProfileAccount} // Disable field if autofilled
            className={`w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase tracking-wider ${
              useProfileAccount
                ? "bg-slate-50 text-slate-500 cursor-not-allowed"
                : "text-slate-800"
            }`}
          />
        </div>

        {/* Account Holder Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Account Holder Name
          </label>
          <input
            type="text"
            required
            placeholder="ANAND RAJ"
            value={accountHolderName}
            onChange={(e) => setAccountHolderName(e.target.value.toUpperCase())}
            disabled={useProfileAccount} // Disable field if autofilled
            className={`w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase tracking-wider ${
              useProfileAccount
                ? "bg-slate-50 text-slate-500 cursor-not-allowed"
                : "text-slate-800"
            }`}
          />
        </div>

        <div className="border-t border-slate-100 pt-3 my-2">
          {/* AUTOFILL CHECKBOX CONTAINER */}
          <label className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={useProfileAccount}
              onChange={handleCheckboxChange}
              className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500/20 accent-indigo-600"
            />
            <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
              Use bank details registered in my profile
            </span>
          </label>
        </div>

        {/* Form Action Buttons */}
        <div className="flex gap-3 pt-2">
          {/* <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium text-sm rounded-lg border border-slate-200 transition-colors"
          >
            Cancel
          </button> */}
          <button
            type="submit"
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm shadow-indigo-600/10"
          >
            Confirm & Withdraw
          </button>
        </div>
      </form>
    </div>
  );
}
