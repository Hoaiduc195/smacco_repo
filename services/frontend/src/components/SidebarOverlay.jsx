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
        className={`absolute z-30 flex transition-all duration-300 ease-in-out ${
          isMobile ? 'left-2 bottom-3' : 'left-3 sm:left-4 bottom-3 sm:bottom-4'
        } ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{
          width: panelWidth,
          top: isMobile ? topOffset + 8 : topOffset,
          transform: isOpen ? 'translateX(0)' : 'translateX(calc(-100% - 20px))',
        }}
      >
        <div
          className={`relative h-full bg-white/95 border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-[width] duration-300 ease-in-out backdrop-blur-md ${
            dragging ? 'transition-none' : ''
          }`}
          style={{ width: panelWidth }}
        >
          <div className="px-3 py-3 border-b border-slate-100 flex items-center justify-end bg-gradient-to-r from-white to-sky-50">
            <button
              onClick={() => onToggle?.(false)}
              className="p-2.5 text-slate-700 hover:text-slate-900"
              aria-label="Thu gọn danh sách"
            >
              <ChevronsLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 bg-white/70 backdrop-blur-sm">
            {children}
          </div>

          {isOpen && !isMobile ? (
            <div
              onMouseDown={handleMouseDown}
              className="absolute top-0 right-[-8px] h-full w-4 cursor-col-resize flex items-center justify-center"
            >
              <div className="h-14 w-2 rounded-full bg-sky-200 shadow" />
            </div>
          ) : null}
        </div>
      </div>

      {!isOpen ? (
        <button
          onClick={() => onToggle?.(true)}
          className={`absolute z-30 p-2.5 rounded-r-xl bg-white/95 border border-slate-200 shadow-lg text-slate-700 hover:text-slate-900 transition-all duration-200 ease-in-out ${
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
