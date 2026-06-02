import { Check } from 'lucide-react';

export default function ChipMultiSelector({ options = [], value = [], onChange, maxSelect }) {
  const selectedCount = value.length;
  const isMaxReached = maxSelect && selectedCount >= maxSelect;

  const handleToggle = (optionValue) => {
    const isSelected = value.includes(optionValue);

    if (isSelected) {
      onChange?.(value.filter((v) => v !== optionValue));
    } else {
      if (isMaxReached) return;
      onChange?.([...value, optionValue]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Selected count badge */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
            Đã chọn {selectedCount}{maxSelect ? `/${maxSelect}` : ''}
          </span>
        </div>
      )}

      {/* Chip grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((option) => {
          const isSelected = value.includes(option.value);
          const isDisabled = !isSelected && isMaxReached;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              disabled={isDisabled}
              className={`relative flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 transform active:scale-[0.97] ${
                isSelected
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : isDisabled
                    ? 'bg-base-50 text-ink-500/50 border-base-200 cursor-not-allowed'
                    : 'bg-white text-ink-700 border-base-200 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700'
              }`}
            >
              <span className="truncate">{option.label}</span>
              {isSelected && (
                <Check className="w-3.5 h-3.5 ml-auto shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
