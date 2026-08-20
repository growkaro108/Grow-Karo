import React, { use, useState } from "react";
import { X, ChevronDown, Phone, CreditCard } from "lucide-react";
import { userContext } from "@/context/UserContext";
import { addNominee, updateNominee } from "../../../../services/grahakService";

const RELATIONS = ["Spouse", "Parent", "Child", "Sibling", "Other"];

const formatAadhaar = (val) =>
  val
    .replace(/\D/g, "")
    .slice(0, 12)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

/**
 * Reusable "Add nominee" form.
 *
 * Renders as an inline panel (title + close button + fields + actions).
 * Handles its own validation and save call via userContext.AddNominee,
 * then reports back to the parent.
 *
 * Props:
 * - onSaved(nominee)  called with the newly created nominee after a successful save
 * - onCancel()        called when the user cancels/closes the form
 * - showHeader        whether to render the "New nominee" title + close button (default true)
 * - className         extra classes for the outer wrapper
 */
export default function AddNomineeForm({
  onSaved,
  onCancel,
  showHeader = true,
  className = "",
  nominee = null,
}) {
  const { authUser, FetchNominees } = use(userContext);

  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(nominee?.nomineeId);
  const [form, setForm] = useState({
    name: nominee?.name || "",
    relation: nominee?.relation || "",
    phone: nominee?.mobileNo || "",
    aadhaar: nominee?.aadharNo ? formatAadhaar(nominee.aadharNo) : "",
  });
  const [errors, setErrors] = useState({});

  const updateForm = (field) => (e) => {
    let value = e.target.value;
    if (field === "phone") value = value.replace(/\D/g, "").slice(0, 10);
    if (field === "aadhaar") value = formatAadhaar(value);
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const validateForm = () => {
    const err = {};
    if (!form.name.trim()) err.name = "Name is required";
    if (!form.relation) err.relation = "Select a relation";
    if (!/^[6-9]\d{9}$/.test(form.phone))
      err.phone = "Enter a valid 10-digit number";
    if (!/^\d{4}\s\d{4}\s\d{4}$/.test(form.aadhaar))
      err.aadhaar = "Enter a valid 12-digit Aadhaar";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        userId: authUser?.id || "",
        name: form.name.trim(),
        relation: form.relation,
        phone: form.phone,
        aadhaarNo: form.aadhaar.replace(/\s/g, ""),
      };
      const savedNominee = isEditing
        ? await updateNominee(authUser?.id, nominee.nomineeId, payload)
        : await addNominee(payload);
      if (!savedNominee) {
        setErrors((err) => ({
          ...err,
          submit: "Couldn't save nominee. Try again.",
        }));
        return;
      }
      await FetchNominees?.();
      setForm({ name: "", relation: "", phone: "", aadhaar: "" });
      onSaved?.(savedNominee);
    } catch (e) {
      setErrors((err) => ({
        ...err,
        submit: "Couldn't save nominee. Try again.",
      }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border border-indigo-100 ${className}`}
      style={{ backgroundColor: "#f8fafc" }}
    >
      {showHeader && (
        <div className="flex items-center justify-between mb-3">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "#4f46e5" }}
          >
            {isEditing ? "Edit nominee" : "New nominee"}
          </p>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Cancel add nominee"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label
            htmlFor="nominee-name"
            className="text-xs font-medium"
            style={{ color: "#475569" }}
          >
            Full name
          </label>
          <input
            type="text"
            id="nominee-name"
            value={form.name}
            onChange={updateForm("name")}
            placeholder="e.g. Priya Sharma"
            className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? "border-red-300" : "border-slate-200"}`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="nominee-relation"
            className="text-xs font-medium"
            style={{ color: "#475569" }}
          >
            Relation
          </label>
          <div className="relative mt-1">
            <select
              id="nominee-relation"
              value={form.relation}
              onChange={updateForm("relation")}
              className={`w-full appearance-none px-3 py-2 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.relation ? "border-red-300" : "border-slate-200"}`}
            >
              <option value="" disabled>
                Select relation
              </option>
              {RELATIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "#94a3b8" }}
            />
          </div>
          {errors.relation && (
            <p className="mt-1 text-xs text-red-500">{errors.relation}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="nominee-phone"
            className="text-xs font-medium"
            style={{ color: "#475569" }}
          >
            Phone number
          </label>
          <div className="relative mt-1">
            <Phone
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "#94a3b8" }}
            />
            <input
              type="tel"
              id="nominee-phone"
              inputMode="numeric"
              value={form.phone}
              onChange={updateForm("phone")}
              placeholder="10-digit mobile number"
              className={`w-full pl-8 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.phone ? "border-red-300" : "border-slate-200"}`}
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="nominee-aadhaar"
            className="text-xs font-medium"
            style={{ color: "#475569" }}
          >
            Aadhaar number
          </label>
          <div className="relative mt-1">
            <CreditCard
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "#94a3b8" }}
            />
            <input
              type="text"
              id="nominee-aadhaar"
              inputMode="numeric"
              value={form.aadhaar}
              onChange={updateForm("aadhaar")}
              placeholder="XXXX XXXX XXXX"
              className={`w-full pl-8 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.aadhaar ? "border-red-300" : "border-slate-200"}`}
            />
          </div>
          {errors.aadhaar && (
            <p className="mt-1 text-xs text-red-500">{errors.aadhaar}</p>
          )}
        </div>

        {errors.submit && (
          <p className="text-xs text-red-500">{errors.submit}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-60"
            style={{ backgroundColor: "#4f46e5" }}
          >
            {saving && (
              <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {saving
              ? "Saving..."
              : isEditing
                ? "Update nominee"
                : "Save nominee"}
          </button>
        </div>
      </div>
    </div>
  );
}
