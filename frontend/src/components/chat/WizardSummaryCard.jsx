import { Pencil } from 'lucide-react';

const WORKFLOW_LABELS = {
  SEARCH_PLACES: { title: 'Xác nhận tìm kiếm', action: 'Bắt đầu tìm kiếm' },
  COMPARE_PLACES: { title: 'Xác nhận so sánh', action: 'Bắt đầu so sánh' },
  ANALYZE_PLACE: { title: 'Xác nhận phân tích', action: 'Bắt đầu phân tích' },
};

function formatValue(step, val) {
  if (val === undefined || val === null || val === '') return 'Bất kỳ';
  if (Array.isArray(val)) {
    if (val.length === 0) return 'Bất kỳ';
    if (step.options) {
      return val
        .map((v) => {
          const opt = step.options.find((o) => o.value === v);
          return opt ? opt.label : v;
        })
        .join(', ');
    }
    return val.join(', ');
  }
  if (step.type === 'stepper') return `${val} người`;
  if (step.type === 'card-radio') {
    const labels = { low: 'Bình dân', mid: 'Tầm trung', high: 'Cao cấp' };
    return labels[val] || val;
  }
  return String(val);
}

export default function WizardSummaryCard({
  workflowId,
  steps = [],
  collectedData = {},
  onConfirm,
  onCancel,
  onEditStep,
}) {
  const labels = WORKFLOW_LABELS[workflowId] || WORKFLOW_LABELS.SEARCH_PLACES;

  return (
    <div className="border-2 border-primary-200 bg-white rounded-2xl shadow-card overflow-hidden animate-soft-in">
      {/* Gradient top accent */}
      <div className="h-1 bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400" />

      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <h4 className="text-xs font-black text-ink-900 flex items-center gap-1.5">
          {labels.title}
        </h4>
        <p className="text-[10px] text-ink-500 font-medium mt-0.5">
          Kiểm tra và chỉnh sửa trước khi thực hiện
        </p>
      </div>

      {/* Summary rows */}
      <div className="px-4 pb-3 space-y-1">
        {steps.map((step, idx) => {
          const val = collectedData[step.id];
          const display = formatValue(step, val);
          const isSkipped = display === 'Bất kỳ';

          return (
            <div
              key={step.id}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-base-50 transition group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold text-ink-500 shrink-0 whitespace-nowrap">
                  {step.title.replace('?', '')}:
                </span>
                <span
                  className={`text-[10px] font-semibold truncate ${
                    isSkipped ? 'text-ink-400 italic' : 'text-ink-900'
                  }`}
                >
                  {display}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onEditStep(idx)}
                className="p-1 text-ink-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                title="Chỉnh sửa"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-base-100 bg-base-50/50">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-3 py-2 bg-white text-ink-700 text-[10px] font-semibold rounded-xl border border-base-200 hover:bg-base-50 transition"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 px-3 py-2 bg-primary-600 text-white text-[10px] font-black rounded-xl hover:bg-primary-700 transition shadow-sm"
        >
          {labels.action}
        </button>
      </div>
    </div>
  );
}
