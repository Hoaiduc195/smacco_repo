import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import PlaceCard from './PlaceCard';
import { navigateToPlaceDetail } from '../utils/placeNavigation';

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
      <div className="workspace-empty-state">
        <Search className="h-5 w-5 text-primary-600" />
        <h3>Chưa có kết quả</h3>
        <p>Nhập tìm kiếm ở thanh trên hoặc hỏi AI để danh sách địa điểm xuất hiện tại đây.</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 space-y-3 overflow-y-auto p-3 overscroll-contain">
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
          </div>
        );
      })}
    </div>
  );
}
