import React from 'react';
import { useConversation } from '../contexts/ConversationContext';

export default function TaggedPlacesBar() {
  const { taggedPlaces, untagPlace } = useConversation();
  if (!taggedPlaces.length) return null;
  return (
    <div className="flex gap-2 px-4 py-2 bg-blue-50 border-b border-blue-100">
      {taggedPlaces.map((place) => (
        <span key={place.id} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          <img src={place.imageUrl} alt={place.name} className="w-5 h-5 rounded-full object-cover" />
          {place.name}
          <button className="ml-1 text-blue-500 hover:text-red-500" onClick={() => untagPlace(place.id)} title="Bỏ tag">×</button>
        </span>
      ))}
    </div>
  );
}
