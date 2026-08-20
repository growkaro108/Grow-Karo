import React from "react";

function NotificationToggle({ name, title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
      <div>
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" />
    </div>
  );
}

export default function NotificationSettings({ profile, onChange }) {
  return (
    <div className="space-y-6 transition-all duration-500 ease-out animate-[fadeIn_0.5s_ease-out]">
      <NotificationToggle name="schemeAlerts" title="Scheme Alerts" description="Get instant push updates when new scheme included." checked={profile.schemeAlerts} onChange={onChange} />
      <NotificationToggle name="securityAlerts" title="Security & Login Notifications" description="Get notified immediately whenever a new login device session is detected." checked={profile.securityAlerts} onChange={onChange} />
    </div>
  );
}
