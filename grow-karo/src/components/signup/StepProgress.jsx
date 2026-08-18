export default function StepProgress({ steps, currentStep, furthestStep, onStepClick }) {
  const percent = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
          Step {currentStep + 1} of {steps.length}
        </span>
        <span className="text-[11px] font-semibold text-slate-500">
          {steps[currentStep].title}
        </span>
      </div>

      <div className="relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-slate-900 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="hidden sm:flex justify-between mt-2">
        {steps.map((step, i) => {
          const reachable = i <= furthestStep;
          const isCurrent = i === currentStep;
          return (
            <button
              key={step.key}
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onStepClick(i)}
              className={`text-[10px] font-semibold px-1 truncate transition-colors ${
                isCurrent
                  ? "text-slate-900"
                  : reachable
                    ? "text-slate-400 hover:text-slate-600 cursor-pointer"
                    : "text-slate-300 cursor-not-allowed"
              }`}
              style={{ width: `${100 / steps.length}%` }}
            >
              {step.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
