import { FieldShell, TextField } from "../formFields";

export default function BankStep({
  formData,
  fieldErrors,
  handleInputChange,
  handleFieldBlur,
  showAccountDetails,
  setShowAccountDetails,
  BankSelect,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="col-span-1 sm:col-span-2 flex items-center space-x-2 pb-1">
        <input
          type="checkbox"
          id="toggleAccount"
          checked={showAccountDetails}
          onChange={(e) => setShowAccountDetails(e.target.checked)}
          className="w-4 h-4 rounded text-blue-600 border-slate-200 focus:ring-blue-500 cursor-pointer"
        />
        <label
          htmlFor="toggleAccount"
          className="text-xs text-slate-600 font-medium cursor-pointer select-none"
        >
          Add bank account details now
        </label>
      </div>

      {showAccountDetails && (
        <>
          <FieldShell label="Bank" required error={fieldErrors.bankName}>
            <BankSelect
              value={formData.bankName}
              onChange={(e) => handleInputChange("bankName", e.target.value)}
            />
          </FieldShell>
          <TextField
            label="Account holder name"
            field="holderName"
            value={formData.holderName}
            onChange={handleInputChange}
            onBlur={handleFieldBlur}
            error={fieldErrors.holderName}
            required
            placeholder="John Doe"
          />
          <TextField
            label="Account number"
            field="accountNumber"
            value={formData.accountNumber}
            onChange={(field, v) => handleInputChange(field, v.replace(/\D/g, ""))}
            onBlur={handleFieldBlur}
            error={fieldErrors.accountNumber}
            required
            placeholder="1234567890"
            inputClassName="font-mono tracking-wider"
          />
          <TextField
            label="IFSC code"
            field="ifscCode"
            value={formData.ifscCode}
            onChange={(field, v) => handleInputChange(field, v.toUpperCase())}
            onBlur={handleFieldBlur}
            error={fieldErrors.ifscCode}
            required
            placeholder="SBIN0001234"
            inputClassName="font-mono tracking-wider"
          />
        </>
      )}

      {!showAccountDetails && (
        <p className="col-span-1 sm:col-span-2 text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-xl p-3">
          You can skip this and add your bank account later from your profile.
        </p>
      )}
    </div>
  );
}
