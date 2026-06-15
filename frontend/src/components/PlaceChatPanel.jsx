import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Loader2, RotateCcw, MapPin, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import useStreamingChat from '../hooks/useStreamingChat';
import { navigateToPlaceDetail } from '../utils/placeNavigation';
import { buildChatPlacesPayload } from '../utils/chatPlacePayload';

export default function PlaceChatPanel({ place, onClose }) {
  const navigate = useNavigate();
  const {
    messages,
    input,
    setInput,
    isStreaming,
    error,
    canSend,
    sendMessage,
    abortStreaming,
    clearConversation,
  } = useStreamingChat({
    initialMessages: [
      {
        role: 'assistant',
        content: `Bạn có thể hỏi mọi thứ về địa điểm ${place.name}.`,
      },
    ],
  });

  const bottomRef = useRef(null);
  const scrollRef = useRef(null);

  const send = async () => {
    const { ids, payload } = buildChatPlacesPayload([place], 1);
    await sendMessage(undefined, ids, payload);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Dispatch event on mount/unmount to tell ChatWidget to shift left
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('app:place-chat-active', { detail: { open: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('app:place-chat-active', { detail: { open: false } }));
    };
  }, []);

  return (
    <div className="absolute right-3 sm:right-4 top-24 sm:top-[90px] bottom-3 sm:bottom-4 w-[min(calc(100vw-1.5rem),24rem)] bg-white border border-base-200 shadow-card rounded-3xl z-30 flex flex-col animate-chat-pop overflow-hidden">
      <div className="px-4 py-3.5 border-b border-base-200 flex items-center justify-between bg-ink-900 text-white">
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-primary-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Chat về địa điểm
          </div>
          <div className="font-bold text-base line-clamp-1 text-white">{place.name}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={clearConversation}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Làm mới hội thoại"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (isStreaming) abortStreaming();
              onClose?.();
            }}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3 text-sm bg-white"
      >
        {!messages.length && <div className="text-ink-500 text-sm font-medium">Hỏi bất cứ điều gì về địa điểm này.</div>}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`min-w-0 max-w-[85%] break-words px-3 py-2 rounded-2xl shadow-sm animate-chat-message ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-sm whitespace-pre-wrap'
                  : 'bg-ink-900 text-white border border-ink-900 rounded-bl-sm'
              }`}
            >
              {msg.role === 'user' ? (
                msg.content
              ) : !msg.content && isStreaming && idx === messages.length - 1 ? (
                <span className="inline-flex items-center gap-2 text-white/80">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-300" />
                  Đang suy nghĩ...
                </span>
              ) : (
                <div className="prose prose-sm prose-invert max-w-none break-words">
                  <ReactMarkdown
                    components={{
                      a: ({ href, children, ...props }) => {
                        let placeId = null;
                        if (href) {
                          const placeMatch = href.match(/(?:place:|places\/|\/places\/)([^?#\s/]+)/)
                            || href.match(/\/places\/([^?#\s/]+)/)
                            || href.match(/place:([^?#\s/]+)/);
                          if (placeMatch) {
                            placeId = placeMatch[1];
                          }
                        }
                        if (placeId) {
                          const placeName = String(children || '');
                          return (
                            <span
                              className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full text-xs font-semibold border border-primary-200 cursor-pointer hover:bg-primary-100 hover:border-primary-300 transition duration-150 transform hover:-translate-y-0.5 select-none my-0.5 mx-0.5 shadow-sm"
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('placeId', placeId);
                                e.dataTransfer.setData('placeData', JSON.stringify({ id: placeId, name: placeName }));
                                e.dataTransfer.effectAllowed = 'copy';
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigateToPlaceDetail(navigate, placeId, {
                                  place: { id: placeId, name: placeName },
                                });
                                window.dispatchEvent(new CustomEvent('app:select-place', { detail: { id: placeId } }));
                              }}
                              title="Kéo thả vào Chat để tag, hoặc click để xem chi tiết"
                            >
                              <MapPin className="w-3 h-3 text-primary-500 shrink-0" />
                              {placeName}
                            </span>
                          );
                        }
                        return (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline font-semibold" {...props}>
                            {children}
                          </a>
                        );
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-ink-500">
            <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
            <span>AI đang phản hồi...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      
      {error ? <div className="px-4 py-2 text-xs text-rose-700 bg-rose-50 border-t border-rose-100">{error}</div> : null}
      
      <div className="p-3 border-t border-base-200 bg-white flex items-center gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          className="flex-grow resize-none px-3 py-2 border border-base-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
          placeholder="Nhập câu hỏi về địa điểm..."
        />
        <button
          onClick={send}
          disabled={!canSend}
          className="h-10 w-10 rounded-xl bg-primary-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 font-medium shrink-0"
        >
          {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
