import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X, Loader2, RotateCcw, Tag, Plus, Trash2, MapPin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import useStreamingChat from '../hooks/useStreamingChat';
import TaggedPlacesBar from './TaggedPlacesBar';
import TagPlaceModal from './TagPlaceModal';
import { useConversation } from '../contexts/ConversationContext';

export default function ChatWidget() {
  const defaultMessages = [
    { role: 'assistant', content: 'Xin chào! Tôi có thể hỗ trợ gợi ý địa điểm, lịch trình, ăn uống.' },
  ];
  const [isOpen, setIsOpen] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const {
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
  } = useStreamingChat({
    initialMessages: defaultMessages,
    onSearchAction: (action) => {
      // Dispatch custom event so HomePage can intercept and perform the search
      window.dispatchEvent(new CustomEvent('app:ai-search', { detail: action }));
    }
  });
  const {
    tagPlace,
    taggedPlaces,
    untagPlace,
    conversations,
    selectConversation,
    selectedConversationId,
    setSelectedConversationId,
    startNewConversation,
    deleteConversation,
    refreshConversations,
  } = useConversation();
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);

  const [copiedPlace, setCopiedPlace] = useState(null);

  // Sync copied place from clipboard / localStorage / events
  useEffect(() => {
    const checkCopiedPlace = () => {
      try {
        const stored = window.localStorage.getItem('copied_place');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id && parsed.name) {
            const isAlreadyTagged = taggedPlaces.some(p => p.id === parsed.id);
            if (!isAlreadyTagged) {
              setCopiedPlace(parsed);
              return;
            }
          }
        }
      } catch (err) {
        console.error('Lỗi khi đọc copied_place từ localStorage:', err);
      }
      setCopiedPlace(null);
    };

    checkCopiedPlace();

    const handleLocalCopy = (e) => {
      if (e.detail && e.detail.id && e.detail.name) {
        const isAlreadyTagged = taggedPlaces.some(p => p.id === e.detail.id);
        if (!isAlreadyTagged) {
          setCopiedPlace(e.detail);
        }
      }
    };
    window.addEventListener('app:place-copied', handleLocalCopy);

    const handleFocus = () => {
      checkCopiedPlace();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('app:place-copied', handleLocalCopy);
      window.removeEventListener('focus', handleFocus);
    };
  }, [taggedPlaces]);

  useEffect(() => {
    if (conversationId && conversationId !== selectedConversationId) {
      setSelectedConversationId(conversationId);
      refreshConversations?.();
    }
  }, [conversationId, refreshConversations, selectedConversationId, setSelectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      setConversationId(null);
      setMessages(defaultMessages);
      return;
    }
    let active = true;
    const loadHistory = async () => {
      const history = await selectConversation(selectedConversationId);
      if (!active) return;
      setConversationId(selectedConversationId);
      if (history?.length) {
        setMessages(history);
      } else {
        setMessages(defaultMessages);
      }
    };
    loadHistory();
    return () => {
      active = false;
    };
  }, [defaultMessages, selectConversation, selectedConversationId, setConversationId, setMessages]);

  useEffect(() => {
    if (selectedConversationId || !conversations?.length) return;
    selectConversation(conversations[0].id).then((history) => {
      setConversationId(conversations[0].id);
      setMessages(history?.length ? history : defaultMessages);
    });
  }, [conversations, defaultMessages, selectConversation, selectedConversationId, setConversationId, setMessages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const taggedPlacePayload = taggedPlaces.map(p => ({
      id: p.id,
      name: p.name || p.placeName,
      address: p.address,
      latitude: p.latitude || p.lat || p.coordinates?.lat,
      longitude: p.longitude || p.lng || p.coordinates?.lng,
      rating: p.rating,
      type: p.type || p.categories?.[0]
    }));
    await sendMessage(undefined, taggedPlaces.map(p => p.id), taggedPlacePayload);
  };

  const handleAbort = () => {
    abortStreaming();
  };

  const handleNewConversation = async () => {
    const conversation = await startNewConversation();
    if (conversation?.id) {
      setConversationId(conversation.id);
      setMessages(defaultMessages);
      setShowHistory(false);
    }
  };

  // Drag-and-drop: handle drop placeId
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const placeData = e.dataTransfer.getData('placeData');
    if (placeData) {
      try {
        const place = JSON.parse(placeData);
        tagPlace(place);
      } catch (err) {
        console.error('Lỗi khi parse placeData', err);
      }
    }
    // Auto-open chat if not open
    if (!isOpen) setIsOpen(true);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);

  return (
    <div className="fixed bottom-3 sm:bottom-4 right-3 sm:right-4 z-[1200] flex flex-col items-end gap-2 pointer-events-none">
      <div className="flex flex-row items-end gap-3 pointer-events-none w-full justify-end">
        {/* Active Tagged Places Stack (Left of chat widget) */}
        {isOpen && taggedPlaces && taggedPlaces.length > 0 && (
          <div className="flex flex-col gap-2 max-h-[min(450px,calc(100vh-13rem))] overflow-y-auto pointer-events-auto select-none items-end shrink-0 pr-1 pb-1">
            {taggedPlaces.map((place) => (
              <div
                key={place.id}
                className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-indigo-650 text-white text-xs px-3 py-2 rounded-full shadow-lg border border-indigo-400 hover:from-indigo-650 hover:to-indigo-700 transition duration-200 transform hover:-translate-y-0.5 shrink-0"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('placeId', place.id);
                  e.dataTransfer.setData('placeData', JSON.stringify(place));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0 text-indigo-200" />
                <span className="font-semibold max-w-[8rem] truncate">{place.name}</span>
                <button
                  type="button"
                  onClick={() => untagPlace(place.id)}
                  className="p-0.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition"
                  title="Bỏ tag"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Chat Window */}
        <div
          className={`h-[min(500px,calc(100vh-11rem))] max-h-[calc(100vh-11rem)] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-row overflow-hidden origin-bottom-right transition-all duration-300 ${isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto visible' : 'opacity-0 scale-95 translate-y-4 pointer-events-none invisible'} ${isDragOver ? 'ring-4 ring-blue-400/60' : ''} ${showHistory ? 'w-[min(40rem,calc(100vw-1.5rem))]' : 'w-[min(24rem,calc(100vw-1.5rem))]'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {showHistory && (
            <div className="w-56 border-r border-gray-200 bg-gray-50 flex flex-col relative shrink-0">
              <div className="p-3 font-semibold text-gray-700 border-b flex justify-between items-center">
                <span>Lịch sử chat</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleNewConversation}
                    className="p-1 rounded-md hover:bg-blue-100 text-blue-600"
                    title="Tạo hội thoại mới"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    className="p-1 rounded-md hover:bg-gray-200 text-gray-600"
                    title="Đóng lịch sử"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations && conversations.length > 0 ? (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={async () => {
                        const history = await selectConversation(conv.id);
                        setConversationId(conv.id);
                        setMessages(history?.length ? history : defaultMessages);
                      }}
                      className={`w-full text-left px-4 py-3 border-b text-sm hover:bg-blue-50 transition-colors ${selectedConversationId === conv.id ? 'bg-blue-100 font-bold text-blue-900' : 'text-gray-700'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold line-clamp-1">
                            {conv.title || `Hội thoại ${conv.id.slice(0, 8)}`}
                          </div>
                          {conv.lastMessage ? (
                            <div className="text-xs text-gray-500 line-clamp-1">{conv.lastMessage}</div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="p-1 rounded-md hover:bg-red-50 text-red-500"
                          title="Xóa hội thoại"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-gray-400 text-sm text-center">Chưa có hội thoại nào</div>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-2">
                {!showHistory && (
                  <button
                    type="button"
                    onClick={() => setShowHistory(true)}
                    className="p-1.5 mr-1 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                    title="Mở lịch sử chat"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7"/></svg>
                  </button>
                )}
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">AI Chat</p>
                  <p className="text-xs text-gray-500 line-clamp-1">Hỏi gì cũng được về chuyến đi</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowTagModal(true)}
                  className="p-1 rounded-lg hover:bg-blue-100"
                  title="Tag địa điểm vào hội thoại"
                >
                  <Tag className="w-4 h-4 text-blue-500" />
                </button>
                <button
                  type="button"
                  onClick={handleNewConversation}
                  className="p-1 rounded-lg hover:bg-gray-100"
                  title="Tạo hội thoại mới"
                >
                  <RotateCcw className="w-4 h-4 text-gray-500" />
                </button>
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
            </div>

            {/* Bar hiển thị các địa điểm đã tag */}
            <TaggedPlacesBar />

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50"
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm shadow-sm animate-chat-message ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm whitespace-pre-wrap'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm prose prose-sm prose-blue max-w-none'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <ReactMarkdown
                        components={{
                          a: ({ href, children, ...props }) => {
                            if (href && href.startsWith('place:')) {
                              const placeId = href.replace('place:', '');
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
                        {msg.content || (isStreaming && msg.role === 'assistant' ? 'Đang soạn...' : '')}
                      </ReactMarkdown>
                    )}
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

            {/* Clipboard detection inline bar (only inside chat widget if open) */}
            {isOpen && copiedPlace && (
              <div className="mx-4 my-2 px-3 py-2 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center justify-between text-xs text-cyan-800 animate-pulse shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Tag className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span className="truncate">Phát hiện địa điểm: <strong className="text-cyan-900 font-bold">{copiedPlace.name}</strong></span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      tagPlace(copiedPlace);
                      setCopiedPlace(null);
                      window.localStorage.removeItem('copied_place');
                    }}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-0.5 rounded-lg font-medium transition"
                  >
                    Tag ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCopiedPlace(null);
                      window.localStorage.removeItem('copied_place');
                    }}
                    className="p-0.5 text-cyan-600 hover:bg-cyan-100 rounded-full transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSend} className="p-3 border-t border-gray-200 bg-white shrink-0">
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
                  disabled={!canSend}
                  className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 font-medium shrink-0"
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
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Dừng
                  </button>
                </div>
              )}
            </form>
            <TagPlaceModal open={showTagModal} onClose={() => setShowTagModal(false)} />
          </div>
        </div>
      </div>

      {/* Floating tag suggestion banner above closed trigger button */}
      {!isOpen && copiedPlace && (
        <div
          onClick={() => {
            tagPlace(copiedPlace);
            setIsOpen(true);
            setCopiedPlace(null);
            window.localStorage.removeItem('copied_place');
          }}
          className="pointer-events-auto flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs px-3 py-2 rounded-2xl shadow-xl animate-bounce whitespace-nowrap cursor-pointer hover:from-cyan-600 hover:to-blue-700 transition font-semibold"
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Tag "{copiedPlace.name}" vào Chat?</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCopiedPlace(null);
              window.localStorage.removeItem('copied_place');
            }}
            className="ml-1 p-0.5 rounded-full hover:bg-white/20 text-white/90 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`w-14 h-14 rounded-full shadow-xl text-white flex items-center justify-center pointer-events-auto animate-floaty transition-colors duration-200 ${isOpen ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}`}
        title={isOpen ? 'Đóng chat' : 'Mở chat'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}