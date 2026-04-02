import React, { useMemo } from 'react';
import { MessageSquare, Navigation, Star, MapPin } from 'lucide-react';

const placeholderImg = 'https://via.placeholder.com/400x250?text=No+Image';

export default function PlaceCard({
  place,
  imageUrl,
  reviews = [],
  isSelected,
  onSelect,
  onChat,
  onDirections,
  onNavigate,
}) {
  const reviewText = useMemo(() => {
    if (!reviews || !reviews.length) return 'No reviews yet';
    return reviews.slice(0, 2).map((r) => r.comment || r.text || '').filter(Boolean).join(' · ');
  }, [reviews]);

  return (
    <div
      className={`w-full text-left p-3 rounded-lg border transition flex flex-col gap-2 ${
        isSelected ? 'border-blue-500 shadow' : 'border-gray-200 hover:border-blue-400 hover:shadow-sm'
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
    >
      <div className="flex gap-3">
        <img
          src={imageUrl || placeholderImg}
          alt={place.name}
          className="w-24 h-24 rounded-lg object-cover flex-shrink-0 bg-gray-100"
          loading="lazy"
        />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="font-semibold text-gray-900 line-clamp-1">{place.name}</div>
          {place.address && (
            <div className="text-xs text-gray-600 line-clamp-2 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>{place.address}</span>
            </div>
          )}
          <div className="text-xs text-gray-500 flex items-center gap-3">
            {place.rating && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                {place.rating}
              </span>
            )}
            {place.priceLevel !== undefined && <span>💲{place.priceLevel}</span>}
            {place.type && <span className="capitalize">{place.type}</span>}
          </div>
          <div className="text-xs text-gray-700 line-clamp-2">{reviewText}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChat?.();
          }}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <MessageSquare className="w-4 h-4" /> Chat
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDirections?.();
          }}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          <Navigation className="w-4 h-4" /> Chỉ đường
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate?.();
          }}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          Chi tiết
        </button>
      </div>
    </div>
  );
}
