import React from "react";
import FieldError from "./FieldError";

export default function SecuritySettings({ profile, inputClass, errors, touched, onChange, onBlur, fieldError }) {
  return (
    <div className="space-y-6 transition-all duration-500 ease-out animate-[fadeIn_0.5s_ease-out]">
      <div className="grid grid-cols-1 gap-4 max-w-md">
        <div>
          <label htmlFor="settings-current-password" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
          <input id="settings-current-password" type="password" name="currentPassword" placeholder="********" value={profile.currentPassword} onChange={onChange} onBlur={onBlur} autoComplete="current-password" maxLength={64} className={inputClass("currentPassword")} />
          <FieldError name="currentPassword" errors={errors} touched={touched} />
        </div>
        <div>
          <label htmlFor="settings-new-password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input id="settings-new-password" type="password" name="newPassword" placeholder="********" value={profile.newPassword} onChange={onChange} onBlur={onBlur} autoComplete="new-password" maxLength={64} className={inputClass("newPassword")} />
          <FieldError name="newPassword" errors={errors} touched={touched} />
          {!fieldError("newPassword") && <p className="text-xs text-gray-400 mt-1">Min 8 characters, with uppercase, lowercase, number & special character.</p>}
        </div>
        <div>
          <label htmlFor="settings-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input id="settings-confirm-password" type="password" name="confirmPassword" placeholder="********" value={profile.confirmPassword} onChange={onChange} onBlur={onBlur} autoComplete="new-password" maxLength={64} className={inputClass("confirmPassword")} />
          <FieldError name="confirmPassword" errors={errors} touched={touched} />
        </div>
      </div>
    </div>
  );
}
