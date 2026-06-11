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

  it('keeps partial assistant text clean when stream fails after deltas', async () => {
    streamChatMock.mockImplementation(async ({ onChunk, onError }) => {
      onChunk?.({ delta: 'Một phần câu trả lời' });
      onError?.(new Error('stream timeout'));
    });

    const { result } = renderHook(() => useStreamingChat({ initialMessages: [] }));

    act(() => {
      result.current.setInput('test');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.error).toBe('stream timeout');
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'Một phần câu trả lời',
    });
    expect(result.current.messages[1].content).not.toContain('đã gặp lỗi');
    expect(result.current.isStreaming).toBe(false);
  });

  it('keeps partial assistant text clean when an error chunk arrives after deltas', async () => {
    streamChatMock.mockImplementation(async ({ onChunk }) => {
      onChunk?.({ delta: 'Một phần câu trả lời' });
      onChunk?.({ error: 'stream timeout', finishReason: 'error' });
    });

    const { result } = renderHook(() => useStreamingChat({ initialMessages: [] }));

    act(() => {
      result.current.setInput('test');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.error).toBe('stream timeout');
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'Một phần câu trả lời',
    });
    expect(result.current.messages[1].content).not.toContain('đã gặp lỗi');
    expect(result.current.isStreaming).toBe(false);
  });

  it('keeps workflow trigger turns visible by default', async () => {
    streamChatMock.mockImplementation(async ({ onChunk, onDone }) => {
      onChunk?.({ workflowAction: { type: 'compare', parameters: { criteria: 'overall' } } });
      onChunk?.({ finish_reason: 'stop' });
      onDone?.();
    });

    const { result } = renderHook(() =>
      useStreamingChat({
        initialMessages: [],
        onWorkflowAction: () => undefined,
      })
    );

    act(() => {
      result.current.setInput('So sánh các địa điểm đã tag');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: 'So sánh các địa điểm đã tag',
      hidden: false,
      intentTrigger: false,
    });
  });

  it('can hide explicitly generated workflow execution prompts', async () => {
    streamChatMock.mockImplementation(async ({ onChunk, onDone }) => {
      onChunk?.({ finish_reason: 'stop' });
      onDone?.();
    });

    const { result } = renderHook(() => useStreamingChat({ initialMessages: [] }));

    act(() => {
      result.current.setInput('Tìm homestay yên tĩnh, ở Đà Lạt, loại homestay');
    });

    await act(async () => {
      await result.current.sendMessage(undefined, [], [], { hideUserMessage: true });
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: 'Tìm homestay yên tĩnh, ở Đà Lạt, loại homestay',
      hidden: true,
      intentTrigger: true,
    });
    expect(streamChatMock).toHaveBeenCalledWith(expect.objectContaining({
      hideUserMessage: true,
    }));
  });

  it('notifies callers when assistant message metadata arrives', async () => {
    const onAssistantMeta = vi.fn();
    streamChatMock.mockImplementation(async ({ onChunk, onDone }) => {
      onChunk?.({ delta: 'Mình đã tạo bảng so sánh.' });
      onChunk?.({ messageMeta: { comparisonResultId: 'comparison-1', comparisonPayload: { type: 'place_comparison' } } });
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

    expect(onAssistantMeta).toHaveBeenCalledWith({ comparisonResultId: 'comparison-1', comparisonPayload: { type: 'place_comparison' } });
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'Mình đã tạo bảng so sánh.',
      comparisonResultId: 'comparison-1',
      comparisonPayload: { type: 'place_comparison' },
    });
  });

  it('applies comparison payload metadata when no persisted comparison id exists', async () => {
    const onAssistantMeta = vi.fn();
    const comparisonPayload = {
      type: 'place_comparison',
      places: [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }],
      comparisonRows: [],
    };

    streamChatMock.mockImplementation(async ({ onChunk, onDone }) => {
      onChunk?.({ delta: 'Mình đã tạo bảng so sánh.' });
      onChunk?.({ messageMeta: { comparisonPayload } });
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

    expect(onAssistantMeta).toHaveBeenCalledWith({ comparisonPayload });
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'Mình đã tạo bảng so sánh.',
      comparisonPayload,
    });
  });

  it('applies insight payload metadata to the assistant message', async () => {
    const onAssistantMeta = vi.fn();
    const insightPayload = {
      type: 'place_insight',
      place: { id: 'a', name: 'Alpha' },
      summary: 'Insight chi tiết.',
    };

    streamChatMock.mockImplementation(async ({ onChunk, onDone }) => {
      onChunk?.({ delta: 'Mình đã tạo insight tổng quát.' });
      onChunk?.({ messageMeta: { insightPayload } });
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
      result.current.setInput('Tạo insight địa điểm');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(onAssistantMeta).toHaveBeenCalledWith({ insightPayload });
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'Mình đã tạo insight tổng quát.',
      insightPayload,
    });
  });
});
