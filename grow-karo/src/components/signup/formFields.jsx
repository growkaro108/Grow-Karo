export const fieldBaseClass =
  "w-full h-11 px-4 rounded-xl border bg-slate-50 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed";

export const fieldStateClass = (hasError) =>
  hasError
    ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
    : "border-slate-100 focus:border-slate-300 focus:ring-slate-100";

export function FieldShell({
  label,
  required,
  error,
  hint,
  children,
  className = "",
}) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between mb-1">
        <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {label}
          {required && <span className="text-rose-400 ml-0.5">*</span>}
        </label>
        {hint && !error && (
          <span className="text-[10px] text-slate-300">{hint}</span>
        )}
      </div>
      {children}
      {error && (
        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-rose-500" />
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  required,
  placeholder,
  type = "text",
  className = "",
  inputClassName = "",
  hint,
  maxLength,
  autoFocus,
}) {
  return (
    <FieldShell
      label={label}
      required={required}
      error={error}
      hint={hint}
      className={className}
    >
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        onBlur={() => onBlur(field)}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className={`${fieldBaseClass} ${fieldStateClass(!!error)} ${inputClassName}`}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  required,
  options,
  placeholder = "Select…",
  className = "",
}) {
  return (
    <FieldShell
      label={label}
      required={required}
      error={error}
      className={className}
    >
      <select
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        onBlur={() => onBlur(field)}
        disabled={disabled}
        className={`${fieldBaseClass} ${fieldStateClass(!!error)} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="%2394a3b8"><path d="M5.25 7.5L10 12.25L14.75 7.5H5.25Z"/></svg>')] bg-no-repeat bg-[right_0.9rem_center] pr-9`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
