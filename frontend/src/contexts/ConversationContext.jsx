import React, { createContext, useContext, useState } from 'react';

// Mock data for places
const MOCK_PLACES = [
  { id: '1', name: 'Hồ Gươm', address: 'Hà Nội', imageUrl: 'https://via.placeholder.com/80x80?text=Ho+Guom' },
  { id: '2', name: 'Bến Nhà Rồng', address: 'TP.HCM', imageUrl: 'https://via.placeholder.com/80x80?text=Ben+Nha+Rong' },
  { id: '3', name: 'Chùa Thiên Mụ', address: 'Huế', imageUrl: 'https://via.placeholder.com/80x80?text=Thien+Mu' },
];

const ConversationContext = createContext();

export function ConversationProvider({ children }) {
  // Simulate a new conversation on mount
  const [conversationId] = useState(() => `mock-conv-${Date.now()}`);
  const [taggedPlaces, setTaggedPlaces] = useState([]);

  // Mock: Tag a place by id
  const tagPlace = (placeId) => {
    const place = MOCK_PLACES.find((p) => p.id === placeId);
    if (place && !taggedPlaces.some((p) => p.id === placeId)) {
      setTaggedPlaces((prev) => [...prev, place]);
    }
  };

  // Mock: Untag a place
  const untagPlace = (placeId) => {
    setTaggedPlaces((prev) => prev.filter((p) => p.id !== placeId));
  };

  return (
    <ConversationContext.Provider value={{ conversationId, taggedPlaces, tagPlace, untagPlace, MOCK_PLACES }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  return useContext(ConversationContext);
}
