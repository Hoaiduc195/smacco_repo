import React from 'react';
import { ChevronLeft, Sparkles } from 'lucide-react';

export default function LeftContextPanel({ activePanel, onCollapse, children }) {
  const metaByPanel = {
    results: { eyebrow: 'Kết quả AI', title: 'Danh sách tìm kiếm' },
    compare: { eyebrow: 'Bảng làm việc', title: 'So sánh địa điểm' },
    insight: { eyebrow: 'Phân tích AI', title: 'Insight địa điểm' },
    saved: { eyebrow: 'Bộ sưu tập', title: 'Địa điểm đã lưu' },
  };
  const meta = metaByPanel[activePanel] || { eyebrow: 'Bảng làm việc', title: 'Workspace' };

  return (
    <section id="left-context-panel" className="workspace-panel-shell flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-base-200/80 bg-white/80 px-4 py-3 text-ink-900 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-primary-700">{meta.eyebrow}</p>
            <h2 className="text-sm font-black leading-tight">{meta.title}</h2>
          </div>
        </div>
        {onCollapse ? (
          <button
            type="button"
            onClick={onCollapse}
            className="rounded-xl border border-base-200 bg-white px-2 py-1 text-ink-500 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
            title="Thu gọn panel"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </section>
  );
}
