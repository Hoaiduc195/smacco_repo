import React from 'react';
import { useConversation } from '../contexts/ConversationContext';
import { MapPin } from 'lucide-react';

export default function TaggedPlacesBar() {
  const { taggedPlaces, untagPlace } = useConversation();
  if (!taggedPlaces.length) return null;
  return (
    <div className="flex gap-2 px-4 py-2 bg-blue-50 border-b border-blue-100">
      {taggedPlaces.map((place) => (
        <span key={place.id} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          <MapPin className="w-3.5 h-3.5" />
          {place.name}
          <button className="ml-1 text-blue-500 hover:text-red-500" onClick={() => untagPlace(place.id)} title="Bỏ tag">×</button>
        </span>
      ))}
    </div>
  );
}
