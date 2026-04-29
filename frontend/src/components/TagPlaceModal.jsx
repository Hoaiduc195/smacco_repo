import React from 'react';
import { useConversation } from '../contexts/ConversationContext';

export default function TagPlaceModal({ open, onClose }) {
  const { MOCK_PLACES, tagPlace, taggedPlaces } = useConversation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 min-w-[320px] shadow-xl">
        <h2 className="text-lg font-bold mb-4">Chọn địa điểm để tag</h2>
        <ul className="space-y-2 mb-4">
          {MOCK_PLACES.map((place) => (
            <li key={place.id} className="flex items-center gap-2">
              <img src={place.imageUrl} alt={place.name} className="w-8 h-8 rounded object-cover" />
              <span className="flex-1">{place.name}</span>
              <button
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs disabled:bg-gray-300"
                disabled={taggedPlaces.some((p) => p.id === place.id)}
                onClick={() => tagPlace(place.id)}
              >
                Tag
              </button>
            </li>
          ))}
        </ul>
        <button className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
