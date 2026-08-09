import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useRemitterTrackers } from "./useRemitterTrackers";
import {
  validateAndSanitizeForm,
  EMPTY_REMITTER_FORM,
} from "./remitterValidation";
import { RemitterTrackerCard } from "./RemitterTrackerCard";

import { SuccessBanner } from "./SuccessBanner";
import { RemitterFormModal } from "./RemitterFormModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

export default function AdminRemitterTrackersTab() {
  const {
    codes,
    isLoadingCodes,
    createTracker,
    updateTracker,
    removeTracker,
    sendCredentialEmail,
  } = useRemitterTrackers();

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = create mode
  const [formData, setFormData] = useState(EMPTY_REMITTER_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [successPayload, setSuccessPayload] = useState(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(EMPTY_REMITTER_FORM);
    setFormErrors({});
    setSuccessPayload(null);
    setIsFormOpen(true);
  };

  // NOTE: dummy/list records don't carry email/phone/aadhar/PAN (not shown on
  // the card), so those fields start blank in edit mode. A real API response
  // for a single tracker should include them for a fully pre-filled form.
  const openEditForm = (tracker) => {
    setEditingId(tracker.id);
    setFormData({
      remitterName: tracker.owner || "",
      remitterEmail: tracker.remitterEmail || "",
      remitterPhone: tracker.remitterPhone || "",
      trackerCode: tracker.code || "",
      allocationLimit: tracker.goal ?? "",
      aadharNumber: tracker.aadharNumber || "",
      panNumber: tracker.panNumber || "",
    });
    setFormErrors({});
    setSuccessPayload(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const result = validateAndSanitizeForm(formData);

    if (!result.isValid) {
      setFormErrors(result.errors);
      return;
    }
    setFormErrors({});

    if (editingId) {
      await updateTracker(editingId, result.data);
      closeForm();
      setFormData(EMPTY_REMITTER_FORM);
      return;
    }

    const mockServerResponse = await createTracker(result.data);
    setSuccessPayload(mockServerResponse);
    closeForm();
    setFormData(EMPTY_REMITTER_FORM);
  };

  const handleSendCredentialEmail = async () => {
    if (!successPayload) return;
    await sendCredentialEmail(successPayload.loginId);
    setSuccessPayload((prev) => ({ ...prev, emailSent: true }));
  };

  const confirmRemoveTracker = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await removeTracker(deleteTarget.id);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* CONTROL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 font-body">
            Remitter Performance Trackers
          </h2>
          <p className="text-xs text-slate-400 font-body mt-0.5">
            Managing {codes.length} active allocation links assigned to
            authorized remitters.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 active:scale-[0.99] transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" /> Assign Remitter
        </button>
      </div>

      <SuccessBanner
        payload={successPayload}
        onClose={() => setSuccessPayload(null)}
        onSendEmail={handleSendCredentialEmail}
      />

      <RemitterFormModal
        isOpen={isFormOpen}
        isEditing={Boolean(editingId)}
        formData={formData}
        formErrors={formErrors}
        onChange={handleInputChange}
        onSubmit={handleSubmitForm}
        onClose={closeForm}
      />

      <DeleteConfirmModal
        target={deleteTarget}
        isDeleting={isDeleting}
        onCancel={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={confirmRemoveTracker}
      />

      {/* PERFORMANCE GRID */}
      {isLoadingCodes ? (
        <div className="text-xs text-slate-500 py-8 text-center">
          Loading trackers…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {codes.map((c) => (
            <RemitterTrackerCard
              key={c.id}
              tracker={c}
              onEdit={openEditForm}
              onRemove={setDeleteTarget}
            />
          ))}
        </div>
      )}
    </div>
  );
}
