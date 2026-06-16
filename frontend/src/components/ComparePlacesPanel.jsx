import React, { useRef } from 'react';
import { Layers3, MapPin, Sparkles, Tags, X } from 'lucide-react';
import { PlaceComparisonTable } from './chat/PlaceComparisonResult';
import PanelImageExportButton from './PanelImageExportButton';

export default function ComparePlacesPanel({
  taggedPlaces = [],
  selectedPlaceId,
  onSelectPlace,
  onRemoveTaggedPlace,
  comparisonResult,
}) {
  const exportRef = useRef(null);
  const introCardClass = 'rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-accent-50/60 p-4 shadow-soft';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="relative flex-1 overflow-y-auto p-3">
        {comparisonResult ? (
          <div className="pointer-events-none sticky top-0 z-10 mb-2 flex justify-end">
            <div className="pointer-events-auto rounded-2xl bg-white/92 p-1 shadow-soft backdrop-blur-sm">
              <PanelImageExportButton
                targetRef={exportRef}
                fileName="so-sanh-dia-diem"
              />
            </div>
          </div>
        ) : null}
        <div ref={exportRef} className="bg-white">
          {comparisonResult ? (
            <div className="space-y-3 pb-2">
              <div className={introCardClass}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-soft">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-ink-900">So sánh đa chiều bằng AI</h4>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                      Bảng dưới đây gom các tiêu chí thực tế để giúp bạn nhìn nhanh điểm mạnh, điểm yếu,
                      khác biệt nổi bật và những đánh đổi cần cân nhắc giữa các địa điểm.
                    </p>
                  </div>
                </div>
              </div>

              <PlaceComparisonTable data={comparisonResult} />
            </div>
          ) : taggedPlaces.length < 2 ? (
            <div className="workspace-empty-state">
              <Tags className="h-5 w-5 text-primary-600" />
              <h3>Cần ít nhất 2 địa điểm</h3>
              <p>Tag các địa điểm từ kết quả tìm kiếm hoặc chat để AI có tập dữ liệu so sánh thật.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className={introCardClass}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-soft">
                    <Layers3 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-ink-900">Chuẩn bị bộ so sánh AI</h4>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                      Giữ lại những địa điểm bạn thật sự đang phân vân. Khi chat yêu cầu so sánh, AI sẽ dùng
                      đúng danh sách này để tạo bảng đối chiếu theo vị trí, trải nghiệm, tiện ích và mức độ phù hợp.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-base-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-primary-600" />
                  <div>
                    <p className="text-xs font-black text-ink-900">{taggedPlaces.length} địa điểm đang được đưa vào so sánh</p>
                    <p className="mt-0.5 text-[11px] font-semibold leading-4 text-slate-500">
                      Chọn một địa điểm để xem trên bản đồ hoặc bỏ bớt những mục không còn cần đối chiếu.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {taggedPlaces.map((place) => {
                  const isSelected = place.id === selectedPlaceId;
                  return (
                    <article
                      key={place.id}
                      className={`w-full rounded-2xl border p-3 text-left transition ${
                        isSelected
                          ? 'border-primary-300 bg-primary-50 shadow-soft'
                          : 'border-base-200 bg-white/90 hover:border-primary-200 hover:bg-primary-50/40'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectPlace?.(place)}
                          className="flex min-w-0 flex-1 items-start gap-2 text-left"
                        >
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-1 text-xs font-black text-ink-900">
                              {place.name || place.placeName}
                            </div>
                            {place.address ? (
                              <div className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-slate-500">
                                {place.address}
                              </div>
                            ) : null}
                            {place.rating || place.averageRating ? (
                              <div className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700 ring-1 ring-amber-100">
                                Rating {place.rating || place.averageRating}/5
                              </div>
                            ) : null}
                          </div>
                        </button>
                        {onRemoveTaggedPlace ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onRemoveTaggedPlace(place.id);
                            }}
                            className="rounded-lg p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Bỏ tag"
                            aria-label={`Bỏ tag ${place.name || place.placeName || 'địa điểm'}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
