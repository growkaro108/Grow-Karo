import React from "react";
import { initials } from "../../malik/components/SchemeAproval/components/constants";
import FieldError from "./FieldError";

export default function ProfileSettings({ authUser, profile, inputClass, errors, touched, onChange, onBlur }) {
  return (
    <div className="space-y-6 transition-all duration-500 ease-out animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col items-center justify-center text-center mb-6">
        <div className="w-24 h-24 bg-linear-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
          {initials(authUser?.name)}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="settings-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input id="settings-name" type="text" name="name" value={profile.name} onChange={onChange} onBlur={onBlur} maxLength={50} autoComplete="name" className={inputClass("name")} />
          <FieldError name="name" errors={errors} touched={touched} />
        </div>
        <div>
          <label htmlFor="settings-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input id="settings-phone" type="tel" name="phone" inputMode="numeric" value={profile.phone} onChange={onChange} onBlur={onBlur} maxLength={10} autoComplete="tel" className={inputClass("phone")} />
          <FieldError name="phone" errors={errors} touched={touched} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="settings-email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input id="settings-email" type="email" name="email" value={profile.email} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed" disabled readOnly />
        </div>
      </div>
    </div>
  );
}
