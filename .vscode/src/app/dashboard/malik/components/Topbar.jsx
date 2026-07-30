import { Search, Bell, Menu } from "lucide-react";
import NotificationDropdown from "./Notifications";
import { useEffect, useRef, useState } from "react";
import ProfileDropdown from "./ProfileDropdown";

export default function Topbar({ title, onMenuClick }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  // Close dropdowns when clicking anywhere outside of them
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/80 px-4 py-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-semibold text-slate-100 sm:text-xl">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 sm:flex">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            placeholder="Search users, IDs…"
            className="w-40 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none font-body lg:w-56"
          />
        </div>
        {/* 1. Bell Icon Trigger Node */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false); // Close other open menus
            }}
            className={`p-2 rounded-xl border transition-all relative ${
              showNotifications
                ? "bg-slate-800 text-teal-400 border-slate-700"
                : "bg-slate-900/50 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Bell className="h-5 w-5" />

            {/* Live Ping Pulse Dot */}
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          </button>

          {/* Notification Menu Slide Overlay */}
          <div
            className={`absolute right-0 top-full mt-2 transition-all duration-300 origin-top-right ${
              showNotifications
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            <NotificationDropdown />
          </div>
        </div>

        {/* 2. Avatar Profile Trigger Node */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false); // Close other open menus
            }}
            className={`h-9 w-9 rounded-xl font-bold text-xs transition-all border flex items-center justify-center ${
              showProfile
                ? "bg-slate-800 text-teal-400 border-slate-700 ring-2 ring-teal-500/20"
                : "bg-teal-500/10 text-teal-400 border-teal-500/20 hover:bg-teal-500/20"
            }`}
          >
            AD
          </button>

          {/* Profile Menu Slide Overlay */}
          <div
            className={`absolute right-0 top-full mt-2 transition-all duration-300 origin-top-right ${
              showProfile
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
