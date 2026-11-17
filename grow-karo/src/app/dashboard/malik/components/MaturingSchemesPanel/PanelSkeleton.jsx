const PANEL_COLUMNS = {
  withdrawal: 7,
  profitDue: 6,
};

export function PanelContentSkeleton({ kind }) {
  const columnCount = PANEL_COLUMNS[kind];

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 md:block">
        <div
          className="grid gap-4 border-b border-slate-800 bg-slate-800/40 p-4"
          style={{
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: columnCount }, (_, index) => (
            <div key={index} className="h-3 animate-pulse rounded bg-slate-700" />
          ))}
        </div>
        {Array.from({ length: 5 }, (_, row) => (
          <div
            key={row}
            className="grid gap-4 border-b border-slate-800/60 p-4"
            style={{
              gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: columnCount }, (_, column) => (
              <div
                key={column}
                className={`h-4 animate-pulse rounded bg-slate-800 ${column === 0 ? "w-4/5" : "w-3/5"}`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="space-y-3 md:hidden">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4"
          >
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-700" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }, (_, field) => (
                <div key={field} className="h-8 animate-pulse rounded bg-slate-800" />
              ))}
            </div>
            <div className="h-8 animate-pulse rounded bg-slate-800" />
          </div>
        ))}
      </div>
    </>
  );
}

export default function PanelLoadingSkeleton({ kind }) {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading panel">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:flex-row md:items-center md:justify-between">
        <div className="h-10 w-full animate-pulse rounded-lg bg-slate-800 md:w-80" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-36 animate-pulse rounded-lg bg-slate-800" />
          {kind === "withdrawal" && (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-800" />
          )}
        </div>
      </div>
      <PanelContentSkeleton kind={kind} />
    </div>
  );
}
