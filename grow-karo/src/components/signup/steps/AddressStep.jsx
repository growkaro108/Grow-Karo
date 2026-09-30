import { FieldShell, fieldBaseClass, fieldStateClass } from "../formFields";

export default function AddressStep({
  formData,
  fieldErrors,
  handleInputChange,
  handleFieldBlur,
}) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <FieldShell label="Address" required error={fieldErrors.address}>
        <textarea
          value={formData.address}
          onChange={(event) => handleInputChange("address", event.target.value)}
          onBlur={() => handleFieldBlur("address")}
          placeholder="House or building, street, village or town, city, state, pincode"
          maxLength={200}
          rows={4}
          className={`${fieldBaseClass} h-auto min-h-28 resize-y py-3 ${fieldStateClass(!!fieldErrors.address)}`}
        />
      </FieldShell>
    </div>
  );
}
