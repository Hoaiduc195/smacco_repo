import { useState, useRef } from 'react';
import { MapPin, X } from 'lucide-react';

const DEFAULT_SUGGESTIONS = [
  'Đà Lạt', 'Đà Nẵng', 'Hội An', 'Phú Quốc',
  'Nha Trang', 'Sapa', 'Hà Nội', 'TP.HCM',
];

export default function LocationInput({ value = '', onChange, suggestions }) {
  const chipList = suggestions && suggestions.length > 0 ? suggestions : DEFAULT_SUGGESTIONS;
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleChipClick = (location) => {
    onChange?.(location);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    onChange?.('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Input field */}
      <div
        className={`relative flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white transition-all duration-200 ${
          isFocused
            ? 'border-primary-600 shadow-sm ring-2 ring-primary-100'
            : 'border-base-200 hover:border-primary-200'
        }`}
      >
        <MapPin className="w-4 h-4 text-primary-600 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="VD: Đà Lạt, Đà Nẵng..."
          className="flex-1 bg-transparent outline-none text-sm text-ink-900 placeholder-ink-500/60"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 rounded-full hover:bg-base-200 text-ink-500 transition-colors duration-150"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Suggestion chips - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-hide">
        {chipList.map((loc) => {
          const isActive = value === loc;
          return (
            <button
              key={loc}
              type="button"
              onClick={() => handleChipClick(loc)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-200 transform active:scale-95 shrink-0 ${
                isActive
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white text-ink-700 border-base-200 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700'
              }`}
            >
              <MapPin className="w-3 h-3" />
              {loc}
            </button>
          );
        })}
      </div>
    </div>
  );
}
