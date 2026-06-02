import { Minus, Plus } from 'lucide-react';

export default function GuestStepper({ value = 1, onChange, min = 1, max = 10 }) {
  const currentValue = Math.max(min, Math.min(max, value));
  const isAtMin = currentValue <= min;
  const isAtMax = currentValue >= max;

  const handleDecrement = () => {
    if (!isAtMin) {
      onChange?.(currentValue - 1);
    }
  };

  const handleIncrement = () => {
    if (!isAtMax) {
      onChange?.(currentValue + 1);
    }
  };

  return (
    <div className="inline-flex items-center gap-3 select-none">
      {/* Decrement button */}
      <button
        type="button"
        onClick={handleDecrement}
        disabled={isAtMin}
        className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-200 transform active:scale-95 ${
          isAtMin
            ? 'border-base-200 text-ink-500/30 cursor-not-allowed bg-base-50'
            : 'border-base-200 text-ink-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 bg-white'
        }`}
      >
        <Minus className="w-4 h-4" />
      </button>

      {/* Value display */}
      <div className="flex items-center gap-1.5 min-w-[4.5rem] justify-center">
        <span className="text-lg font-bold text-ink-900 tabular-nums">
          {currentValue} người
        </span>
      </div>

      {/* Increment button */}
      <button
        type="button"
        onClick={handleIncrement}
        disabled={isAtMax}
        className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-200 transform active:scale-95 ${
          isAtMax
            ? 'border-base-200 text-ink-500/30 cursor-not-allowed bg-base-50'
            : 'border-base-200 text-ink-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 bg-white'
        }`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
