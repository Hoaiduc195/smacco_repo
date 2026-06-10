import React from 'react';
import { MapPin } from 'lucide-react';
import PlaceCard from './PlaceCard';

export default function SavedPlacesPanel({
  places = [],
  isLoading = false,
  selectedPlaceId,
  onSelectPlace,
  onDirections,
  onRemovePlace,
}) {
  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-5 text-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary-100 border-t-primary-600" />
        <p className="mt-3 text-xs font-bold text-ink-500">Đang tải địa điểm đã lưu...</p>
      </div>
    );
  }

  if (!places.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-5 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <MapPin className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-black text-ink-900">Chưa có địa điểm đã lưu</h3>
        <p className="mt-1 text-xs font-medium leading-5 text-ink-500">
          Khi bạn lưu địa điểm, chúng sẽ xuất hiện ở đây để xem lại nhanh trên bản đồ.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-base-200 px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-primary-700">Địa điểm đã lưu</p>
        <h2 className="mt-0.5 text-lg font-black text-ink-900">{places.length} địa điểm</h2>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 overscroll-contain">
        {places.map((place, index) => (
          <PlaceCard
            key={place.id || index}
            place={place}
            itemIndex={index}
            imageUrl={place.imageUrl || place.coverImageUrl}
            isSelected={String(selectedPlaceId) === String(place.id)}
            onSelect={() => onSelectPlace?.(place)}
            onSave={() => onRemovePlace?.(place.id)}
            isSaved
            saveMode="save"
            onDirections={onDirections ? () => onDirections(place) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
