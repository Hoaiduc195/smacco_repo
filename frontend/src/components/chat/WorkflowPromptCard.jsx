import { AlertCircle, GitCompareArrows, MapPin, Microscope, Search } from 'lucide-react';

const WORKFLOW_UI = {
  SEARCH_PLACES: { icon: Search, title: 'Tìm kiếm chỗ ở', action: 'tìm kiếm chỗ ở phù hợp' },
  COMPARE_PLACES: { icon: GitCompareArrows, title: 'So sánh địa điểm', action: 'so sánh các địa điểm đã tag' },
  ANALYZE_PLACE: { icon: Microscope, title: 'Phân tích chi tiết', action: 'phân tích chi tiết địa điểm' },
};

export default function WorkflowPromptCard({
  workflowId,
  params,
  query,
  taggedPlaces = [],
  onAccept,
  onDecline,
}) {
  const meta = WORKFLOW_UI[workflowId] || WORKFLOW_UI.SEARCH_PLACES;
  const Icon = meta.icon;

  const hasTagWarning =
    (workflowId === 'COMPARE_PLACES' && taggedPlaces.length < 2) ||
    (workflowId === 'ANALYZE_PLACE' && taggedPlaces.length < 1);

  const tagWarningText =
    workflowId === 'COMPARE_PLACES'
      ? 'Hãy tag ít nhất 2 địa điểm để so sánh'
      : 'Hãy tag 1 địa điểm để phân tích';

  return (
    <div className="border border-primary-200 bg-white rounded-2xl p-4 shadow-soft space-y-3 animate-soft-in">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600 shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-black text-ink-900">{meta.title}</h4>
          <p className="text-[10px] text-ink-500 font-medium mt-0.5">
            Tôi nhận thấy bạn muốn {meta.action}. Bạn muốn tôi hỗ trợ không?
          </p>
        </div>
      </div>

      {/* Context preview — search params */}
      {workflowId === 'SEARCH_PLACES' && params && (
        <div className="flex flex-wrap gap-1.5">
          {params.location && (
            <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-primary-200">
              <MapPin className="w-2.5 h-2.5" />
              {params.location}
            </span>
          )}
          {params.type && (
            <span className="bg-base-100 text-ink-700 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-base-200">
              {params.type}
            </span>
          )}
          {params.types && params.types.length > 0 && (
            <span className="bg-base-100 text-ink-700 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-base-200">
              {params.types.join(', ')}
            </span>
          )}
          {params.budget && (
            <span className="bg-base-100 text-ink-700 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-base-200">
              {params.budget}
            </span>
          )}
          {query && (
            <span className="bg-base-50 text-ink-600 px-2 py-0.5 rounded-full text-[10px] font-medium border border-base-200 italic max-w-[12rem] truncate">
              "{query}"
            </span>
          )}
        </div>
      )}

      {/* Context preview — tagged places */}
      {(workflowId === 'COMPARE_PLACES' || workflowId === 'ANALYZE_PLACE') && taggedPlaces.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {taggedPlaces.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 bg-ink-900 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold"
            >
              <MapPin className="w-2.5 h-2.5 text-primary-300" />
              {p.name}
            </span>
          ))}
        </div>
      )}

      {/* Tag warning */}
      {hasTagWarning && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="text-[10px] font-semibold text-amber-800">{tagWarningText}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onAccept}
          disabled={hasTagWarning}
          className="flex-1 px-3 py-2 bg-primary-600 text-white text-[11px] font-black rounded-xl hover:bg-primary-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Bắt đầu
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="flex-1 px-3 py-2 bg-white text-ink-700 text-[11px] font-semibold rounded-xl border border-base-200 hover:bg-base-50 transition"
        >
          Không, tiếp tục chat
        </button>
      </div>
    </div>
  );
}
