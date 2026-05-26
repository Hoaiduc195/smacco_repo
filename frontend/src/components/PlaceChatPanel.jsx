import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Loader2, RotateCcw, MapPin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import useStreamingChat from '../hooks/useStreamingChat';

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
    initialConversationId: place.id,
    initialMessages: [
      {
        role: 'assistant',
        content: `Bạn có thể hỏi mọi thứ về địa điểm ${place.name}.`,
      },
    ],
    buildPrompt: (userText) =>
      `You are a travel assistant. Answer about this place using provided context if any. Place name: ${place.name}. Address: ${place.address || ''}. Question: ${userText}`,
  });

  const bottomRef = useRef(null);
  const scrollRef = useRef(null);

  const send = async () => {
    const taggedPlacePayload = [{
      id: place.id,
      name: place.name || place.placeName,
      address: place.address,
      latitude: place.latitude || place.lat || place.coordinates?.lat,
      longitude: place.longitude || place.lng || place.coordinates?.lng,
      rating: place.rating,
      type: place.type || place.categories?.[0]
    }];
    await sendMessage(undefined, [place.id], taggedPlacePayload);
  };

  return (
    <div className="absolute right-4 top-4 bottom-4 w-96 bg-white border border-gray-200 shadow-xl rounded-lg z-30 flex flex-col animate-chat-pop">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Chat về địa điểm</div>
          <div className="font-semibold text-gray-900 line-clamp-1">{place.name}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearConversation}
            className="p-2 rounded hover:bg-gray-100"
            title="Làm mới hội thoại"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (isStreaming) abortStreaming();
              onClose?.();
            }}
            className="p-2 rounded hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2 text-sm bg-gray-50"
      >
        {!messages.length && <div className="text-gray-500">Hỏi bất cứ điều gì về địa điểm này.</div>}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl animate-chat-message ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm whitespace-pre-wrap'
                  : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm prose prose-sm prose-blue max-w-none'
              }`}
            >
              {msg.role === 'user' ? (
                msg.content
              ) : (
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
                            className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-semibold border border-indigo-200 cursor-pointer hover:bg-indigo-100 hover:border-indigo-300 transition duration-150 transform hover:-translate-y-0.5 select-none my-0.5 mx-0.5 shadow-sm"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('placeId', placeId);
                              e.dataTransfer.setData('placeData', JSON.stringify({ id: placeId, name: placeName }));
                              e.dataTransfer.effectAllowed = 'copy';
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate(`/places/${placeId}`);
                              window.dispatchEvent(new CustomEvent('app:select-place', { detail: { id: placeId } }));
                            }}
                            title="Kéo thả vào Chat để tag, hoặc click để xem chi tiết"
                          >
                            <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                            {placeName}
                          </span>
                        );
                      }
                      return (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" {...props}>
                          {children}
                        </a>
                      );
                    }
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AI đang phản hồi...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {error ? <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">{error}</div> : null}
      <div className="p-3 border-t flex items-center gap-2">
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
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          placeholder="Nhập câu hỏi..."
        />
        <button
          onClick={send}
          disabled={!canSend}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}