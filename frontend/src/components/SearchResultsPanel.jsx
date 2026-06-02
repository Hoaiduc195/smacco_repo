import React from 'react';
import { Heart, Layers, MapPin, MessageSquare, Star, Sparkles } from 'lucide-react';

export default function SearchResultsPanel({
  places = [],
  selectedPlaceId,
  pinnedPlaceIds = [],
  onSelectPlace,
  onPinPlace,
  onComparePlace,
  onAskAI,
  onHoverPlace,
}) {
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
        const matchScore = place.score || Math.floor(85 + (10 - index) * 1.5); // Fallback match score
        const reason = place.reasons || 'Không gian yên tĩnh, thiết kế gỗ ấm cúng phù hợp để thư giãn và ngắm view đồi thông.';

        return (
          <div
            key={place.id || index}
            onMouseEnter={() => onHoverPlace?.(place.id)}
            onMouseLeave={() => onHoverPlace?.(null)}
            onClick={() => onSelectPlace?.(place)}
            className={`p-3 rounded-2xl border transition-all duration-300 cursor-pointer ${
              isSelected
                ? 'bg-primary-50/80 border-primary-300 shadow-soft scale-[1.01]'
                : 'bg-white border-base-200 hover:border-primary-200 hover:shadow-sm'
            }`}
          >
            {/* Upper details */}
            <div className="flex gap-2.5">
              {place.imageUrl ? (
                <img
                  src={place.imageUrl}
                  alt={place.name}
                  className="w-16 h-16 rounded-xl object-cover border border-base-100 flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary-50 border border-primary-100 text-primary-500 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {place.type || 'Stay'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-1">
                  <h4 className="text-xs font-black text-ink-900 truncate leading-tight">{place.name}</h4>
                  <div className="flex items-center gap-1 shrink-0 bg-primary-100/70 border border-primary-200/50 px-1.5 py-0.5 rounded-lg text-[9px] font-black text-primary-800">
                    <Sparkles className="w-2.5 h-2.5 text-primary-600 shrink-0" />
                    <span>{matchScore}% Match</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  {place.address || 'Đà Lạt, Lâm Đồng'}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-bold text-primary-700">
                    {place.price || '800.000 VNĐ / đêm'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded">
                    {place.type || 'Homestay'}
                  </span>
                  {place.rating && (
                    <span className="text-[9px] font-bold text-amber-600 ml-auto flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />
                      {place.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Recommendation Reason */}
            <div className="mt-2.5 p-2 rounded-xl bg-primary-50/40 border border-primary-100/50 text-[10px] text-primary-900 leading-normal">
              <span className="font-bold text-primary-800">Lý do gợi ý: </span>
              {reason}
            </div>

            {/* Actions Footer */}
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPlace?.(place);
                }}
                className="text-[9px] font-bold text-primary-700 hover:underline bg-primary-50/50 px-2 py-1 rounded-lg border border-primary-200/50 flex items-center gap-1"
              >
                <MapPin className="w-3 h-3" />
                Bản đồ
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPinPlace?.(place);
                }}
                className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition flex items-center gap-1 ${
                  isPinned
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isPinned ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                {isPinned ? 'Đã ghim' : 'Ghim'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComparePlace?.(place);
                }}
                className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 hover:bg-indigo-100 px-2 py-1 rounded-lg flex items-center gap-1"
              >
                <Layers className="w-3 h-3 text-indigo-500" />
                So sánh
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAskAI?.(place);
                }}
                className="text-[9px] font-bold text-ink-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1"
              >
                <MessageSquare className="w-3 h-3 text-slate-500" />
                Hỏi AI
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
