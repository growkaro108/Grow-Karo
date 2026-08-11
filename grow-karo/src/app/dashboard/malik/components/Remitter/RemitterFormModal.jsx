import React from "react";
import { X } from "lucide-react";

export function RemitterFormModal({
  isOpen,
  isEditing,
  formData,
  formErrors,
  onChange,
  onSubmit,
  onClose,
}) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-all duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl transition-all duration-300 transform ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              {isEditing
                ? "Update Remitter Rail"
                : "Setup Authorized Remitter Rail"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditing
                ? "Modify access rights and disbursement details."
                : "Configure access rights and disbursement tracking nodes."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 bg-slate-800 p-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <hr className="border-slate-800" />

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1.5">
              Remitter Organization Name
            </label>
            <input
              type="text"
              name="organizationName"
              required
              placeholder="e.g. Neha Payments Ltd"
              value={formData.organizationName}
              onChange={onChange}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 transition-colors"
            />
            {formErrors.organizationName && (
              <p className="text-rose-500 text-[11px] mt-1">
                {formErrors.organizationName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">
                Remitter Email
              </label>
              <input
                type="email"
                name="remitterEmail"
                required
                placeholder="e.g. neha@payments.com"
                value={formData.remitterEmail}
                onChange={onChange}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 transition-colors"
              />
              {formErrors.remitterEmail && (
                <p className="text-rose-500 text-[11px] mt-1">
                  {formErrors.remitterEmail}
                </p>
              )}
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">
                Remitter Phone
              </label>
              <input
                type="tel"
                name="remitterPhone"
                required
                maxLength={10}
                placeholder="e.g. 9876543210"
                value={formData.remitterPhone}
                onChange={onChange}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 transition-colors"
              />
              {formErrors.remitterPhone && (
                <p className="text-rose-500 text-[11px] mt-1">
                  {formErrors.remitterPhone}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">
              Status
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() =>
                  onChange({ target: { name: "status", value: true } })
                }
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  formData.status === true
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({ target: { name: "status", value: false } })
                }
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  formData.status === false
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Inactive
              </button>
            </div>
            {formErrors.status && (
              <p className="text-rose-500 text-[11px] mt-1">
                {formErrors.status}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">
                Allocation Limit (INR)
              </label>
              <input
                type="number"
                name="allocationLimit"
                required
                placeholder="100000"
                value={formData.allocationLimit}
                onChange={onChange}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 transition-colors"
              />
              {formErrors.allocationLimit && (
                <p className="text-rose-500 text-[11px] mt-1">
                  {formErrors.allocationLimit}
                </p>
              )}
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">
                Aadhar Number
              </label>
              <input
                type="text"
                name="aadharNumber"
                required
                maxLength={12}
                placeholder="e.g. 123456789012"
                value={formData.aadharNumber}
                onChange={onChange}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 font-mono tracking-wider outline-none focus:border-emerald-500 transition-colors"
              />
              {formErrors.aadharNumber && (
                <p className="text-rose-500 text-[11px] mt-1">
                  {formErrors.aadharNumber}
                </p>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-slate-400 font-medium mb-1.5">
                PAN Number
              </label>
              <input
                type="text"
                name="panNumber"
                required
                maxLength={10}
                placeholder="e.g. ABCDE1234F"
                value={formData.panNumber}
                onChange={onChange}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 transition-colors"
              />
              {formErrors.panNumber && (
                <p className="text-rose-500 text-[11px] mt-1">
                  {formErrors.panNumber}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 border border-slate-800 text-slate-300 font-semibold rounded-xl hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 shadow-md active:scale-[0.99] transition-all"
            >
              {isEditing ? "Save Changes" : "Onboard & Generate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
