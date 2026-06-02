import React from 'react';
import { Calendar, Layers, MessageSquare, Trash2 } from 'lucide-react';

export default function PinnedPlacesPanel({
  pinnedPlaces = [],
  onRemovePin,
  onCompareSelected,
  onAskAISelected,
  onCreateItinerary,
  onSelectPlace,
}) {
  if (!pinnedPlaces || pinnedPlaces.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-400">
        Chưa có địa điểm nào được ghim. Nhấp vào nút "Ghim" ở danh sách kết quả để lưu lại các địa điểm quan tâm.
      </div>
    );
  }

  return (
    <div className="space-y-3 p-1 max-h-[500px] overflow-y-auto pr-2">
      {/* Global Actions Bar */}
      {pinnedPlaces.length >= 2 && (
        <div className="flex gap-2 justify-end mb-1">
          <button
            onClick={() => onCompareSelected?.(pinnedPlaces)}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black flex items-center gap-1 shadow-sm transition"
          >
            <Layers className="w-3 h-3" />
            So sánh ({pinnedPlaces.length})
          </button>
          <button
            onClick={() => onAskAISelected?.(pinnedPlaces)}
            className="px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[9px] font-black flex items-center gap-1 shadow-sm transition"
          >
            <MessageSquare className="w-3 h-3" />
            Hỏi AI về các địa điểm
          </button>
        </div>
      )}

      {/* Places List */}
      <div className="space-y-2">
        {pinnedPlaces.map((place, idx) => (
          <div
            key={place.id || idx}
            onClick={() => onSelectPlace?.(place)}
            className="p-2.5 rounded-xl border border-base-200 bg-white hover:border-primary-200 flex items-center justify-between gap-3 cursor-pointer transition"
          >
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-ink-900 truncate leading-none">{place.name}</h4>
              <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-500">
                <span className="font-semibold text-primary-700">{place.price || '800.000đ/đêm'}</span>
                <span>•</span>
                <span className="truncate">{place.address || 'Đà Lạt, Lâm Đồng'}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateItinerary?.(place);
                }}
                className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 text-[9px] font-black flex items-center gap-1"
                title="Lên lịch trình quanh chỗ này"
              >
                <Calendar className="w-3.5 h-3.5" />
                Lịch trình
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePin?.(place.id);
                }}
                className="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 text-[9px] font-black flex items-center gap-1"
                title="Bỏ ghim"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Bỏ ghim
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
