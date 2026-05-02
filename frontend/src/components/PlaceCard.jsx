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
  onCheckIn,
  isCheckedIn,
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
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('placeId', place.id);
        e.dataTransfer.effectAllowed = 'copy';
        // Custom drag preview: only icon + text
        const dragPreview = document.createElement('div');
        dragPreview.style.position = 'absolute';
        dragPreview.style.top = '-1000px';
        dragPreview.style.left = '-1000px';
        dragPreview.style.padding = '8px 16px';
        dragPreview.style.background = '#fff';
        dragPreview.style.borderRadius = '9999px';
        dragPreview.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
        dragPreview.style.fontWeight = 'bold';
        dragPreview.style.fontSize = '14px';
        dragPreview.style.color = '#2563eb';
        dragPreview.style.display = 'flex';
        dragPreview.style.alignItems = 'center';
        dragPreview.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='none' stroke='#2563eb' stroke-width='2' viewBox='0 0 24 24'><circle cx='12' cy='10' r='3'/><path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z'/></svg>` + `<span style='margin-left:8px;'>${place.name}</span>`;
        document.body.appendChild(dragPreview);
        e.dataTransfer.setDragImage(dragPreview, 10, 18);
        setTimeout(() => document.body.removeChild(dragPreview), 0);
      }}
    >
      <div className="flex gap-3">
        <div className={`w-24 h-24 rounded-xl flex-shrink-0 flex items-center justify-center ${
          place.type === 'hotel' ? 'bg-blue-100 text-blue-600' :
          place.type === 'resort' ? 'bg-green-100 text-green-600' :
          place.type === 'homestay' ? 'bg-amber-100 text-amber-600' :
          place.type === 'restaurant' ? 'bg-red-100 text-red-600' :
          'bg-slate-100 text-slate-500'
        }`}>
          {place.type === 'hotel' ? <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 22v-6.57"/><path d="M12 11h.01"/><path d="M12 7h.01"/><path d="M14 15.43V22"/><path d="M15 16a5 5 0 0 0-6 0"/><path d="M16 11h.01"/><path d="M16 7h.01"/><path d="M8 11h.01"/><path d="M8 7h.01"/><rect x="4" y="2" width="16" height="20" rx="2"/></svg> :
           place.type === 'resort' ? <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 22 2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2"/><path d="M13.1 14.3 11 12l2.3-2.3a2.4 2.4 0 0 1 3.4 0l3 3a2.4 2.4 0 0 1 0 3.4Z"/><path d="m5 11 4.5-4.5a2.1 2.1 0 0 1 2.9 0l1.4 1.4"/><path d="M4 14v4"/><path d="M8 14v4"/></svg> :
           place.type === 'restaurant' ? <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg> :
           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>}
        </div>
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
            className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border ${
              isSaved
                ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
            {isSaved ? 'Đã lưu' : 'Lưu'}
          </button>
        ) : null}
        {onCheckIn ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCheckIn?.();
            }}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border ${
              isCheckedIn
                ? 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <MapPin className={`w-4 h-4 ${isCheckedIn ? 'fill-blue-500' : ''}`} />
            {isCheckedIn ? 'Đã check-in' : 'Check-in'}
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
      </div> : null}
    </div>
  );
}
