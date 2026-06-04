import React from 'react';
import { useNavigate } from 'react-router-dom';
import PlaceCard from './PlaceCard';

export default function SearchResultsPanel({
  places = [],
  selectedPlaceId,
  pinnedPlaceIds = [],
  onSelectPlace,
  onPinPlace,
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
              onNavigate={() => navigate(`/places/${place.id}`)}
              onDirections={onDirections ? () => onDirections(place) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
