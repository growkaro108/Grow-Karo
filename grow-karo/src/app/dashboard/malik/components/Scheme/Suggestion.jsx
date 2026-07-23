import React, { useMemo } from "react";

export const Suggestion = ({
  schemeNames,
  target,
  setTo,
  existingSelectSuggestion,
}) => {
  const suggestionMatches = useMemo(() => {
    const term = target?.trim().toLowerCase();
    if (!term) return [];
    return schemeNames
      .filter((name) => name.toLowerCase().includes(term))
      .slice(0, 6);
  }, [schemeNames, target]);
  const selectSuggestion = useCallback(
    (name) => {
      setTo(name);
    },
    [setTo],
  );
  if (suggestionMatches?.length < 1) {
    return null;
  }
  return (
    <ul className="absolute z-60 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
      {suggestionMatches.map((name) => (
        <li key={name}>
          <button
            type="button"
            // onMouseDown (not onClick) fires before the input's
            // onBlur closes the dropdown.
            onMouseDown={() =>
              existingSelectSuggestion(name) || selectSuggestion(name)
            }
            className="block w-full truncate px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-cyan-400"
          >
            {name}
          </button>
        </li>
      ))}
    </ul>
  );
};
