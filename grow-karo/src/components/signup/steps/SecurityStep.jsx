import { TextField } from "../formFields";

export default function SecurityStep({
  formData,
  fieldErrors,
  handleInputChange,
  handleFieldBlur,
  showPassword,
  setShowPassword,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <TextField
        label="Password"
        field="password"
        type={showPassword ? "text" : "password"}
        value={formData.password}
        onChange={handleInputChange}
        onBlur={handleFieldBlur}
        error={fieldErrors.password}
        required
        placeholder="••••••••"
        autoFocus
      />
      <TextField
        label="Confirm password"
        field="confirmPassword"
        type={showPassword ? "text" : "password"}
        value={formData.confirmPassword}
        onChange={handleInputChange}
        onBlur={handleFieldBlur}
        error={fieldErrors.confirmPassword}
        required
        placeholder="••••••••"
      />
      <div className="flex items-center space-x-2 py-1 col-span-1 sm:col-span-2">
        <input
          type="checkbox"
          id="showPassword"
          checked={showPassword}
          onChange={(e) => setShowPassword(e.target.checked)}
          className="w-4 h-4 rounded text-blue-600 border-slate-200 focus:ring-blue-500 cursor-pointer"
        />
        <label
          htmlFor="showPassword"
          className="text-xs text-slate-600 font-medium cursor-pointer select-none"
        >
          Show password
        </label>
      </div>
    </div>
  );
}
