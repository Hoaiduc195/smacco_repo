import React from 'react';
import { useNavigate } from 'react-router-dom';
import PlaceCard from './PlaceCard';
import { navigateToPlaceDetail } from '../utils/placeNavigation';

export default function SearchResultsPanel({
  places = [],
  selectedPlaceId,
  pinnedPlaceIds = [],
  onSelectPlace,
  onPinPlace,
  onComparePlace,
  onDirections,
  onHoverPlace,
}) {
  const navigate = useNavigate();

  if (!places || places.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-400">
        Chưa có kết quả tìm kiếm nào. Hãy bảo AI tìm kiếm chỗ ở ở phần chat.
      </div>
    );
  }

  return (
    <div className="space-y-3 p-1 max-h-[500px] overflow-y-auto pr-2">
      {places.map((place, index) => {
        const isSelected = selectedPlaceId === place.id;
        const isPinned = pinnedPlaceIds.includes(place.id);

        return (
          <div
            key={place.id || index}
            onMouseEnter={() => onHoverPlace?.(place.id)}
            onMouseLeave={() => onHoverPlace?.(null)}
            className="w-full text-left"
          >
            <PlaceCard
              place={place}
              itemIndex={index}
              imageUrl={place.imageUrl || place.coverImageUrl}
              isSelected={isSelected}
              onSelect={() => onSelectPlace?.(place)}
              onSave={() => onPinPlace?.(place)}
              isSaved={isPinned}
              saveMode="tag"
              onNavigate={() => navigateToPlaceDetail(navigate, place.id, { place })}
              onDirections={onDirections ? () => onDirections(place) : undefined}
            />
            {onComparePlace ? (
              <button
                type="button"
                onClick={() => onComparePlace(place)}
                className="mt-2 w-full rounded-xl border border-primary-200 bg-white px-3 py-2 text-xs font-bold text-primary-700 transition hover:bg-primary-50"
              >
                So sánh địa điểm này
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
