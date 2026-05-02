import React, { createContext, useContext, useState } from 'react';

const ConversationContext = createContext();

export function ConversationProvider({ children }) {
  // Simulate a new conversation on mount
  const [conversationId] = useState(() => `mock-conv-${Date.now()}`);
  const [taggedPlaces, setTaggedPlaces] = useState([]);

  // Tag a place by full object
  const tagPlace = (place) => {
    if (place && place.id && !taggedPlaces.some((p) => p.id === place.id)) {
      setTaggedPlaces((prev) => [...prev, place]);
    }
  };

  // Untag a place
  const untagPlace = (placeId) => {
    setTaggedPlaces((prev) => prev.filter((p) => p.id !== placeId));
  };

  return (
    <ConversationContext.Provider value={{ conversationId, taggedPlaces, tagPlace, untagPlace }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  return useContext(ConversationContext);
}
