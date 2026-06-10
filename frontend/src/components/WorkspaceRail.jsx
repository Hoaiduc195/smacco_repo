import React from 'react';
import { PanelLeftClose } from 'lucide-react';

export default function WorkspaceRail({
  activePanel,
  items = [],
  secondaryItems = [],
  onTogglePanel,
  onClose,
}) {
  const activeItem = [...items, ...secondaryItems].find((item) => item.id === activePanel);
  const renderButton = ({ id, label, icon: Icon }) => {
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
      </button>
    );
  };

  return (
    <nav
      className="workspace-rail"
      aria-label="Điều hướng bảng làm việc"
      aria-controls="left-context-panel"
    >
      <div className="workspace-rail-brand" aria-hidden="true">
        AI
      </div>

      <div className="workspace-rail-actions" role="toolbar" aria-label="Chọn bảng làm việc">
        {items.map(renderButton)}
      </div>

      {secondaryItems.length ? (
        <div className="workspace-rail-secondary" role="toolbar" aria-label="Bảng phụ">
          {secondaryItems.map(renderButton)}
        </div>
      ) : null}

      {activePanel ? (
        <button
          type="button"
          onClick={onClose}
          className="workspace-rail-close"
          title={`Đóng ${activeItem?.label || 'bảng làm việc'}`}
          aria-label={`Đóng ${activeItem?.label || 'bảng làm việc'}`}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      ) : null}
    </nav>
  );
}
