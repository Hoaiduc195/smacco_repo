import React, { createContext, useContext, useEffect, useState } from 'react';
import { createConversation, deleteConversation as deleteConversationApi, getConversationMessages, listConversations } from '../services/aiService';
import { useAuth } from './AuthContext';

const ConversationContext = createContext();
const STORAGE_KEY = 'chat_selected_conversation';
export const MAX_TAGGED_PLACES = 5;

export function ConversationProvider({ children }) {
  const { currentUser, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [taggedPlaces, setTaggedPlaces] = useState([]);

  useEffect(() => {
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

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
    if (authLoading) {
      return;
    }

    if (!currentUser) {
      setConversations([]);
      setSelectedConversationId(null);
      setError('');
      setLoading(false);
      return;
    }

    refreshConversations();
  }, [authLoading, currentUser]);

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
        setTaggedPlaces((prev) => {
          if (prev.length >= MAX_TAGGED_PLACES) {
            window.dispatchEvent(new CustomEvent('app:tag-limit-reached', {
              detail: { max: MAX_TAGGED_PLACES }
            }));
            return prev;
          }
          return [...prev, normalizedPlace];
        });
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
