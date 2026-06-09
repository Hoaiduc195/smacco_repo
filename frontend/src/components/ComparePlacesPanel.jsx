import React from 'react';
import { MapPin, MessageCircle, Navigation, Tags, X } from 'lucide-react';

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
      <div className="flex-1 overflow-y-auto p-3">
        {taggedPlaces.length < 2 ? (
          <div className="workspace-empty-state">
            <Tags className="h-5 w-5 text-primary-600" />
            <h3>Cần ít nhất 2 địa điểm</h3>
            <p>Tag các địa điểm từ kết quả tìm kiếm hoặc chat để AI có tập dữ liệu so sánh thật.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {taggedPlaces.map((place) => {
              const isSelected = place.id === selectedPlaceId;
              return (
                <article
                  key={place.id}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    isSelected
                      ? 'border-primary-300 bg-primary-50 shadow-soft'
                      : 'border-base-200 bg-white/90 hover:border-primary-200 hover:bg-primary-50/40'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectPlace?.(place)}
                      className="flex min-w-0 flex-1 items-start gap-2 text-left"
                    >
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
                    </button>
                    {onRemoveTaggedPlace ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemoveTaggedPlace(place.id);
                        }}
                        className="rounded-lg p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        title="Bỏ tag"
                        aria-label={`Bỏ tag ${place.name || place.placeName || 'địa điểm'}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selectedPlace ? (
        <div className="grid grid-cols-2 gap-2 border-t border-base-200/80 bg-white/70 p-3">
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
