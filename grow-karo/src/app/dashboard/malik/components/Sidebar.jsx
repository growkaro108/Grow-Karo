import { ShieldCheck, X } from "lucide-react";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: () => null },
  { id: "activity", label: "Activity Log", icon: () => null },
  { id: "withdrawals", label: "Withdrawals", icon: () => null },
  { id: "issues", label: "User Issues", icon: () => null },
  { id: "codes", label: "Fundraiser Codes", icon: () => null },
  { id: "contacts", label: "Team Contacts", icon: () => null },
  { id: "settings", label: "Settings", icon: () => null },
];

export default function Sidebar({ active, onNavigate, counts, mobileOpen, onCloseMobile, navItems }) {
  const items = navItems ?? NAV_ITEMS;

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/30">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <p className="font-display text-base font-semibold text-slate-100 leading-none">Vantage</p>
          <p className="text-[11px] text-slate-500 font-body">Admin Console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const isActive = active === item.id;
          const count = counts[item.id];
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onCloseMobile?.();
              }}
              className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium font-body transition-colors duration-200 ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-3">
                <item.icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                {item.label}
              </span>
              {!!count && (
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-mono ${isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mx-3 mb-5 rounded-xl border border-slate-800 bg-slate-800/40 p-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-200 font-mono">AD</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-200 font-body">Admin User</p>
            <p className="truncate text-xs text-slate-500 font-body">superadmin@vantage.io</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-slate-800 md:bg-slate-900/40">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="animate-drawer-slide relative flex h-full w-72 flex-col bg-slate-900 shadow-2xl">
            <button onClick={onCloseMobile} className="absolute right-4 top-5 text-slate-400 hover:text-slate-200">
              <X className="h-5 w-5" />
            </button>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
