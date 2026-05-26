import React, { createContext, useContext, useEffect, useState } from 'react';
import { createConversation, deleteConversation as deleteConversationApi, getConversationMessages, listConversations } from '../services/aiService';

const ConversationContext = createContext();
const STORAGE_KEY = 'chat_selected_conversation';

export function ConversationProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(() =>
    window.localStorage.getItem(STORAGE_KEY)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [taggedPlaces, setTaggedPlaces] = useState([]);

  const refreshConversations = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listConversations({ limit: 30 });
      setConversations(data?.conversations || []);
    } catch (err) {
      setError(err?.message || 'Không thể tải lịch sử hội thoại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshConversations();
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      window.localStorage.setItem(STORAGE_KEY, selectedConversationId);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedConversationId]);

  const selectConversation = async (conversationId) => {
    setSelectedConversationId(conversationId);
    try {
      const data = await getConversationMessages(conversationId, { limit: 80 });
      return data?.messages || [];
    } catch (err) {
      setError(err?.message || 'Không thể tải tin nhắn.');
      return [];
    }
  };

  const startNewConversation = async () => {
    const data = await createConversation();
    const conversation = data?.conversation;
    if (conversation?.id) {
      setSelectedConversationId(conversation.id);
      await refreshConversations();
    }
    return conversation;
  };

  const deleteConversation = async (conversationId) => {
    try {
      await deleteConversationApi(conversationId);
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
      }
      await refreshConversations();
    } catch (err) {
      setError(err?.message || 'Không thể xóa hội thoại.');
    }
  };

  // Tag a place by full object
  const tagPlace = (place) => {
    if (place) {
      const normalizedId = (place.source === 'serpapi' && place.sourcePlaceId)
        ? `serpapi-${place.sourcePlaceId}`
        : place.id;
      
      const normalizedPlace = {
        ...place,
        id: normalizedId
      };

      if (normalizedId && !taggedPlaces.some((p) => p.id === normalizedId)) {
        setTaggedPlaces((prev) => [...prev, normalizedPlace]);
      }
    }
  };

  // Untag a place
  const untagPlace = (placeId) => {
    setTaggedPlaces((prev) => prev.filter((p) => p.id !== placeId));
  };

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        selectedConversationId,
        setSelectedConversationId,
        loading,
        error,
        refreshConversations,
        selectConversation,
        startNewConversation,
        deleteConversation,
        taggedPlaces,
        tagPlace,
        untagPlace,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  return useContext(ConversationContext);
}
