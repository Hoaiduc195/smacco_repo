import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigation, Star, BookmarkPlus, BookmarkCheck, Tag, Check } from 'lucide-react';

let transparentDragImage = null;

function getTransparentDragImage() {
  if (transparentDragImage) return transparentDragImage;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  transparentDragImage = canvas;
  return transparentDragImage;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function PlaceCard({
  place,
  itemIndex = 0,
  imageUrl,
  userLocation = null,
  isSelected,
  onSelect,
  onDirections,
  onShowDetails,
  onNavigate,
  onSave,
  isSaved,
  saveMode = 'save',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragGhost, setDragGhost] = useState(null);
  const absorbDropRef = useRef(false);
  const resetTimerRef = useRef(null);
  const placeType = place.type?.toLowerCase();
  
  const getIconAndColor = (type) => {
    switch (type) {
      case 'hotel':
        return {
          bg: 'bg-blue-100', text: 'text-blue-600',
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M10 22v-6.57"/><path d="M12 11h.01"/><path d="M12 7h.01"/><path d="M14 15.43V22"/><path d="M15 16a5 5 0 0 0-6 0"/><path d="M16 11h.01"/><path d="M16 7h.01"/><path d="M8 11h.01"/><path d="M8 7h.01"/></svg>
        };
      case 'resort':
        return {
          bg: 'bg-teal-100', text: 'text-teal-600',
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12a10.06 10.06 1 0 0-20 0Z"/><path d="M12 12v8"/><path d="M9 20h6"/><path d="M2 12h20"/></svg>
        };
      case 'villa':
        return {
          bg: 'bg-purple-100', text: 'text-purple-600',
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 20v-6a2 2 0 0 0-2-2h-3.83a2 2 0 0 1-1.42-.59L12 8.59l-2.75 2.82a2 2 0 0 1-1.42.59H4a2 2 0 0 0-2 2v6"/><path d="M2 20h20"/><path d="M12 2v7"/></svg>
        };
      case 'homestay':
        return {
          bg: 'bg-amber-100', text: 'text-amber-600',
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        };
      case 'restaurant':
      case 'cafe':
        return {
          bg: 'bg-red-100', text: 'text-red-600',
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
        };
      case 'park':
      case 'tourist_attraction':
        return {
          bg: 'bg-green-100', text: 'text-green-600',
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L14 3l-3 4.3a1 1 0 0 0 .8 1.7H12l-2 3.3a1 1 0 0 0 .8 1.7H11l-2 5h4Z"/></svg>
        };
      default:
        return {
          bg: 'bg-slate-100', text: 'text-slate-500',
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        };
    }
  };
  const iconConfig = getIconAndColor(placeType);
  const ratingValue = place.rating || place.averageRating;
  const roundedRating = ratingValue ? Math.round(ratingValue) : null;
  const displayAddress = place.address || place.placeAddress || place.formattedAddress || '';
  const displayImg = imageUrl || place.imageUrl || place.photoUrl || place.image || place.coverImageUrl;
  const SaveIcon = saveMode === 'tag' ? Tag : BookmarkPlus;
  const SavedIcon = saveMode === 'tag' ? Check : BookmarkCheck;
  const saveLabel = saveMode === 'tag' ? 'Tag' : 'Lưu';
  const savedLabel = saveMode === 'tag' ? 'Đã tag' : 'Đã lưu';

  const resetDragState = (notify = true) => {
    absorbDropRef.current = false;
    window.clearTimeout(resetTimerRef.current);
    setIsDragging(false);
    setDragGhost(null);

    if (notify) {
      window.dispatchEvent(new CustomEvent('app:place-drag-end'));
    }
  };

  useEffect(() => () => {
    window.clearTimeout(resetTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isDragging) return undefined;

    const syncDragGhost = (event) => {
      if (!event.clientX && !event.clientY) return;

      setDragGhost((current) => {
        if (!current) return current;
        if (current.absorbing) return current;

        const x = Math.round(event.clientX);
        const y = Math.round(event.clientY);
        const deltaX = x - current.x;
        const tilt = clamp((current.tilt * 0.82) + (deltaX * 0.06), -3, 3);

        return {
          ...current,
          x,
          y,
          tilt,
        };
      });
    };

    const stopDragging = () => {
      if (absorbDropRef.current) return;
      resetDragState();
    };

    const handleDropAccepted = (event) => {
      if (String(event.detail?.placeId) !== String(place.id)) return;

      const target = event.detail?.target;
      if (!target) {
        resetDragState();
        return;
      }

      absorbDropRef.current = true;
      window.clearTimeout(resetTimerRef.current);

      setDragGhost((current) => {
        if (!current) return current;

        return {
          ...current,
          x: Math.round(target.x),
          y: Math.round(target.y),
          offsetX: current.width / 2,
          offsetY: (current.height || 112) / 2,
          tilt: 0,
          absorbing: true,
        };
      });

      resetTimerRef.current = window.setTimeout(() => {
        resetDragState();
      }, 320);
    };

    window.addEventListener('dragover', syncDragGhost);
    window.addEventListener('drop', stopDragging);
    window.addEventListener('dragend', stopDragging);
    window.addEventListener('app:place-drop-accepted', handleDropAccepted);

    return () => {
      window.removeEventListener('dragover', syncDragGhost);
      window.removeEventListener('drop', stopDragging);
      window.removeEventListener('dragend', stopDragging);
      window.removeEventListener('app:place-drop-accepted', handleDropAccepted);
    };
  }, [isDragging, place.id]);

  const syncDragGhostFromEvent = (event) => {
    if (!event.clientX && !event.clientY) return;

    setDragGhost((current) => {
      if (!current) return current;
      if (current.absorbing) return current;

      const x = Math.round(event.clientX);
      const y = Math.round(event.clientY);
      const deltaX = x - current.x;
      return {
        ...current,
        x,
        y,
        tilt: clamp((current.tilt * 0.82) + (deltaX * 0.06), -3, 3),
      };
    });
  };

  const renderCardContent = ({ hidden = false } = {}) => (
    <>
      <div className={`flex gap-3 ${hidden ? 'pointer-events-none opacity-0' : ''}`}>
        <div className="relative w-20 h-20 rounded-2xl flex-shrink-0 overflow-hidden border border-white/70 shadow-inner bg-base-100">
          {displayImg ? (
            <img
              src={displayImg}
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
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <div className="font-black text-ink-900 line-clamp-2 leading-snug">{place.name}</div>
          {displayAddress && (
            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{displayAddress}</div>
          )}
          {roundedRating !== null && (
            <div className="flex items-center gap-1 text-xs text-ink-600 font-semibold mt-1">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span>{roundedRating} / 5</span>
            </div>
          )}
        </div>
      </div>
      
      <div className={`flex gap-2 ${hidden ? 'pointer-events-none opacity-0' : ''}`}>
        {onSave && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition ${
              isSaved
                ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                : 'border-base-200 text-ink-700 hover:bg-base-50'
            }`}
          >
            {isSaved ? <SavedIcon className="w-3.5 h-3.5" /> : <SaveIcon className="w-3.5 h-3.5" />}
            <span>{isSaved ? savedLabel : saveLabel}</span>
          </button>
        )}
        {onDirections && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDirections();
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-base-200 text-ink-700 hover:bg-base-50 transition"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Chỉ đường</span>
          </button>
        )}
        {(onNavigate || onShowDetails) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onNavigate) onNavigate();
              else if (onShowDetails) onShowDetails();
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-primary-200 bg-white text-primary-700 hover:bg-primary-50 transition"
          >
            <span>Chi tiết</span>
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
    <div
      className={`relative w-full cursor-grab text-left p-3 rounded-3xl border transition flex flex-col gap-3 animate-card-enter active:cursor-grabbing ${
        isDragging
          ? 'scale-[0.985] border-dashed border-slate-300 bg-slate-100 shadow-inner ring-0'
          : isSelected ? 'border-primary-400 bg-white shadow-soft ring-4 ring-primary-100' : 'border-base-200 bg-white/[0.92] hover:border-primary-200 hover:bg-base-50 hover:shadow-soft'
      }`}
      style={{ animationDelay: `${Math.min(itemIndex, 8) * 45}ms` }}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (!onSelect) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => {
        absorbDropRef.current = false;
        window.clearTimeout(resetTimerRef.current);
        e.dataTransfer.setData('placeId', place.id);
        e.dataTransfer.setData('placeData', JSON.stringify(place));
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setDragImage(getTransparentDragImage(), 0, 0);
        window.dispatchEvent(new CustomEvent('app:place-drag-start', { detail: { place } }));

        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.round(e.clientX || rect.left + 24);
        const y = Math.round(e.clientY || rect.top + 24);
        const offsetX = clamp(x - rect.left, 24, Math.max(rect.width - 24, 24));
        const offsetY = clamp(y - rect.top, 20, Math.max(rect.height - 20, 20));

        setDragGhost({
          x,
          y,
          offsetX,
          offsetY,
          width: Math.min(rect.width || 320, 380),
          height: rect.height || 112,
          tilt: -1.2,
          absorbing: false,
        });
        setIsDragging(true);
      }}
      onDrag={syncDragGhostFromEvent}
      onDragEnd={() => {
        if (absorbDropRef.current) return;
        resetDragState();
      }}
    >
      {isDragging ? (
        <div className="place-card-source-placeholder absolute inset-3 flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-200/70 text-xs font-black uppercase tracking-wide text-slate-500">
          Đang kéo địa điểm
        </div>
      ) : null}
      {renderCardContent({ hidden: isDragging })}
    </div>
    {isDragging && dragGhost ? createPortal(
      <div
        aria-hidden="true"
        className={`place-card-drag-overlay fixed pointer-events-none select-none ${dragGhost.absorbing ? 'place-card-drag-overlay--absorbing' : ''}`}
        style={{
          left: 0,
          top: 0,
          width: `${dragGhost.width}px`,
          transform: `translate3d(${Math.round(dragGhost.x - dragGhost.offsetX)}px, ${Math.round(dragGhost.y - dragGhost.offsetY - (dragGhost.absorbing ? 0 : 10))}px, 0) rotate(${dragGhost.tilt.toFixed(2)}deg) scale(${dragGhost.absorbing ? '0.18' : '1.035'})`,
        }}
      >
        <div className="place-card-drag-overlay-inner flex w-full flex-col gap-3 rounded-3xl border border-primary-200 bg-white p-3 text-left">
          {renderCardContent()}
        </div>
      </div>,
      document.body,
    ) : null}
    </>
  );
}
