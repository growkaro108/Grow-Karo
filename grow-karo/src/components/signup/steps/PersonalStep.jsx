import { TextField, SelectField } from "../formFields";

const MIN_AGE_YEARS = 18;

export default function PersonalStep({
  formData,
  fieldErrors,
  handleInputChange,
  handleFieldBlur,
  MARITAL_STATUS_OPTIONS,
  RELATION_OPTIONS,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <TextField
        label="First name"
        field="name"
        value={formData.name}
        onChange={handleInputChange}
        onBlur={handleFieldBlur}
        error={fieldErrors.name}
        required
        placeholder="John"
        autoFocus
      />
      <TextField
        label="Phone number"
        field="phone"
        type="tel"
        value={formData.phone}
        onChange={handleInputChange}
        onBlur={handleFieldBlur}
        error={fieldErrors.phone}
        required
        placeholder="+91 987-704-5670"
      />
      <TextField
        label="Date of birth"
        field="dob"
        type="date"
        value={formData.dob}
        onChange={handleInputChange}
        onBlur={handleFieldBlur}
        error={fieldErrors.dob}
        required
        inputClassName="[color-scheme:light]"
        hint={`${MIN_AGE_YEARS}+ only`}
      />
      <SelectField
        label="Marital status"
        field="maritalStatus"
        value={formData.maritalStatus}
        onChange={handleInputChange}
        onBlur={handleFieldBlur}
        error={fieldErrors.maritalStatus}
        required
        options={MARITAL_STATUS_OPTIONS}
      />
      <TextField
        label="Aadhaar number"
        field="aadharNo"
        value={formData.aadharNo}
        onChange={(field, v) =>
          handleInputChange(field, v.replace(/\D/g, "").slice(0, 12))
        }
        onBlur={handleFieldBlur}
        error={fieldErrors.aadharNo}
        required
        placeholder="XXXX XXXX XXXX"
        maxLength={12}
        inputClassName="font-mono tracking-wider"
      />
      <TextField
        label="Guardian name"
        field="guardianName"
        value={formData.guardianName}
        onChange={handleInputChange}
        onBlur={handleFieldBlur}
        error={fieldErrors.guardianName}
        placeholder="If applicable"
        hint="Optional"
      />
      <SelectField
        label="Guardian relation"
        field="guardianRelation"
        value={formData.guardianRelation}
        onChange={handleInputChange}
        onBlur={handleFieldBlur}
        error={fieldErrors.guardianRelation}
        disabled={!formData.guardianName.trim()}
        options={RELATION_OPTIONS}
      />
    </div>
  );
}
