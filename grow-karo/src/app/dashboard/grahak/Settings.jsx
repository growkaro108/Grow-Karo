import { PenLineIcon } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

export default function SettingsComponent() {
  const [activeTab, setActiveTab] = useState("profile");

  // State for all form fields
  const [profile, setProfile] = useState({
    name: "Shri Ram",
    email: "investor@growkaro.com",
    phone: "+91 98765 43210",
  });

  const [bankDetails, setBankDetails] = useState({
    bankName: "State Bank of India",
    accountNumber: "5809765432431250",
    ifscCode: "SBI0006765",
    accountHolder: "Shri Ram",
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    enable2FA: false,
  });

  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    weeklyDigest: true,
    securityAlerts: true,
  });

  // Input handlers
  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleBankChange = (e) => {
    setBankDetails({ ...bankDetails, [e.target.name]: e.target.value });
  };

  const handleSecurityChange = (e) => {
    setSecurity({ ...security, [e.target.name]: e.target.value });
  };

  const handleNotificationChange = (e) => {
    setNotifications({ ...notifications, [e.target.name]: e.target.checked });
  };

  const handleSave = (e) => {
    e.preventDefault();
    alert(`${activeTab.toUpperCase()} settings saved successfully!`);
  };

  // Shared animation style for smooth mounting transition
  const tabContentClass =
    "space-y-6 transition-all duration-500 ease-out opacity-100 translate-y-0 animate-[fadeIn_0.5s_ease-out]";

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Dynamic Injecting Keyframe for Tailwind inline animation support */}
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Account Settings</h2>
        <p className="text-sm text-gray-500">
          Update your profile information, financial details, and preferences.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto space-x-2">
        {["profile", "bank details", "security", "notifications"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-4 font-medium text-sm capitalize border-b-2 whitespace-nowrap transition-all duration-300 ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content Forms */}
      <form onSubmit={handleSave}>
        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className={tabContentClass}>
            <div className="flex flex-col items-center justify-center text-center mb-6">
              {/* Avatar Container with Edit Pen Overlay */}
              <div className="relative group w-21 h-21 mb-1 cursor-pointer">
                <Image
                  src="/shriram.jpg"
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover border border-gray-100 shadow-sm"
                  height={64}
                  width={64}
                />
                {/* Pen Icon Overlay on Hover/Focus */}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                 <PenLineIcon className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Helper Action Buttons */}
              <div>
                
                <p className="text-xs text-gray-400 mt-0.5">
                  JPG or PNG. Max 2MB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                  disabled
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* BANK DETAILS TAB */}
        {activeTab === "bank details" && (
          <div className={tabContentClass}>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs">
              <strong>Notice:</strong> Please ensure bank details match your
              official proof documents to avoid verification delays.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  name="accountHolder"
                  value={bankDetails.accountHolder}
                  onChange={handleBankChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={bankDetails.bankName}
                  onChange={handleBankChange}
                  placeholder="e.g., State Bank of India"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={bankDetails.accountNumber}
                  onChange={handleBankChange}
                  placeholder="••••••••5432"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  value={bankDetails.ifscCode}
                  onChange={handleBankChange}
                  placeholder="SBIN0001234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm uppercase"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <div className={tabContentClass}>
            <div className="grid grid-cols-1 gap-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  placeholder="••••••••"
                  value={security.currentPassword}
                  onChange={handleSecurityChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="**********"
                  value={security.newPassword}
                  onChange={handleSecurityChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="**********"
                  value={security.confirmPassword}
                  onChange={handleSecurityChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between max-w-md">
              <div>
                <h4 className="text-sm font-medium text-gray-800">
                  Two-Factor Authentication (2FA)
                </h4>
                <p className="text-xs text-gray-500">
                  Secure your investments with an extra verification layer.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="enable2FA"
                  checked={security.enable2FA}
                  onChange={(e) =>
                    setSecurity({ ...security, enable2FA: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <div className={tabContentClass}>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Price Alerts
                </p>
                <p className="text-xs text-gray-500">
                  Get instant push updates when chosen assets hit target
                  execution values.
                </p>
              </div>
              <input
                type="checkbox"
                name="priceAlerts"
                checked={notifications.priceAlerts}
                onChange={handleNotificationChange}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Weekly Performance Digest
                </p>
                <p className="text-xs text-gray-500">
                  Receive a structured analytics breakdown of your portfolio
                  balance weekly.
                </p>
              </div>
              <input
                type="checkbox"
                name="weeklyDigest"
                checked={notifications.weeklyDigest}
                onChange={handleNotificationChange}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Security & Login Notifications
                </p>
                <p className="text-xs text-gray-500">
                  Get notified immediately whenever a new login device session
                  is detected.
                </p>
              </div>
              <input
                type="checkbox"
                name="securityAlerts"
                checked={notifications.securityAlerts}
                onChange={handleNotificationChange}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
              />
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
