import React from "react";
import BankSelect from "@/components/BankSelect";
import FieldError from "./FieldError";

export default function BankDetailsSettings({ profile, inputClass, errors, touched, onChange, onBlur, fieldError }) {
  return (
    <div className="space-y-6 transition-all duration-500 ease-out animate-[fadeIn_0.5s_ease-out]">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs">
        <strong>Notice:</strong> Please ensure bank details match your official proof documents to avoid verification delays.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BankSelect value={profile.bankName} onChange={onChange} onBlur={onBlur} error={fieldError("bankName")} />
        <div>
          <label htmlFor="settings-account-holder" className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
          <input id="settings-account-holder" type="text" name="accountHolderName" value={profile.accountHolderName} onChange={onChange} onBlur={onBlur} maxLength={50} className={inputClass("accountHolderName")} />
          <FieldError name="accountHolderName" errors={errors} touched={touched} />
        </div>
        <div>
          <label htmlFor="settings-account-number" className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
          <input id="settings-account-number" type="text" name="accountNumber" inputMode="numeric" value={profile.accountNumber} onChange={onChange} onBlur={onBlur} placeholder="e.g., 123456789012" maxLength={18} className={inputClass("accountNumber")} />
          <FieldError name="accountNumber" errors={errors} touched={touched} />
        </div>
        <div>
          <label htmlFor="settings-ifsc" className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
          <input id="settings-ifsc" type="text" name="ifscCode" value={profile.ifscCode} onChange={onChange} onBlur={onBlur} placeholder="SBIN0001234" maxLength={11} className={`${inputClass("ifscCode")} uppercase`} />
          <FieldError name="ifscCode" errors={errors} touched={touched} />
        </div>
      </div>
    </div>
  );
}
