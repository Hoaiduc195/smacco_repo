import React, { useMemo, useState, useEffect } from 'react';
import { Clock3, MessageSquare, Navigation, Star, MapPin, BookmarkPlus, BookmarkCheck, MoreVertical, Copy, Trash2 } from 'lucide-react';

const placeholderImg = 'https://via.placeholder.com/400x250?text=No+Image';

export default function PlaceCard({
  place,
  itemIndex = 0,
  imageUrl,
  reviews = [],
  userLocation = null,
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
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!showDropdown) return;
    const close = () => setShowDropdown(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [showDropdown]);

  const placeType = place.type?.toLowerCase();
  const placeDescription = place.description?.trim();
  const distanceKm = useMemo(() => {
    if (!userLocation?.lat || !userLocation?.lng || !place?.lat || !place?.lng) return null;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(Number(place.lat) - Number(userLocation.lat));
    const dLng = toRad(Number(place.lng) - Number(userLocation.lng));
    const lat1 = toRad(Number(userLocation.lat));
    const lat2 = toRad(Number(place.lat));
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, [place?.lat, place?.lng, userLocation?.lat, userLocation?.lng]);
  const reviewText = useMemo(() => {
    if (!reviews || !reviews.length) return placeDescription || 'Chưa có đánh giá';
    return reviews.slice(0, 2).map((r) => r.comment || r.text || '').filter(Boolean).join(' · ');
  }, [placeDescription, reviews]);
  const getIconAndColor = (type) => {
    switch (type) {
      case 'hotel':
        return {
          bg: 'bg-blue-100', text: 'text-blue-600',
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 22v-6.57"/><path d="M12 11h.01"/><path d="M12 7h.01"/><path d="M14 15.43V22"/><path d="M15 16a5 5 0 0 0-6 0"/><path d="M16 11h.01"/><path d="M16 7h.01"/><path d="M8 11h.01"/><path d="M8 7h.01"/><rect x="4" y="2" width="16" height="20" rx="2"/></svg>
        };
      case 'resort':
        return {
          bg: 'bg-teal-100', text: 'text-teal-600',
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12a10.06 10.06 1 0 0-20 0Z"/><path d="M12 12v8"/><path d="M9 20h6"/><path d="M2 12h20"/></svg>
        };
      case 'villa':
        return {
          bg: 'bg-purple-100', text: 'text-purple-600',
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 20v-6a2 2 0 0 0-2-2h-3.83a2 2 0 0 1-1.42-.59L12 8.59l-2.75 2.82a2 2 0 0 1-1.42.59H4a2 2 0 0 0-2 2v6"/><path d="M2 20h20"/><path d="M12 2v7"/></svg>
        };
      case 'homestay':
        return {
          bg: 'bg-amber-100', text: 'text-amber-600',
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        };
      case 'restaurant':
      case 'cafe':
        return {
          bg: 'bg-red-100', text: 'text-red-600',
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
        };
      case 'park':
      case 'tourist_attraction':
        return {
          bg: 'bg-green-100', text: 'text-green-600',
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L14 3l-3 4.3a1 1 0 0 0 .8 1.7H12l-2 3.3a1 1 0 0 0 .8 1.7H11l-2 5h4Z"/></svg>
        };
      default:
        return {
          bg: 'bg-slate-100', text: 'text-slate-500',
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        };
    }
  };
  const iconConfig = getIconAndColor(placeType);

  return (
    <div
      className={`w-full text-left p-3 rounded-3xl border transition flex flex-col gap-3 bg-white animate-card-enter shadow-soft ${
        isSelected ? 'border-primary-400 shadow-card ring-4 ring-primary-100 bg-white' : 'border-base-200 hover:border-primary-200 hover:bg-base-50 hover:shadow-card'
      }`}
      style={{ animationDelay: `${Math.min(itemIndex, 8) * 45}ms` }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('placeId', place.id);
        e.dataTransfer.setData('placeData', JSON.stringify(place));
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
        <div className="relative w-24 h-24 rounded-2xl flex-shrink-0 overflow-hidden border border-white/70 shadow-inner bg-base-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={place.name}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={`h-full w-full flex items-center justify-center ${iconConfig.bg} ${iconConfig.text}`}>
              {iconConfig.icon}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent pointer-events-none" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex justify-between items-start">
            <div className="font-black text-ink-900 line-clamp-1 flex-1">{place.name}</div>
            {isSaved && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                  className="p-1 rounded-full hover:bg-base-100 text-ink-500 hover:text-ink-700 transition"
                  title="Tùy chọn"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-1 w-36 map-surface z-50 py-1 font-normal text-xs text-ink-700">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(false);
                        const targetId = (place.source === 'serpapi' && place.sourcePlaceId)
                          ? `serpapi-${place.sourcePlaceId}`
                          : place.id;
                        const copyText = `place:${targetId}:${place.name || place.placeName}`;
                        navigator.clipboard.writeText(copyText).catch(err => console.error(err));
                        window.localStorage.setItem('copied_place', JSON.stringify({ id: targetId, name: place.name || place.placeName, source: place.source, sourcePlaceId: place.sourcePlaceId }));
                        window.dispatchEvent(new CustomEvent('app:place-copied', { detail: { id: targetId, name: place.name || place.placeName, source: place.source, sourcePlaceId: place.sourcePlaceId } }));
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-base-50 flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      Sao chép
                    </button>
                    {onSave && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(false);
                          onSave();
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-1.5 border-t border-slate-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {place.address && (
            <div className="text-xs text-ink-500 line-clamp-2 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-primary-600" />
              <span>{place.address}</span>
            </div>
          )}
          {placeDescription ? (
            <div className="text-xs text-ink-500 line-clamp-2">
              {placeDescription}
            </div>
          ) : null}
          <div className="text-xs text-ink-500 flex items-center flex-wrap gap-2">
            {place.rating && (
              <span className="flex items-center gap-1 shrink-0">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                {place.rating}
              </span>
            )}
            {typeof place.userRatingsTotal === 'number' ? (
              <span className="font-semibold text-ink-600 bg-base-50 px-1.5 py-0.5 rounded border border-base-200 shrink-0 text-[11px]">
                {place.userRatingsTotal.toLocaleString('vi-VN')} đánh giá
              </span>
            ) : null}
            {place.price && (
              <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shrink-0 text-[11px]">
                Từ {place.price}
              </span>
            )}
            {place.priceLevel !== undefined && <span className="shrink-0">💲{place.priceLevel}</span>}
          </div>
          {distanceKm !== null ? (
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-ink-500">
              {distanceKm !== null ? (
                <span className="rounded-full border border-base-200 bg-base-50 px-2 py-0.5">
                  {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`} từ bạn
                </span>
              ) : null}
            </div>
          ) : null}
          {travelTimeMinutes ? (
            <div className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              <Clock3 className="w-3.5 h-3.5" />
              {travelTimeMinutes} phút từ vị trí của bạn
            </div>
          ) : null}
          <div className="text-xs text-ink-700 line-clamp-2">{reviewText}</div>
          {place.amenities && place.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-slate-100">
              {place.amenities.slice(0, 3).map((amenity, idx) => (
                <span
                  key={idx}
                  className="bg-base-50 hover:bg-base-100 text-ink-500 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors border border-base-200/60"
                  title={amenity}
                >
                  {amenity}
                </span>
              ))}
              {place.amenities.length > 3 && (
                <span className="text-[10px] text-slate-400 font-medium self-center ml-0.5">
                  +{place.amenities.length - 3} tiện ích
                </span>
              )}
            </div>
          )}
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
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-2xl border border-primary-200 bg-white text-primary-700 hover:bg-primary-50"
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
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-2xl border border-base-200 bg-white text-ink-700 hover:bg-base-50"
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
            className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-2xl border ${
              isSaved
                ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                : 'border-base-200 text-ink-700 hover:bg-base-50'
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
            className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-2xl border ${
              isCheckedIn
                ? 'border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100'
                : 'border-base-200 text-ink-700 hover:bg-base-50'
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
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-2xl border border-primary-200 text-primary-700 hover:bg-primary-50"
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
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-2xl border border-base-200 text-ink-700 hover:bg-base-50"
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
            className="px-3 py-2 text-sm rounded-2xl border border-base-200 text-ink-700 hover:bg-base-50"
          >
            Chi tiết
          </button>
        ) : null}
      </div> : null}
    </div>
  );
}
