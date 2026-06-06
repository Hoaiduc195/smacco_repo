import React, { useEffect, useRef, useState } from 'react';
import { BarChart3, Grid3X3, Lightbulb, Search } from 'lucide-react';

const PANEL_ITEMS = [
  { id: 'results', label: 'Danh sách tìm kiếm', icon: Search, offset: 'translate(62px, -82px)' },
  { id: 'compare', label: 'So sánh địa điểm', icon: BarChart3, offset: 'translate(94px, -8px)' },
  { id: 'insight', label: 'Insight địa điểm', icon: Lightbulb, offset: 'translate(62px, 66px)' },
];

export default function RadialPanelMenu({ activePanel, isOpen, onOpenChange, onSelectPanel }) {
  const rootRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const menuOpen = isDesktop ? isHovered || isOpen : isOpen;

  useEffect(() => {
    const syncViewport = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  useEffect(() => {
    if (isDesktop || !isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        onOpenChange?.(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isDesktop, isOpen, onOpenChange]);

  const handleHubClick = () => {
    if (isDesktop) return;
    onOpenChange?.(!isOpen);
  };

  const handleSelectPanel = (panelId) => {
    onSelectPanel(panelId);
    if (!isDesktop) onOpenChange?.(false);
  };

  return (
    <div
      ref={rootRef}
      className="relative h-40 w-48"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`pointer-events-none absolute left-0 top-1/2 h-28 w-28 -translate-x-14 -translate-y-1/2 rounded-full border transition duration-300 ${
          menuOpen ? 'scale-100 border-primary-200 bg-primary-100/40 opacity-100' : 'scale-75 border-transparent opacity-0'
        }`}
      />
      {PANEL_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = activePanel === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => handleSelectPanel(id)}
            title={label}
            className={`absolute left-0 top-1/2 flex h-11 items-center gap-2 rounded-full border px-3 text-xs font-black shadow-soft backdrop-blur-xl transition-all duration-300 ${
              menuOpen ? 'pointer-events-auto opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-75'
            } ${
              isActive
                ? 'border-primary-300 bg-primary-600 text-white shadow-card'
                : 'border-base-200 bg-white/95 text-ink-700 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700'
            }`}
            style={{
              transform: menuOpen ? PANEL_ITEMS.find((item) => item.id === id).offset : 'translate(-14px, -22px)',
              transitionDelay: menuOpen ? `${PANEL_ITEMS.findIndex((item) => item.id === id) * 45}ms` : '0ms',
            }}
            aria-label={label}
            aria-pressed={isActive}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={handleHubClick}
        className={`absolute left-0 top-1/2 flex h-14 w-14 -translate-x-7 -translate-y-1/2 items-center justify-center rounded-full border text-white shadow-xl transition duration-300 ${
          menuOpen
            ? 'border-primary-300 bg-primary-600 shadow-primary-500/30 ring-8 ring-primary-400/15'
            : 'border-ink-700 bg-ink-900 hover:bg-ink-800'
        }`}
        title="Mở AI Workspace"
        aria-label="Mở AI Workspace"
        aria-expanded={menuOpen}
      >
        <Grid3X3 className="h-5 w-5" />
      </button>
    </div>
  );
}
