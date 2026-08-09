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
              Remitter Entity Name
            </label>
            <input
              type="text"
              name="remitterName"
              required
              placeholder="e.g. Neha Payments Ltd"
              value={formData.remitterName}
              onChange={onChange}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 transition-colors"
            />
            {formErrors.remitterName && (
              <p className="text-rose-500 text-[11px] mt-1">
                {formErrors.remitterName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">
              Official Communications Email
            </label>
            <input
              type="email"
              name="remitterEmail"
              required
              placeholder="name@remit-rail.com"
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
              Remitter Phone Number
            </label>
            <div className="relative rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 focus-within:border-emerald-500 transition-colors">
              <span className="absolute left-3.5 text-slate-500 font-medium select-none">
                +91
              </span>
              <input
                type="tel"
                name="remitterPhone"
                required
                placeholder="9876543210"
                value={formData.remitterPhone}
                onChange={onChange}
                className="w-full bg-transparent pl-8 text-slate-100 outline-none"
              />
            </div>
            {formErrors.remitterPhone && (
              <p className="text-rose-500 text-[11px] mt-1">
                {formErrors.remitterPhone}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">
                Unique Tracker Code
              </label>
              <input
                type="text"
                name="trackerCode"
                required
                placeholder="e.g. NEHA-BOOST"
                value={formData.trackerCode}
                onChange={onChange}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 uppercase font-mono tracking-wider outline-none focus:border-emerald-500 transition-colors"
              />
              {formErrors.trackerCode && (
                <p className="text-rose-500 text-[11px] mt-1">
                  {formErrors.trackerCode}
                </p>
              )}
            </div>
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
            <div>
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
