import { useEffect, useRef, useState } from 'react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function SidebarOverlay({
  isOpen,
  width,
  minWidth = 320,
  maxWidth = 560,
  isMobile = false,
  topOffset = 88,
  onToggle,
  onWidthChange,
  onResizeStateChange,
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

  const panelWidth = isMobile ? 'min(92vw, 430px)' : width;

  return (
    <>
      <div
        className={`absolute z-30 flex transition-transform duration-300 ease-in-out ${
          isMobile ? 'left-2 bottom-3' : 'left-3 sm:left-4 bottom-3 sm:bottom-4'
        } ${isOpen ? '' : 'pointer-events-none'}`}
        style={{
          width: panelWidth,
          top: isMobile ? topOffset + 8 : topOffset,
          transform: isOpen ? 'translateX(0)' : 'translateX(calc(-100% - 20px))',
        }}
      >
        <div
          className={`relative h-full bg-white border border-base-200 rounded-3xl shadow-card overflow-hidden flex flex-col transition-[width] duration-300 ease-in-out ${
            dragging ? 'transition-none' : ''
          }`}
          style={{ width: panelWidth }}
        >
          <div className="px-3 py-3 border-b border-base-200 flex items-center justify-between bg-ink-900">
            <span className="pl-2 text-xs font-bold uppercase tracking-wide text-white">Khám phá</span>
            <button
              onClick={() => onToggle?.(false)}
              className="p-2.5 text-white hover:text-white hover:bg-primary-700 rounded-xl transition-colors"
              aria-label="Thu gọn danh sách"
            >
              <ChevronsLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 bg-white">
            {children}
          </div>

          {isOpen && !isMobile ? (
            <div
              onMouseDown={handleMouseDown}
              className="absolute top-0 right-[-8px] h-full w-4 cursor-col-resize flex items-center justify-center"
            >
              <div className="h-14 w-2 rounded-full bg-white shadow border border-primary-100" />
            </div>
          ) : null}
        </div>
      </div>

      {!isOpen ? (
        <button
          onClick={() => onToggle?.(true)}
          className={`absolute z-30 p-2.5 rounded-r-xl bg-white border border-base-200 shadow-soft text-ink-700 hover:text-ink-900 hover:bg-primary-50 transition-all duration-200 ease-in-out ${
            isMobile ? 'left-0 top-28' : 'left-0 top-24'
          }`}
          aria-label="Mở danh sách"
          title="Mở danh sách"
        >
          <ChevronsRight className="w-6 h-6" />
        </button>
      ) : null}
    </>
  );
}
