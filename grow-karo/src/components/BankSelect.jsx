import React, { useState, useRef, useEffect } from "react";
import { INDIAN_BANKS } from "@/app/utils/constant";

// Simple text sanitizer local to this component
function sanitizeText(value, { maxLength = 60 } = {}) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trimStart()
    .slice(0, maxLength);
}

export default function BankSelect({
  value = "",
  onChange,
  onBlur,
  error = "",
  label = "Bank Name",
  placeholder = "Search your bank...",
  disabled = false,
}) {
  const [bankQuery, setBankQuery] = useState(value);
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const bankFieldRef = useRef(null);

  // Filter banks based on search query
  const filteredBanks = INDIAN_BANKS.filter((bank) =>
    bank.toLowerCase().includes(bankQuery.trim().toLowerCase()),
  );

  // Sync internal search input with external value prop
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBankQuery(value || "");
  }, [value]);

  // Close dropdown on outside click and reset query
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bankFieldRef.current && !bankFieldRef.current.contains(e.target)) {
        setBankDropdownOpen(false);
        setBankQuery(value || "");
        if (onBlur) {
          onBlur({ target: { name: "bankName", value } });
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, onBlur]);

  const selectBank = (bankName) => {
    setBankQuery(bankName);
    setBankDropdownOpen(false);
    if (onChange) {
      onChange({ target: { name: "bankName", value: bankName } });
    }
  };

  const inputClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
    error
      ? "border-red-400 focus:ring-red-400"
      : "border-gray-300 focus:ring-indigo-500"
  } ${disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`;

  return (
    <div ref={bankFieldRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        type="text"
        name="bankName"
        role="combobox"
        aria-expanded={bankDropdownOpen}
        aria-autocomplete="list"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={bankQuery}
        onFocus={() => !disabled && setBankDropdownOpen(true)}
        onChange={(e) => {
          const sanitized = sanitizeText(e.target.value, { maxLength: 60 });
          setBankQuery(sanitized);
          setBankDropdownOpen(true);
        }}
        className={inputClass}
      />

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      {bankDropdownOpen && !disabled && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg text-sm"
        >
          {filteredBanks.length > 0 ? (
            filteredBanks.map((bank) => (
              <li
                key={bank}
                role="option"
                aria-selected={value === bank}
                onClick={() => selectBank(bank)}
                className={`px-3 py-2 cursor-pointer hover:bg-indigo-50 ${
                  value === bank
                    ? "bg-indigo-50 text-indigo-600 font-medium"
                    : "text-gray-700"
                }`}
              >
                {bank}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-gray-400">No matching bank found</li>
          )}
        </ul>
      )}
    </div>
  );
}
