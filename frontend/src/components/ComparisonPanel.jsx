import React from 'react';
import { MapPin, Sparkles, Star, X } from 'lucide-react';

export default function ComparisonPanel({
  places = [],
  onRemoveFromComparison,
  onSelectPlace,
}) {
  if (!places || places.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-400">
        Chưa có địa điểm nào được chọn để so sánh. Hãy ghim/chọn các chỗ ở và nhấn "So sánh".
      </div>
    );
  }

  const formatValue = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean).join(', ');
    return value || 'Chưa có dữ liệu';
  };

  return (
    <div className="space-y-4 p-1 max-h-[500px] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-2">
        {places.slice(0, 2).map((place, idx) => (
          <article
            key={place.id || idx}
            className="relative rounded-xl border border-base-200 bg-white p-2.5 text-left transition hover:border-primary-300"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromComparison?.(place.id);
              }}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              title="Bỏ so sánh"
              aria-label={`Bỏ so sánh ${place.name || place.placeName || 'địa điểm'}`}
            >
              <X className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => onSelectPlace?.(place)}
              className="block w-full text-left"
            >
              <h4 className="truncate pr-5 text-[11px] font-black leading-tight text-ink-900">{place.name || place.placeName}</h4>
            </button>
            <p className="mt-1 text-[10px] font-bold text-primary-700">{place.price || place.priceRange || 'Chưa có giá'}</p>

            <div className="mt-2 space-y-2 text-[10px] text-slate-700">
              <div className="flex gap-1">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary-600" />
                <span>{formatValue(place.address || place.placeAddress || place.formattedAddress)}</span>
              </div>
              <div className="flex gap-1">
                <Star className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                <span>{place.rating || place.averageRating ? `${place.rating || place.averageRating}/5` : 'Chưa có rating'}</span>
              </div>
              <div>
                <span className="block font-bold text-slate-500">Loại hình</span>
                <span>{formatValue(place.type || place.categories?.[0])}</span>
              </div>
              <div>
                <span className="block font-bold text-slate-500">Tiện nghi</span>
                <span>{formatValue(place.amenities || place.features)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {places.length >= 2 && (
        <div className="space-y-2 rounded-2xl border border-primary-200/80 bg-primary-50/50 p-3">
          <h5 className="flex items-center gap-1 text-[10px] font-black text-primary-800">
            <Sparkles className="w-3 h-3 text-primary-600" />
            So sánh trung thực
          </h5>
          <p className="text-[10px] leading-normal text-slate-700">
            Panel này chỉ hiển thị dữ liệu đã có trong hệ thống. Dùng nút so sánh bằng AI để tạo nhận xét có ngữ cảnh từ các địa điểm đã tag.
          </p>
        </div>
      )}
    </div>
  );
}
