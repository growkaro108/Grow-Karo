import { useState, useEffect } from "react";
import { X, UploadCloud, FileText } from "lucide-react";
import { AddBond } from "../../../../../../../services/malikService";
import { allRounderMessage } from "@/components/Message";

export default function AddBondModal({
  selectedRequest,
  onClose,
  onSuccess,
  showToast,
}) {
  const [bondNumber, setBondNumber] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

  // Revoke object URL on unmount or when preview changes to avoid memory leaks
  useEffect(() => {
    return () => {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  if (!selectedRequest) return null;

  const handleClose = () => {
    if (submitting) return; // Guard against closing mid-submit
    setBondNumber("");
    setFile(null);
    setPreview(null);
    onClose();
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];

    if (!selected) return;

    // 1. File Size Validation (5MB limit)
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      showToast(
        "error",
        "File size exceeds the 5MB limit. Please choose a smaller image.",
      );
      e.target.value = ""; // Clear input so re-selection works
      return;
    }

    // 2. Revoke previous preview URL before setting new one
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }

    // 3. Set Single File State
    setFile(selected);
    setPreview({
      name: selected.name,
      url: URL.createObjectURL(selected),
    });
  };

  const removeFile = () => {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = async () => {
    if (!bondNumber.trim() && !file) {
      showToast("error", "Enter a bond number or select an image.");
      return;
    }

    const formData = new FormData();
    if (bondNumber.trim()) {
      formData.append("bondNumber", bondNumber.trim());
    }
    if (file) {
      // Key name "image" matches @RequestParam MultipartFile image in Spring Controller
      formData.append("image", file);
    }

    try {
      setSubmitting(true);
      const response = await AddBond(selectedRequest.userSchemeId, formData);

      allRounderMessage(response);

      if (response?.status !== "success") {
        showToast("error", response?.message ?? "Failed to add bond details.");
        return;
      }

      showToast("success", "Bond details added successfully.");
      onSuccess?.(response?.data);

      // Reset form state
      setBondNumber("");
      setFile(null);
      setPreview(null);
      onClose();
    } catch (error) {
      console.error("Add bond details failed:", error);
      showToast("error", "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sea-overlay">
      <div className="sea-modal">
        <div className="sea-header">
          <div>
            <h2 className="sea-modal-title">Add bond details</h2>
            <p className="sea-subtitle">
              {selectedRequest.name} &middot; {selectedRequest.schemeName}
            </p>
          </div>
        </div>

        <div className="sea-modal-body">
          <div className="sea-field">
            <label htmlFor="bondNumber" className="sea-field-label">
              Bond number
            </label>
            <input
              id="bondNumber"
              type="text"
              className="sea-input"
              value={bondNumber}
              onChange={(e) => setBondNumber(e.target.value)}
              placeholder="e.g. BND-2026-00417"
              disabled={submitting}
            />
          </div>

          <div className="sea-field">
            <label className="sea-field-label">Bond image</label>
            <label
              htmlFor="bondImage"
              className={`sea-dropzone ${submitting ? "sea-dropzone-disabled" : ""}`}
            >
              <UploadCloud size={20} />
              <span>
                Click to select an image, or drag it here <br />
                Only .jpeg, .png, .jpg, .webp allowed <br />
                Max size: 5MB
              </span>
              <input
                id="bondImage"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleFileChange}
                disabled={submitting}
                hidden
              />
            </label>

            {preview && (
              <div className="sea-file-grid">
                <div className="sea-file-chip">
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="sea-file-thumb"
                  />
                  <span className="sea-file-name" title={preview.name}>
                    <FileText size={12} /> {preview.name}
                  </span>
                  <button
                    type="button"
                    className="sea-file-remove"
                    onClick={removeFile}
                    disabled={submitting}
                    aria-label={`Remove ${preview.name}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sea-modal-actions">
          <button
            className="sea-btn sea-btn-ghost"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="sea-btn sea-btn-approve"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Saving…" : "Save bond details"}
          </button>
        </div>
      </div>
    </div>
  );
}
