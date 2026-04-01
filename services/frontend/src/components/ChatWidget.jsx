import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X, Loader2 } from 'lucide-react';
import aiService from '../services/aiService';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Xin chào! Tôi có thể hỗ trợ gợi ý địa điểm, lịch trình, ăn uống.' },
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);
  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const appendAssistantDelta = (delta) => {
    setMessages((prev) => {
      const updated = [...prev];
      const idx = [...updated].reverse().findIndex((m) => m.role === 'assistant');
      const targetIndex = idx === -1 ? -1 : updated.length - 1 - idx;
      if (targetIndex === -1) return [...updated, { role: 'assistant', content: delta }];
      const target = updated[targetIndex];
      updated[targetIndex] = { ...target, content: `${target.content || ''}${delta}` };
      return updated;
    });
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userText = input.trim();
    setError('');
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }, { role: 'assistant', content: '' }]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await aiService.streamChat({
        text: userText,
        conversationId,
        signal: controller.signal,
        onChunk: (chunk) => {
          if (chunk?.error) {
            setError(chunk.error);
            setIsStreaming(false);
            appendAssistantDelta(' (đã gặp lỗi, thử lại sau)');
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
          setIsStreaming(false);
          setError(err?.message || 'Có lỗi khi gọi AI');
          appendAssistantDelta(' (đã gặp lỗi, thử lại sau)');
        },
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      setIsStreaming(false);
      setError(err?.message || 'Có lỗi khi gọi AI');
    }
  };

  const handleAbort = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[1200] flex flex-col items-end gap-2 pointer-events-none">
      {isOpen && (
        <div className="w-96 h-[520px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">AI Chat</p>
                <p className="text-xs text-gray-500">Hỏi gì cũng được về chuyến đi</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isStreaming) handleAbort();
                setIsOpen(false);
              }}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  {msg.content || (isStreaming && msg.role === 'assistant' ? 'Đang soạn...' : '')}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSend} className="p-3 border-t border-gray-200 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Hỏi AI về địa điểm, lịch trình, món ăn..."
                className="flex-1 resize-none px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                title={isStreaming ? 'Đang gửi' : 'Gửi'}
              >
                {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            {isStreaming && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI đang phản hồi... (Streaming)</span>
                <button
                  type="button"
                  onClick={handleAbort}
                  className="text-blue-600 hover:underline"
                >
                  Dừng
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-blue-600 shadow-xl text-white flex items-center justify-center hover:bg-blue-700 pointer-events-auto"
        title={isOpen ? 'Đóng chat' : 'Mở chat'}
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}