import apiClient from './api';
import { auth } from './firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost/api/v1';

export const chat = async ({ text, conversationId } = {}) => {
  const response = await apiClient.post('/ai/chat', {
    text,
    conversation_id: conversationId,
  });
  return response.data;
};

export const streamChat = async ({
  text,
  conversationId,
  signal,
  onChunk,
  onDone,
  onError,
} = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error('Failed to get Firebase token for streaming:', err);
  }

  const response = await fetch(`${API_BASE}/ai/chat/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text, conversation_id: conversationId }),
    signal,
  });

  if (!response.ok || !response.body) {
    const message = `Stream request failed: ${response.status} ${response.statusText}`;
    onError?.(new Error(message));
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const processBuffer = () => {
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';
    for (const event of events) {
      const line = event.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.replace(/^data:\s*/, '').trim();
      if (!payload) continue;
      try {
        const parsed = JSON.parse(payload);
        if (parsed.error || parsed.detail) {
          const message = parsed.error || parsed.detail || 'Streaming error';
          onError?.(new Error(message));
          onDone?.(parsed);
          continue;
        }
        onChunk?.(parsed);
        if (parsed.finish_reason) {
          onDone?.(parsed);
        }
      } catch (err) {
        console.error('Failed to parse stream chunk:', err, payload);
      }
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      processBuffer();
    }
    buffer += decoder.decode();
    processBuffer();
    onDone?.();
  } catch (err) {
    if (err.name === 'AbortError') return; // aborted by caller
    onError?.(err);
    throw err;
  }
};

export default { chat, streamChat };
