import React from 'react';
import ComparisonPanel from './ComparisonPanel';

export default function ComparePlacesPanel({
  comparedPlaces = [],
  selectedPlaceId,
  onSelectPlace,
  onRemoveFromComparison,
  onDirections,
  onAskAIAboutPlace,
}) {
  const selectedPlace = comparedPlaces.find((place) => place.id === selectedPlaceId) || comparedPlaces[0];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-base-200 px-4 py-3">
        <p className="text-[10px] font-black uppercase text-primary-700">Compare Places</p>
        <h2 className="mt-0.5 text-sm font-black text-ink-900">So sánh địa điểm</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <ComparisonPanel
          places={comparedPlaces}
          onRemoveFromComparison={onRemoveFromComparison}
          onSelectPlace={onSelectPlace}
        />
      </div>
      {selectedPlace ? (
        <div className="flex gap-2 border-t border-base-200 p-3">
          {onDirections ? (
            <button
              type="button"
              onClick={() => onDirections(selectedPlace)}
              className="flex-1 rounded-xl border border-base-200 px-3 py-2 text-xs font-bold text-ink-700 transition hover:bg-base-50"
            >
              Chỉ đường
            </button>
          ) : null}
          {onAskAIAboutPlace ? (
            <button
              type="button"
              onClick={() => onAskAIAboutPlace(selectedPlace)}
              className="flex-1 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-bold text-primary-700 transition hover:bg-primary-100"
            >
              Hỏi AI
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
