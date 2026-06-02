import React from 'react';
import { useConversation } from '../contexts/ConversationContext';

export default function TagPlaceModal({ open, onClose }) {
  const { tagPlace, taggedPlaces } = useConversation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-ink-900/30 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="surface-card-solid p-6 min-w-[320px] max-w-md">
        <h2 className="text-lg font-black mb-4 text-ink-900">Chọn địa điểm để tag</h2>
        <ul className="space-y-2 mb-4">
          <p className="text-sm leading-6 text-ink-500">Tính năng này sẽ sớm được hỗ trợ tìm kiếm địa điểm thật. Hiện tại vui lòng kéo-thả địa điểm vào khung chat.</p>
        </ul>
        <button className="btn-secondary mt-2 px-4 py-2" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
