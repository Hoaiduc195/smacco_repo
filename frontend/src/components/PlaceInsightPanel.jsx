import React from 'react';
import AreaInsightPanel from './AreaInsightPanel';

export default function PlaceInsightPanel({
  selectedPlace,
  insight,
  onAskAIAboutPlace,
  onDirections,
}) {
  if (!selectedPlace && !insight) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-xs font-semibold text-slate-400">
        Chọn một địa điểm trên bản đồ hoặc trong kết quả tìm kiếm để xem insight.
      </div>
    );
  }

  const location = insight?.location || selectedPlace?.address || selectedPlace?.name || 'Địa điểm';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-base-200 px-4 py-3">
        <p className="text-[10px] font-black uppercase text-primary-700">Place Insight</p>
        <h2 className="mt-0.5 line-clamp-1 text-sm font-black text-ink-900">
          {selectedPlace?.name || 'Insight địa điểm'}
        </h2>
        {selectedPlace?.address ? (
          <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-slate-500">{selectedPlace.address}</p>
        ) : null}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <AreaInsightPanel location={location} insights={insight} />
      </div>
      {selectedPlace ? (
        <div className="flex gap-2 border-t border-base-200 p-3">
          {onDirections ? (
            <button
              type="button"
              onClick={() => onDirections(selectedPlace)}
              className="flex-1 rounded-xl border border-base-200 px-3 py-2 text-xs font-bold text-ink-700 transition hover:bg-base-50"
            >
              Chỉ đường
            </button>
          ) : null}
          {onAskAIAboutPlace ? (
            <button
              type="button"
              onClick={() => onAskAIAboutPlace(selectedPlace)}
              className="flex-1 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-bold text-primary-700 transition hover:bg-primary-100"
            >
              Hỏi AI
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
