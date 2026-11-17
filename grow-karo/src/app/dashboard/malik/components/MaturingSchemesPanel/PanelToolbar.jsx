import { Search } from "lucide-react";

export default function PanelToolbar({ searchTerm, onSearchTermChange, children }) {
  return (
    <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-md backdrop-blur-sm md:flex-row">
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search by user, scheme, or bond #..."
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800/80 py-2 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {children}
    </div>
  );
}
