const inputClass =
  "w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 [color-scheme:dark]";

export default function DailyDepositRows({
  rows = [],
  onChange,
  onAdd,
  onRemove,
}) {
  return (
    <details className="space-y-2 rounded-xl border border-teal-900/60 bg-teal-950/15 p-3">
      <summary className="cursor-pointer text-sm font-medium text-teal-300">
        Show Deposits Ledger
      </summary>
      <div className="h-64 space-y-2 overflow-x-auto scrollbar-thin scrollbar-thumb-teal-500 scrollbar-track-transparent pr-2">
        <div>
          {/* <p className="text-xs font-semibold text-teal-300">Daily deposits</p> */}
          <p className="mt-1 text-[11px] text-slate-500">
            Each deposit must meet the scheme minimum. Deposits on the same
            calendar day cannot total more than ₹2,000.
          </p>
        </div>
        <div className="grid grid-cols-[2rem_minmax(7rem,1fr)_minmax(7rem,1fr)_2rem] gap-1 px-1 text-[10px] text-slate-500">
        {/* <div className="grid grid-cols-4 text-slate-500 text-[11px] gap-1"> */}
          <span>No.</span>
          <span>Deposit date</span>
          <span className="ml-2">Amount (₹)</span>
          <span/>
        </div>
        {rows.map((row, index) => (
          <div
            key={row.id ?? index}
            // className="grid grid-cols-[2rem_minmax(7rem,1fr)_minmax(7rem,1fr)_2rem] items-center gap-2"
            className="grid grid-cols-10 items-center gap-2"
          >
            <span className="text-xs text-slate-500 grid-span-1">{index + 1}.</span>
            <input
              aria-label={`Deposit ${index + 1} date`}
              type="date"
              value={row.depositDate ?? ""}
              onChange={(event) =>
                onChange(index, "depositDate", event.target.value)
              }
              className={inputClass+" col-span-5"}
            />
            <input
              aria-label={`Deposit ${index + 1} amount`}
              type="number"
              min="0.01"
              max="2000"
              step="0.01"
              value={row.depositAmount ?? ""}
              onChange={(event) =>
                onChange(index, "depositAmount", event.target.value)
              }
              className={inputClass+" col-span-3"}
            />
            <button
              type="button"
              aria-label={`Remove deposit ${index + 1}`}
              onClick={() => onRemove(index)}
              className="text-sm text-rose-400 hover:text-rose-300 col-span-1"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="text-xs font-medium text-teal-300 hover:text-teal-200"
        >
          + Add deposit
        </button>
      </div>
    </details>
  );
}
