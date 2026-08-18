import { TextField, SelectField } from "../formFields";

export default function NomineeStep({
  formData,
  fieldErrors,
  handleInputChange,
  handleFieldBlur,
  RELATION_OPTIONS,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <TextField
        label="Nominee name"
        field="nomineeName"
        value={formData.nomineeName}
        onChange={handleInputChange}
        onBlur={handleFieldBlur}
        error={fieldErrors.nomineeName}
        required
        placeholder="Jane Doe"
        autoFocus
      />
      <SelectField
        label="Relation with nominee"
        field="nomineeRelation"
        value={formData.nomineeRelation}
        onChange={handleInputChange}
        onBlur={handleFieldBlur}
        error={fieldErrors.nomineeRelation}
        required
        options={RELATION_OPTIONS}
      />
      <TextField
        label="Nominee Aadhaar number"
        field="nomineeAadhar"
        value={formData.nomineeAadhar}
        onChange={(field, v) =>
          handleInputChange(field, v.replace(/\D/g, "").slice(0, 12))
        }
        onBlur={handleFieldBlur}
        error={fieldErrors.nomineeAadhar}
        required
        placeholder="XXXX XXXX XXXX"
        maxLength={12}
        inputClassName="font-mono tracking-wider"
      />
      <TextField
        label="Nominee mobile number"
        field="nomineeMobile"
        type="tel"
        value={formData.nomineeMobile}
        onChange={handleInputChange}
        onBlur={handleFieldBlur}
        error={fieldErrors.nomineeMobile}
        required
        placeholder="+91 987-654-3210"
      />
    </div>
  );
}
