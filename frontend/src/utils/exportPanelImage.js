import { toPng } from 'html-to-image';

export const sanitizeImageFileName = (value, fallback = 'panel') => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || fallback;
};

export const downloadDataUrl = (dataUrl, fileName) => {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.click();
};

export const exportPanelNodeAsPng = async (node, fileNamePrefix = 'panel') => {
  if (!node) {
    throw new Error('Không tìm thấy nội dung panel để lưu ảnh.');
  }

  node.classList.add('exporting-panel-image');

  try {
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const width = Math.ceil(Math.max(node.scrollWidth, node.clientWidth, node.offsetWidth));
    const height = Math.ceil(Math.max(node.scrollHeight, node.clientHeight, node.offsetHeight));
    const safePrefix = sanitizeImageFileName(fileNamePrefix);
    const dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      width,
      height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        maxHeight: 'none',
        overflow: 'visible',
      },
    });

    downloadDataUrl(dataUrl, `${safePrefix}-${new Date().toISOString().slice(0, 10)}.png`);
  } finally {
    node.classList.remove('exporting-panel-image');
  }
};
