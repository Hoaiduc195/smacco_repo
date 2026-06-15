import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { exportPanelNodeAsPng } from '../utils/exportPanelImage';

export default function PanelImageExportButton({
  targetRef,
  fileName,
  disabled = false,
  className = '',
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async (event) => {
    event.stopPropagation();
    if (disabled || isExporting) return;

    try {
      setError('');
      setIsExporting(true);
      await exportPanelNodeAsPng(targetRef.current, fileName);
    } catch (err) {
      console.error('Không thể lưu ảnh panel:', err);
      setError(err?.message || 'Không thể lưu ảnh panel.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleExport}
        disabled={disabled || isExporting}
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-base-200 bg-white/95 text-ink-700 shadow-sm backdrop-blur transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        title={isExporting ? 'Đang lưu ảnh...' : 'Lưu ảnh panel'}
        aria-label={isExporting ? 'Đang lưu ảnh panel' : 'Lưu ảnh panel'}
      >
        {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      </button>
      {error ? (
        <div className="absolute right-0 top-9 z-20 w-52 rounded-xl border border-rose-200 bg-white px-3 py-2 text-[11px] font-semibold leading-4 text-rose-700 shadow-card">
          {error}
        </div>
      ) : null}
    </div>
  );
}
