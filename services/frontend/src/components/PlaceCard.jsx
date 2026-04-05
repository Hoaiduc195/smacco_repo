import React, { useMemo } from 'react';
import { Clock3, MessageSquare, Navigation, Star, MapPin, BookmarkPlus, BookmarkCheck } from 'lucide-react';

const placeholderImg = 'https://via.placeholder.com/400x250?text=No+Image';

export default function PlaceCard({
  place,
  itemIndex = 0,
  imageUrl,
  reviews = [],
  isSelected,
  onSelect,
  onChat,
  onDirections,
  onShowDetails,
  onNavigate,
  onSave,
  isSaved,
  onAssignToTrip,
  disableAssign,
  tripActionLabel = 'Thêm vào chuyến đi',
  travelTimeMinutes,
  showActions = true,
}) {
  const reviewText = useMemo(() => {
    if (!reviews || !reviews.length) return 'Chưa có đánh giá';
    return reviews.slice(0, 2).map((r) => r.comment || r.text || '').filter(Boolean).join(' · ');
  }, [reviews]);

  return (
    <div
      className={`w-full text-left p-3 rounded-2xl border transition flex flex-col gap-3 bg-white/95 animate-card-enter ${
        isSelected ? 'border-cyan-400 shadow-lg ring-2 ring-cyan-100' : 'border-slate-200 hover:border-cyan-300 hover:shadow-md'
      }`}
      style={{ animationDelay: `${Math.min(itemIndex, 8) * 45}ms` }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
    >
      <div className="flex gap-3">
        <img
          src={imageUrl || placeholderImg}
          alt={place.name}
          className="w-24 h-24 rounded-xl object-cover flex-shrink-0 bg-slate-100"
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
          {travelTimeMinutes ? (
            <div className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              <Clock3 className="w-3.5 h-3.5" />
              {travelTimeMinutes} phút từ vị trí của bạn
            </div>
          ) : null}
          <div className="text-xs text-gray-700 line-clamp-2">{reviewText}</div>
        </div>
      </div>
      {!showActions && (onDirections || onShowDetails) ? (
        <div className="flex justify-end gap-2">
          {onShowDetails ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShowDetails?.();
              }}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-cyan-200 text-cyan-700 hover:bg-cyan-50"
            >
              Chi tiết
            </button>
          ) : null}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDirections?.();
            }}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Navigation className="w-4 h-4" /> Chỉ đường
          </button>
        </div>
      ) : null}
      {showActions ? <div className="flex gap-2">
        {onSave ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSave?.();
            }}
            className={`inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border ${
              isSaved
                ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
            {isSaved ? 'Đã lưu' : 'Lưu'}
          </button>
        ) : null}
        {onChat ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChat?.();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-cyan-200 text-cyan-700 hover:bg-cyan-50"
          >
            <MessageSquare className="w-4 h-4" /> Chat
          </button>
        ) : null}
        {onDirections ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDirections?.();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Navigation className="w-4 h-4" /> Chỉ đường
          </button>
        ) : null}
        {onNavigate ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate?.();
            }}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Chi tiết
          </button>
        ) : null}
        {onAssignToTrip ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAssignToTrip?.();
            }}
            disabled={disableAssign}
            className="px-3 py-2 text-sm rounded-lg border border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tripActionLabel}
          </button>
        ) : null}
      </div> : null}
    </div>
  );
}
