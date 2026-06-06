import React from 'react';
import { ChevronLeft, Sparkles } from 'lucide-react';

export default function LeftContextPanel({ activePanel, onCollapse, children }) {
  const titleByPanel = {
    results: 'Kết quả tìm kiếm',
    compare: 'So sánh địa điểm',
    insight: 'Phân tích địa điểm',
  };

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-base-200/80 bg-white/[0.92] shadow-card backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-base-200 bg-ink-900 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary-400" />
          <span className="text-xs font-black">{titleByPanel[activePanel] || 'Bảng ngữ cảnh AI'}</span>
        </div>
        {onCollapse ? (
          <button
            type="button"
            onClick={onCollapse}
            className="rounded-xl px-2 py-1 text-white/70 transition hover:bg-white/10 hover:text-white"
            title="Thu gọn panel"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}
