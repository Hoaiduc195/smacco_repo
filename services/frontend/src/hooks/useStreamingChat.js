import { useMemo, useRef, useState } from 'react';
import { streamChat } from '../services/aiService';

const defaultAssistantError = ' (đã gặp lỗi, vui lòng thử lại sau)';

export default function useStreamingChat({
  initialMessages = [],
  initialConversationId = null,
  buildPrompt,
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  const canSend = useMemo(
    () => Boolean(input.trim()) && !isStreaming,
    [input, isStreaming]
  );

  const appendAssistantDelta = (delta) => {
    setMessages((prev) => {
      const updated = [...prev];
      const idx = [...updated].reverse().findIndex((msg) => msg.role === 'assistant');
      const targetIndex = idx === -1 ? -1 : updated.length - 1 - idx;
      if (targetIndex === -1) return [...updated, { role: 'assistant', content: delta }];
      const target = updated[targetIndex];
      updated[targetIndex] = { ...target, content: `${target.content || ''}${delta}` };
      return updated;
    });
  };

  const sendMessage = async (textOverride) => {
    const rawText = textOverride ?? input;
    const userText = rawText.trim();
    if (!userText || isStreaming) return;

    const promptText = typeof buildPrompt === 'function' ? buildPrompt(userText) : userText;

    setInput('');
    setError('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }, { role: 'assistant', content: '' }]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat({
        text: promptText,
        conversationId,
        signal: controller.signal,
        onChunk: (chunk) => {
          if (chunk?.error) {
            setError(chunk.error);
            appendAssistantDelta(defaultAssistantError);
            setIsStreaming(false);
            return;
          }
          if (chunk?.conversation_id) {
            setConversationId((prev) => prev || chunk.conversation_id);
          }
          if (chunk?.delta) {
            appendAssistantDelta(chunk.delta);
          }
          if (chunk?.finish_reason) {
            setIsStreaming(false);
          }
        },
        onDone: () => {
          setIsStreaming(false);
        },
        onError: (err) => {
          setError(err?.message || 'Có lỗi khi gọi AI');
          appendAssistantDelta(defaultAssistantError);
          setIsStreaming(false);
        },
      });
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setError(err?.message || 'Có lỗi khi gọi AI');
      setIsStreaming(false);
    }
  };

  const abortStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const clearConversation = () => {
    setMessages(initialMessages);
    setConversationId(initialConversationId);
    setInput('');
    setError('');
    setIsStreaming(false);
  };

  return {
    messages,
    input,
    setInput,
    conversationId,
    isStreaming,
    error,
    canSend,
    sendMessage,
    abortStreaming,
    clearConversation,
  };
}
