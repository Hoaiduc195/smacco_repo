import { useEffect, useRef, useState } from 'react';
import { ChevronsLeft, ChevronsRight, StretchHorizontal } from 'lucide-react';

export default function SidebarOverlay({
  isOpen,
  width,
  minWidth = 320,
  maxWidth = 560,
  onToggle,
  onWidthChange,
  onResizeStateChange,
  header,
  children,
}) {
  const [dragging, setDragging] = useState(false);
  const rafRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);

  const clampWidth = (value) => Math.min(maxWidth, Math.max(minWidth, value));

  const handleMouseDown = (event) => {
    startXRef.current = event.clientX;
    startWidthRef.current = width;
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return undefined;
    onResizeStateChange?.(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMove = (event) => {
      const delta = event.clientX - startXRef.current;
      const nextWidth = clampWidth(startWidthRef.current + delta);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => onWidthChange?.(nextWidth));
    };

    const stopDragging = () => setDragging(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', stopDragging);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', stopDragging);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [dragging, onResizeStateChange, onWidthChange]);

  useEffect(() => {
    if (!dragging) onResizeStateChange?.(false);
  }, [dragging, onResizeStateChange]);

  const panelWidth = isOpen ? width : 56;

  return (
    <div
      className="absolute left-4 top-4 bottom-4 z-30 flex"
      style={{ width: panelWidth }}
    >
      <div
        className={`relative h-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden flex flex-col transition-[width,transform,opacity] duration-250 ease-out ${
          dragging ? 'transition-none' : ''
        } ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-90 translate-x-[-6px]'}`}
        style={{ width: panelWidth }}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="min-w-0 flex-1">{header}</div>
          <div className="flex items-center gap-2">
            {isOpen && (
              <button
                onClick={() => onWidthChange?.(clampWidth(width >= 440 ? 340 : width + 50))}
                className="p-3 text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl"
                aria-label="Điều chỉnh độ rộng danh sách"
                title="Điều chỉnh độ rộng danh sách"
              >
                <StretchHorizontal className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => onToggle?.(!isOpen)}
              className="p-3 text-gray-700 hover:text-gray-900"
              aria-label={isOpen ? 'Thu gọn danh sách' : 'Mở danh sách'}
            >
              {isOpen ? <ChevronsLeft className="w-6 h-6" /> : <ChevronsRight className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 bg-white/80 backdrop-blur-sm">
          {children}
        </div>

        {isOpen ? (
          <div
            onMouseDown={handleMouseDown}
            className="absolute top-0 right-[-8px] h-full w-4 cursor-col-resize flex items-center justify-center"
          >
            <div className="h-14 w-2 rounded-full bg-gray-200 shadow" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
