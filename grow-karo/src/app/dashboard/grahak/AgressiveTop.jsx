import { use, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, Clock } from "lucide-react";
import { currency } from "../malik/utils";
import { userContext } from "@/context/UserContext";

const TableItem = ({ title, value, LabelColor, ValueColor }) => {
  return (
    <div className="p-3.5 rounded-lg flex justify-between items-center text-xs border border-[#EAD9D6] bg-[#FBF3F2]">
      <span
        className={`font-medium uppercase tracking-wider text-[${LabelColor}]`}
      >
        {title}
      </span>
      <span className={`font-bold text-[${ValueColor}] tabular-nums`}>
        {value}
      </span>
    </div>
  );
};

export default function AggresiveTop({ value, onChange, isAggressive }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const { holding } = use(userContext);

  function calculatePenalty(amount, profit, redeemed, startDate) {
    const today = new Date();
    const start = new Date(startDate);

    // Calculate elapsed months accurate to calendar months
    let monthsPassed =
      (today.getFullYear() - start.getFullYear()) * 12 +
      (today.getMonth() - start.getMonth());

    // Adjust if current day of month is earlier than start day
    if (today.getDate() < start.getDate()) {
      monthsPassed--;
    }

    // Determine penalty percentage
    // TODO: confirm intended tier boundaries — original code had a
    // duplicate `monthsPassed >= 5` branch that was unreachable.
    // Guessing an even ladder here; replace with your real business rule.
    let penaltyRate;
    if (monthsPassed > 11) {
      penaltyRate = 1;
    } else if (monthsPassed > 8) {
      penaltyRate = 0.8;
    } else if (monthsPassed >= 5) {
      penaltyRate = 0.6;
    } else if (monthsPassed >= 2) {
      penaltyRate = 0.4;
    } else {
      penaltyRate = 0.2;
    }

    const balance = Number(amount) + Number(profit) - Number(redeemed);
    return balance * penaltyRate;
  }

  const schemes = useMemo(() => {
    if (isAggressive) {
      // console.log(holding);
      return holding
        .filter((h) => {
          const balance =
            Number(h.paidAmount) + Number(h.profit) - Number(h.profitReedemed);
          const penalty = calculatePenalty(
            h.paidAmount,
            h.profit,
            h.profitReedemed,
            h.enrollmentDate,
          );
          // Don't add to scheme list if penalty equals full balance
          return penalty !== balance;
        })
        .map((h) => ({
          id: h.userSchemeId,
          schemeId: h.schemeId,
          userSchemeId: h.userSchemeId,
          name: h.schemeName,
          tenure: h.tenure,
          amount: h.paidAmount,
          penalty: calculatePenalty(
            h.paidAmount,
            h.profit,
            h.profitReedemed,
            h.enrollmentDate,
          ),
        }));
    }

    return holding
      .filter((h) => Number(h.profit) - Number(h.profitReedemed) > 0)
      .map((h) => ({
        id: h.userSchemeId,
        schemeId: h.schemeId,
        userSchemeId: h.userSchemeId,
        name: h.schemeName,
        tenure: h.tenure,
        amount: h.profit,
        invested: h.paidAmount,
      }));
  }, [holding, isAggressive]);

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = schemes?.find((s) => s.id === value) ?? null;

  function selectScheme(scheme) {
    onChange?.(scheme);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onTriggerKeyDown(e) {
    if (["ArrowDown", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
      setActiveIndex(
        Math.max(
          schemes.findIndex((s) => s.id === value),
          0,
        ),
      );
    }
  }
  function onListKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, schemes.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectScheme(schemes[activeIndex]);
    }
  }

  return (
    <div className="w-full">
      {/* <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5B5648]">
        Withdrawal Scheme
      </div> */}

      <div ref={containerRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            setOpen((v) => !v);
            setActiveIndex(
              Math.max(
                schemes.findIndex((s) => s.id === value),
                0,
              ),
            );
          }}
          onKeyDown={onTriggerKeyDown}
          className="w-full h-14 flex items-center justify-between gap-3 rounded-lg border border-[#E4DFD3] bg-white px-4 text-left
                     transition-colors motion-reduce:transition-none
                     hover:border-[#B4893E]/50
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B4893E] focus-visible:ring-offset-2"
        >
          <span className="min-w-0">
            {selected ? (
              <span className="flex flex-col leading-tight">
                <span className="font-semibold text-[#0B1B2E] text-sm truncate flex items-center gap-1">
                  {selected.name} · <Clock size={12} /> {selected.tenure} days
                </span>
                <span className="text-xs text-[#8C8672] tabular-nums">
                  {currency(selected.amount)} withdrawal
                </span>
              </span>
            ) : (
              <span className="text-sm text-[#8C8672]">
                Select a scheme to continue
              </span>
            )}
          </span>
          <ChevronDown
            size={18}
            className={`shrink-0 text-[#B4893E] transition-transform motion-reduce:transition-none ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <ul
            role="listbox"
            tabIndex={-1}
            onKeyDown={onListKeyDown}
            aria-activedescendant={
              activeIndex >= 0
                ? `scheme-option-${schemes[activeIndex].id}`
                : undefined
            }
            className="absolute z-10 mt-2 w-full divide-y divide-[#EFEBE0] overflow-hidden rounded-lg border border-[#E4DFD3] bg-white shadow-lg shadow-[#0B1B2E]/10"
          >
            {schemes.map((scheme, idx) => {
              const isSelected = scheme.id === value;
              const isActive = idx === activeIndex;
              return (
                <li
                  key={idx}
                  id={`scheme-option-${scheme.id}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => selectScheme(scheme)}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm border-l-2 transition-colors motion-reduce:transition-none
                    ${isActive ? "bg-[#FAF7F0]" : "bg-white"}
                    ${isSelected ? "border-l-[#B4893E]" : "border-l-transparent"}`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Check
                      size={14}
                      className={`shrink-0 text-[#B4893E] ${isSelected ? "opacity-100" : "opacity-0"}`}
                    />
                    <span className="flex flex-col leading-tight min-w-0">
                      <span className="font-medium text-[#0B1B2E] truncate">
                        {scheme.name}
                      </span>
                      <span className="text-xs text-[#8C8672] flex items-center gap-1">
                        <Clock size={12} /> {scheme.tenure} days
                      </span>
                    </span>
                  </span>
                  <span className="flex flex-col items-end shrink-0 text-xs tabular-nums">
                    <span className="font-semibold text-[#0B1B2E]">
                      {currency(scheme.amount)}
                    </span>
                    {isAggressive && (
                      <span className="text-[#8C3B34]">
                        −{currency(scheme.penalty)} penalty
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        {isAggressive ? (
          <>
            <TableItem
              title="Amount"
              value={selected ? currency(selected.amount) : "—"}
              LabelColor="#8C3B34"
              ValueColor="#0B1B2E"
            />
            <TableItem
              title="penalty"
              value={selected ? selected.penalty : ""}
              LabelColor="#8C3B34"
              ValueColor="#0B1B2E"
            />
          </>
        ) : (
          <>
            <TableItem
              title="Invested"
              value={selected ? currency(selected.invested) : "—"}
              LabelColor="#1F6F64"
              ValueColor="#0B1B2E"
            />
            <TableItem
              title="profit"
              value={selected ? currency(selected.amount) : "—"}
              LabelColor="#15e851"
              ValueColor="#2bcc59"
            />
          </>
        )}
      </div>

      {selected && isAggressive && (
        <div className="mt-3 flex justify-between items-center px-1 text-xs">
          <span className="text-[#5B5648]">Net payout after penalty</span>
          <span className="font-bold text-[#1F6F54] tabular-nums">
            {currency(selected.amount - selected.penalty)}
          </span>
        </div>
      )}
    </div>
  );
}
