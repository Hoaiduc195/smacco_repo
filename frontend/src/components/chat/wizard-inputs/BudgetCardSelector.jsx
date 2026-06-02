import { Check } from 'lucide-react';

const BUDGET_OPTIONS = [
  {
    value: 'low',
    label: 'Bình dân',
    description: 'Dưới 500K/đêm',
  },
  {
    value: 'mid',
    label: 'Tầm trung',
    description: '500K - 1.5M/đêm',
  },
  {
    value: 'high',
    label: 'Cao cấp',
    description: 'Trên 1.5M/đêm',
  },
];

export default function BudgetCardSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {BUDGET_OPTIONS.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange?.(option.value)}
            className={`relative flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl border-2 text-center transition-all duration-200 transform active:scale-[0.97] ${
              isSelected
                ? 'bg-primary-50 border-primary-600 shadow-sm'
                : 'bg-white border-base-200 hover:border-primary-200 hover:bg-primary-50/50 hover:shadow-sm'
            }`}
          >
            {isSelected && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-sm">
                <Check className="w-3 h-3" />
              </div>
            )}

            {/* Label */}
            <span
              className={`text-sm font-bold leading-tight ${
                isSelected ? 'text-primary-800' : 'text-ink-900'
              }`}
            >
              {option.label}
            </span>

            {/* Description */}
            <span
              className={`text-[11px] leading-tight ${
                isSelected ? 'text-primary-600 font-medium' : 'text-ink-500'
              }`}
            >
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
