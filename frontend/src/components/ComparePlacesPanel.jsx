import React from 'react';
import { MapPin, MessageCircle, Navigation, X } from 'lucide-react';

export default function ComparePlacesPanel({
  taggedPlaces = [],
  selectedPlaceId,
  onSelectPlace,
  onRemoveTaggedPlace,
  onDirections,
  onAskAIAboutPlace,
  onRequestAiCompare,
}) {
  const selectedPlace = taggedPlaces.find((place) => place.id === selectedPlaceId) || taggedPlaces[0];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-base-200 px-4 py-3">
        <p className="text-[10px] font-black uppercase text-primary-700">Compare Places</p>
        <h2 className="mt-0.5 text-sm font-black text-ink-900">So sánh địa điểm</h2>
        <p className="mt-1 text-[11px] font-semibold text-slate-500">
          Dùng các địa điểm đã tag trong chat làm tập so sánh chính.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {taggedPlaces.length < 2 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
            Hãy tag ít nhất 2 địa điểm vào chat để AI có đủ dữ liệu so sánh.
          </div>
        ) : (
          <div className="space-y-2">
            {taggedPlaces.map((place) => {
              const isSelected = place.id === selectedPlaceId;
              return (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => onSelectPlace?.(place)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    isSelected
                      ? 'border-primary-300 bg-primary-50 shadow-soft'
                      : 'border-base-200 bg-white hover:border-primary-200 hover:bg-primary-50/40'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-1 text-xs font-black text-ink-900">
                        {place.name || place.placeName}
                      </div>
                      {place.address ? (
                        <div className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-slate-500">
                          {place.address}
                        </div>
                      ) : null}
                      {place.rating || place.averageRating ? (
                        <div className="mt-1 text-[10px] font-bold text-amber-700">
                          Rating: {place.rating || place.averageRating}/5
                        </div>
                      ) : null}
                    </div>
                    {onRemoveTaggedPlace ? (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemoveTaggedPlace(place.id);
                        }}
                        className="rounded-lg p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        title="Bỏ tag"
                      >
                        <X className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedPlace ? (
        <div className="grid grid-cols-2 gap-2 border-t border-base-200 p-3">
          {onRequestAiCompare && taggedPlaces.length >= 2 ? (
            <button
              type="button"
              onClick={onRequestAiCompare}
              className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-700"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              So sánh bằng AI
            </button>
          ) : null}
          {onDirections ? (
            <button
              type="button"
              onClick={() => onDirections(selectedPlace)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-base-200 px-3 py-2 text-xs font-bold text-ink-700 transition hover:bg-base-50"
            >
              <Navigation className="h-3.5 w-3.5" />
              Chỉ đường
            </button>
          ) : null}
          {onAskAIAboutPlace ? (
            <button
              type="button"
              onClick={() => onAskAIAboutPlace(selectedPlace)}
              className="inline-flex items-center justify-center rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-bold text-primary-700 transition hover:bg-primary-100"
            >
              Hỏi AI
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
