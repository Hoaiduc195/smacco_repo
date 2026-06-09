import React from 'react';
import { PanelLeftClose } from 'lucide-react';

export default function WorkspaceRail({
  activePanel,
  items = [],
  onTogglePanel,
  onClose,
}) {
  return (
    <nav
      className="workspace-rail"
      aria-label="Điều hướng Bảng AI"
      aria-controls="left-context-panel"
    >
      <div className="workspace-rail-brand" aria-hidden="true">
        AI
      </div>

      <div className="workspace-rail-actions" role="toolbar" aria-label="Chọn bảng làm việc">
        {items.map(({ id, label, shortLabel, icon: Icon }) => {
          const isActive = activePanel === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTogglePanel?.(id)}
              className={`workspace-rail-button ${isActive ? 'is-active' : ''}`}
              title={label}
              aria-label={label}
              aria-pressed={isActive}
              aria-expanded={isActive}
            >
              <Icon className="h-4 w-4" />
              <span>{shortLabel}</span>
            </button>
          );
        })}
      </div>

      {activePanel ? (
        <button
          type="button"
          onClick={onClose}
          className="workspace-rail-close"
          title="Đóng Bảng AI"
          aria-label="Đóng Bảng AI"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      ) : null}
    </nav>
  );
}
