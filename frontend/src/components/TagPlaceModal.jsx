import React from 'react';
import { useConversation } from '../contexts/ConversationContext';

export default function TagPlaceModal({ open, onClose }) {
  const { tagPlace, taggedPlaces } = useConversation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 min-w-[320px] shadow-xl">
        <h2 className="text-lg font-bold mb-4">Chọn địa điểm để tag</h2>
        <ul className="space-y-2 mb-4">
          <p className="text-sm text-gray-500">Tính năng này sẽ sớm được hỗ trợ tìm kiếm địa điểm thật. Hiện tại vui lòng kéo-thả địa điểm vào khung chat.</p>
        </ul>
        <button className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
