import React, { useRef } from 'react';
import { Lightbulb, MapPin, Sparkles } from 'lucide-react';
import AreaInsightPanel from './AreaInsightPanel';
import PanelImageExportButton from './PanelImageExportButton';

export default function PlaceInsightPanel({
  selectedPlace,
  taggedPlaces = [],
  insight,
  onRequestInsight,
  onAskAIAboutPlace,
  onDirections,
}) {
  const exportRef = useRef(null);
  const insightPlace = insight?.place || (taggedPlaces.length === 1 ? taggedPlaces[0] : selectedPlace);

  if (taggedPlaces.length !== 1 && !insight) {
    return (
      <div className="workspace-empty-state">
        <Lightbulb className="h-5 w-5 text-primary-600" />
        <h3>Cần tag đúng 1 địa điểm</h3>
        <p>Insight chi tiết chỉ áp dụng khi bạn giữ đúng một địa điểm trong danh sách tag AI.</p>
      </div>
    );
  }

  const location = insight?.location || insightPlace?.address || insightPlace?.name || 'Địa điểm';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="relative flex-1 overflow-y-auto p-3">
        {insight ? (
          <div className="pointer-events-none sticky top-0 z-10 flex justify-end">
            <div className="pointer-events-auto rounded-2xl bg-white/92 p-1 shadow-soft backdrop-blur-sm">
              <PanelImageExportButton
                targetRef={exportRef}
                fileName={insight.title || insightPlace?.name || 'insight-dia-diem'}
              />
            </div>
          </div>
        ) : null}
        <div ref={exportRef} className="bg-white">
          {insight ? (
            <AreaInsightPanel location={location} insights={insight} />
          ) : (
            <div className="space-y-3">
              <div className="rounded-3xl border border-primary-100 bg-primary-50/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-soft">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-ink-900">Insight chi tiết bằng AI</h4>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                      AI sẽ phân tích di chuyển từ vị trí hiện tại hoặc điểm xuất phát bạn chọn, điểm mạnh/yếu,
                      mục đích chuyến đi, địa danh xung quanh, khung giờ phù hợp và reviews.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-base-200 bg-white p-3">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-xs font-black text-ink-900">{insightPlace?.name}</p>
                    {insightPlace?.address ? (
                      <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-500">
                        {insightPlace.address}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRequestInsight?.(insightPlace)}
                className="w-full rounded-2xl bg-ink-900 px-4 py-3 text-sm font-black text-white shadow-soft transition hover:bg-ink-700"
              >
                Tạo insight chi tiết
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
