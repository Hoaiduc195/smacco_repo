import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useStreamingChat from './useStreamingChat';

const streamChatMock = vi.fn();

vi.mock('../services/aiService', () => ({
  streamChat: (...args) => streamChatMock(...args),
}));

describe('useStreamingChat', () => {
  beforeEach(() => {
    streamChatMock.mockReset();
  });

  it('appends streamed delta and stores conversation id', async () => {
    streamChatMock.mockImplementation(async ({ onChunk, onDone }) => {
      onChunk?.({ conversation_id: 'conv-1' });
      onChunk?.({ delta: 'Xin ' });
      onChunk?.({ delta: 'chao' });
      onChunk?.({ finish_reason: 'stop' });
      onDone?.();
    });

    const { result } = renderHook(() =>
      useStreamingChat({ initialMessages: [{ role: 'assistant', content: 'hello' }] })
    );

    act(() => {
      result.current.setInput('hi there');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    const messages = result.current.messages;
    expect(messages[1]).toMatchObject({ role: 'user', content: 'hi there' });
    expect(messages[2]).toMatchObject({ role: 'assistant', content: 'Xin chao' });
    expect(result.current.conversationId).toBe('conv-1');
    expect(result.current.isStreaming).toBe(false);
  });

  it('builds contextual prompt when buildPrompt is provided', async () => {
    streamChatMock.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useStreamingChat({
        initialMessages: [],
        buildPrompt: (text) => `Prompt:${text}`,
      })
    );

    act(() => {
      result.current.setInput('my question');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(streamChatMock).toHaveBeenCalledTimes(1);
    const call = streamChatMock.mock.calls[0][0];
    expect(call.text).toBe('Prompt:my question');
  });

  it('sets error and stops streaming when stream fails', async () => {
    streamChatMock.mockImplementation(async ({ onError }) => {
      onError?.(new Error('stream failed'));
    });

    const { result } = renderHook(() => useStreamingChat({ initialMessages: [] }));

    act(() => {
      result.current.setInput('test');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.error).toBe('stream failed');
    expect(result.current.isStreaming).toBe(false);
  });

  it('hides the search workflow trigger turn when requested by the workflow handler', async () => {
    streamChatMock.mockImplementation(async ({ onChunk, onDone }) => {
      onChunk?.({ workflowAction: { type: 'search', parameters: { query: 'Tìm homestay' } } });
      onChunk?.({ finish_reason: 'stop' });
      onDone?.();
    });

    const { result } = renderHook(() =>
      useStreamingChat({
        initialMessages: [],
        hideSearchWorkflowTrigger: true,
        onWorkflowAction: () => ({ hideTriggerTurn: true }),
      })
    );

    act(() => {
      result.current.setInput('Tìm homestay');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: 'Tìm homestay',
      hidden: true,
      intentTrigger: true,
    });
  });

  it('keeps the user turn visible when workflow handler does not request hiding', async () => {
    streamChatMock.mockImplementation(async ({ onChunk, onDone }) => {
      onChunk?.({ workflowAction: { type: 'search', parameters: { query: 'Tìm homestay' } } });
      onChunk?.({ finish_reason: 'stop' });
      onDone?.();
    });

    const { result } = renderHook(() =>
      useStreamingChat({
        initialMessages: [],
        hideSearchWorkflowTrigger: true,
        onWorkflowAction: () => undefined,
      })
    );

    act(() => {
      result.current.setInput('Tìm homestay');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: 'Tìm homestay',
      hidden: false,
      intentTrigger: false,
    });
  });

  it('notifies callers when assistant message metadata arrives', async () => {
    const onAssistantMeta = vi.fn();
    streamChatMock.mockImplementation(async ({ onChunk, onDone }) => {
      onChunk?.({ delta: 'Mình đã tạo bảng so sánh.' });
      onChunk?.({ messageMeta: { comparisonResultId: 'comparison-1' } });
      onChunk?.({ finish_reason: 'stop' });
      onDone?.();
    });

    const { result } = renderHook(() =>
      useStreamingChat({
        initialMessages: [],
        onAssistantMeta,
      })
    );

    act(() => {
      result.current.setInput('So sánh các địa điểm đã tag');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(onAssistantMeta).toHaveBeenCalledWith({ comparisonResultId: 'comparison-1' });
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'Mình đã tạo bảng so sánh.',
      comparisonResultId: 'comparison-1',
    });
  });
});
