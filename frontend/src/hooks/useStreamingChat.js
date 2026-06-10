import { useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { streamChat } from '../services/aiService';

const defaultAssistantError = ' (đã gặp lỗi, vui lòng thử lại sau)';

export default function useStreamingChat({
  initialMessages = [],
  initialConversationId = null,
  buildPrompt,
  onSearchAction,
  onWorkflowAction,
  hideSearchWorkflowTrigger = false,
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);
  const receivedAssistantTextRef = useRef(false);
  const messageIdRef = useRef(0);

  const canSend = useMemo(
    () => Boolean(input.trim()) && !isStreaming,
    [input, isStreaming]
  );

  const appendAssistantDelta = (delta) => {
    if (delta) {
      receivedAssistantTextRef.current = true;
    }
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

  const applyAssistantMeta = (meta = {}) => {
    if (!meta || typeof meta !== 'object') return;
    setMessages((prev) => {
      const updated = [...prev];
      const idx = [...updated].reverse().findIndex((msg) => msg.role === 'assistant');
      const targetIndex = idx === -1 ? -1 : updated.length - 1 - idx;
      if (targetIndex === -1) return prev;
      updated[targetIndex] = { ...updated[targetIndex], ...meta };
      return updated;
    });
  };

  const pruneTrailingEmptyAssistant = () => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant' && !(last.content || '').trim()) {
        return prev.slice(0, -1);
      }
      return prev;
    });
  };

  const hideCurrentWorkflowTriggerTurn = () => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;

      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === 'assistant' && !(last.content || '').trim()) {
        next.pop();
      }

      const userIndex = [...next].reverse().findIndex((msg) => msg.role === 'user' && !msg.hidden);
      if (userIndex === -1) return next;

      const targetIndex = next.length - 1 - userIndex;
      next[targetIndex] = {
        ...next[targetIndex],
        hidden: true,
        intentTrigger: true,
      };
      return next;
    });
  };

  const sendMessage = async (textOverride, taggedPlaceIds, taggedPlaces, options = {}) => {
    const rawText = textOverride ?? input;
    const userText = rawText.trim();
    if (!userText || isStreaming) return;

    const promptText = typeof buildPrompt === 'function' ? buildPrompt(userText) : userText;

    flushSync(() => {
      receivedAssistantTextRef.current = false;
      setInput('');
      setError('');
      const userMessageId = `local-${messageIdRef.current++}`;
      const assistantMessageId = `local-${messageIdRef.current++}`;
      setMessages((prev) => [
        ...prev,
        { id: userMessageId, role: 'user', content: userText, hidden: false, intentTrigger: false },
        { id: assistantMessageId, role: 'assistant', content: '' },
      ]);
      setIsStreaming(true);
    });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat({
        text: promptText,
        conversationId,
        taggedPlaceIds,
        taggedPlaces,
        userContext: options.userContext,
        workflowExecution: options.workflowExecution,
        wizardPreferences: options.wizardPreferences,
        signal: controller.signal,
        onChunk: (chunk) => {
          if (chunk?.error) {
            setError(chunk.error);
            appendAssistantDelta(defaultAssistantError);
            setIsStreaming(false);
            return;
          }
          if (chunk?.searchAction && typeof onSearchAction === 'function') {
            onSearchAction(chunk.searchAction);
          }
          if (chunk?.workflowAction && typeof onWorkflowAction === 'function') {
            const workflowResult = onWorkflowAction(chunk.workflowAction);
            if (
              hideSearchWorkflowTrigger &&
              chunk.workflowAction.type === 'search' &&
              workflowResult?.hideTriggerTurn === true
            ) {
              hideCurrentWorkflowTriggerTurn();
            }
          }
          if (chunk?.conversationId || chunk?.conversation_id) {
            setConversationId((prev) => prev || chunk.conversationId || chunk.conversation_id);
          }
          if (chunk?.messageMeta) {
            applyAssistantMeta(chunk.messageMeta);
          }
          if (chunk?.delta) {
            appendAssistantDelta(chunk.delta);
          }
          if (chunk?.finishReason || chunk?.finish_reason) {
            if (!receivedAssistantTextRef.current) {
              pruneTrailingEmptyAssistant();
            }
            setIsStreaming(false);
          }
        },
        onDone: () => {
          if (!receivedAssistantTextRef.current) {
            pruneTrailingEmptyAssistant();
          }
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
    setMessages,
    input,
    setInput,
    conversationId,
    setConversationId,
    isStreaming,
    error,
    canSend,
    sendMessage,
    abortStreaming,
    clearConversation,
  };
}
