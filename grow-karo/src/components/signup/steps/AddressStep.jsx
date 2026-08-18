import { TextField, SelectField } from "../formFields";

export default function AddressStep({
  formData,
  fieldErrors,
  handleInputChange,
  handleFieldBlur,
  INDIAN_STATES,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <TextField
        label="Street address"
        field="street"
        value={formData.street}
        onChange={handleInputChange}
        onBlur={handleFieldBlur}
        error={fieldErrors.street}
        required
        placeholder="House no., street, landmark"
        className="col-span-1 sm:col-span-2"
        autoFocus
      />
      <TextField
        label="Village / town"
        field="village"
        value={formData.village}
        onChange={handleInputChange}
        onBlur={handleFieldBlur}
        error={fieldErrors.village}
        required
        placeholder="Sabaur"
      />
      <TextField
        label="City"
        field="city"
        value={formData.city}
        onChange={handleInputChange}
        onBlur={handleFieldBlur}
        error={fieldErrors.city}
        required
        placeholder="Bhagalpur"
      />
      <SelectField
        label="State"
        field="state"
        value={formData.state}
        onChange={handleInputChange}
        onBlur={handleFieldBlur}
        error={fieldErrors.state}
        required
        options={INDIAN_STATES}
      />
      <TextField
        label="Pincode"
        field="pincode"
        value={formData.pincode}
        onChange={(field, v) =>
          handleInputChange(field, v.replace(/\D/g, "").slice(0, 6))
        }
        onBlur={handleFieldBlur}
        error={fieldErrors.pincode}
        required
        placeholder="812001"
        inputClassName="font-mono tracking-wider"
      />
    </div>
  );
}
