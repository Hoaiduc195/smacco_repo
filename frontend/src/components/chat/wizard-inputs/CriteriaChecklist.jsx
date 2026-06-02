import { Check } from 'lucide-react';

export default function CriteriaChecklist({ options = [], value = [], onChange, maxSelect }) {
  const selectedCount = value.length;
  const isMaxReached = maxSelect && selectedCount >= maxSelect;

  const handleToggle = (optionValue) => {
    const isChecked = value.includes(optionValue);

    if (isChecked) {
      onChange?.(value.filter((v) => v !== optionValue));
    } else {
      if (isMaxReached) return;
      onChange?.([...value, optionValue]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Max select hint */}
      {maxSelect && (
        <p className="text-xs text-ink-500 mb-1">
          Chọn tối đa {maxSelect} mục ({selectedCount}/{maxSelect})
        </p>
      )}

      {options.map((option) => {
        const isChecked = value.includes(option.value);
        const isDisabled = !isChecked && isMaxReached;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleToggle(option.value)}
            disabled={isDisabled}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border text-left transition-all duration-200 transform active:scale-[0.99] ${
              isChecked
                ? 'bg-primary-50 border-primary-300 shadow-sm'
                : isDisabled
                  ? 'bg-base-50 border-base-200 cursor-not-allowed opacity-50'
                  : 'bg-white border-base-200 hover:border-primary-200 hover:bg-primary-50/30'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                isChecked
                  ? 'bg-primary-600 border-primary-600'
                  : 'border-base-200 bg-white'
              }`}
            >
              {isChecked && (
                <Check className="w-3 h-3 text-white" />
              )}
            </div>
            <span
              className={`text-sm font-medium ${
                isChecked ? 'text-primary-800' : isDisabled ? 'text-ink-500' : 'text-ink-900'
              }`}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
