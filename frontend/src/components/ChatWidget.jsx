import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Send, X, Loader2, RotateCcw, Tag, Plus, Trash2, MapPin, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import useStreamingChat from '../hooks/useStreamingChat';
import TaggedPlacesBar from './TaggedPlacesBar';
import TagPlaceModal from './TagPlaceModal';
import { useConversation } from '../contexts/ConversationContext';

export default function ChatWidget() {
  const navigate = useNavigate();
  const defaultMessages = [
    { role: 'assistant', content: 'Xin chào! Tôi có thể hỗ trợ gợi ý địa điểm, lịch trình, ăn uống.' },
  ];
  const [isOpen, setIsOpen] = useState(true);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const [isPlaceChatOpen, setIsPlaceChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  useEffect(() => {
    const handlePlaceChatActive = (e) => {
      setIsPlaceChatOpen(e.detail.open);
    };
    window.addEventListener('app:place-chat-active', handlePlaceChatActive);

    const syncMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    syncMobile();
    window.addEventListener('resize', syncMobile);

    return () => {
      window.removeEventListener('app:place-chat-active', handlePlaceChatActive);
      window.removeEventListener('resize', syncMobile);
    };
  }, []);

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
    if (!isOpen) setIsOpen(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  // Hide the floating main ChatWidget on mobile if the place-specific chat panel is open
  if (isPlaceChatOpen && isMobile) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-3 sm:bottom-4 z-[1200] flex flex-col items-end gap-2 pointer-events-none transition-all duration-300 ease-in-out"
      style={{
        right: isPlaceChatOpen && !isMobile ? '416px' : (isMobile ? '12px' : '16px')
      }}
    >
      <div className="flex flex-row items-end gap-3 pointer-events-none w-full justify-end">
        {/* Active Tagged Places Stack (Left of chat widget) */}
        {isOpen && taggedPlaces && taggedPlaces.length > 0 && (
          <div className="flex flex-col gap-2 max-h-[min(450px,calc(100vh-13rem))] overflow-y-auto pointer-events-auto select-none items-end shrink-0 pr-1 pb-1">
            {taggedPlaces.map((place) => (
              <div
                key={place.id}
                className="flex items-center gap-1.5 bg-ink-900 text-white text-xs px-3 py-2 rounded-full shadow-soft border border-ink-900 hover:bg-ink-700 transition duration-200 transform hover:-translate-y-0.5 shrink-0"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('placeId', place.id);
                  e.dataTransfer.setData('placeData', JSON.stringify(place));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0 text-primary-200" />
                <span className="font-semibold max-w-[8rem] truncate">{place.name}</span>
                <button
                  type="button"
                  onClick={() => untagPlace(place.id)}
                  className="p-0.5 rounded-full hover:bg-primary-700 text-white hover:text-white transition"
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
          className={`h-[min(500px,calc(100vh-11rem))] max-h-[calc(100vh-11rem)] bg-white border border-base-200 rounded-3xl shadow-card flex flex-row overflow-hidden origin-bottom-right transition-all duration-300 ${isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto visible' : 'opacity-0 scale-95 translate-y-4 pointer-events-none invisible'} ${isDragOver ? 'ring-4 ring-primary-400/50' : ''} ${showHistory ? 'w-[min(40rem,calc(100vw-1.5rem))]' : 'w-[min(24rem,calc(100vw-1.5rem))]'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {showHistory && (
            <div className="w-56 border-r border-base-200 bg-white flex flex-col relative shrink-0">
              <div className="p-3 font-semibold text-ink-900 border-b border-base-200 flex justify-between items-center bg-base-50">
                <span className="text-xs font-bold uppercase tracking-wide">Lịch sử chat</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleNewConversation}
                    className="p-1 rounded-xl hover:bg-primary-50 text-primary-600"
                    title="Tạo hội thoại mới"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    className="p-1 rounded-xl hover:bg-base-200 text-ink-500"
                    title="Đóng lịch sử"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-white">
                {conversations && conversations.length > 0 ? (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={async () => {
                        const history = await selectConversation(conv.id);
                        setConversationId(conv.id);
                        setMessages(history?.length ? history : defaultMessages);
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-base-100 text-sm hover:bg-primary-50/50 transition-colors ${selectedConversationId === conv.id ? 'bg-primary-50 font-black text-primary-900' : 'text-ink-700'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-bold line-clamp-1">
                            {conv.title || `Hội thoại ${conv.id.slice(0, 8)}`}
                          </div>
                          {conv.lastMessage ? (
                            <div className="text-xs text-ink-500 line-clamp-1">{conv.lastMessage}</div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="p-1 rounded-lg hover:bg-rose-50 text-rose-600"
                          title="Xóa hội thoại"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-ink-500/50 text-xs text-center">Chưa có hội thoại nào</div>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-800 bg-ink-900 text-white">
              <div className="flex items-center gap-2">
                {!showHistory && (
                  <button
                    type="button"
                    onClick={() => setShowHistory(true)}
                    className="p-1.5 mr-1 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                    title="Mở lịch sử chat"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7"/></svg>
                  </button>
                )}
                <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-black text-white leading-tight">Trợ lý AI</p>
                  <p className="text-[10px] font-semibold text-primary-300">Tư vấn lịch trình & chỗ ở</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowTagModal(true)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  title="Tag địa điểm vào hội thoại"
                >
                  <Tag className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNewConversation}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  title="Tạo hội thoại mới"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isStreaming) handleAbort();
                    setIsOpen(false);
                  }}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bar hiển thị các địa điểm đã tag */}
            <TaggedPlacesBar />

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-white"
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm shadow-sm animate-chat-message ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white rounded-br-sm whitespace-pre-wrap'
                        : 'bg-ink-900 text-white border border-ink-900 rounded-bl-sm prose prose-sm prose-invert max-w-none'
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
                                    navigate(`/places/${placeId}`);
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
                    )}
                  </div>
                </div>
              ))}
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
                className="mx-4 my-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-xl flex items-center justify-between text-xs text-primary-800 animate-pulse shrink-0 cursor-pointer hover:bg-primary-100 transition"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Tag className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                  <span className="truncate">Phát hiện địa điểm: <strong className="text-primary-900 font-bold">{copiedPlace.name}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    type="button"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-0.5 rounded-lg font-medium transition"
                  >
                    Tag
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCopiedPlace(null);
                      window.localStorage.removeItem('copied_place');
                    }}
                    className="p-0.5 text-primary-600 hover:bg-primary-100 rounded-full transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSend} className="p-3 border-t border-base-200 bg-white shrink-0">
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
                  className="flex-grow resize-none px-3 py-2 border border-base-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className="h-10 w-10 rounded-xl bg-primary-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 font-medium shrink-0"
                  title={isStreaming ? 'Đang gửi' : 'Gửi'}
                >
                  {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              {isStreaming && (
                <div className="flex items-center gap-2 text-xs text-ink-500 mt-1">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                  <span>AI đang phản hồi... (Streaming)</span>
                  <button
                    type="button"
                    onClick={handleAbort}
                    className="text-primary-600 hover:underline font-bold"
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
          className="pointer-events-auto flex items-center gap-2 bg-gradient-to-br from-primary-500 to-primary-700 text-white text-xs px-3 py-2 rounded-2xl shadow-xl animate-bounce whitespace-nowrap cursor-pointer hover:from-primary-600 hover:to-primary-800 transition font-semibold"
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
            className="ml-1 p-0.5 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center pointer-events-auto animate-floaty transition-colors duration-200 border ${isOpen ? 'bg-white hover:bg-primary-50 border-base-200 text-slate-800' : 'bg-ink-900 hover:bg-ink-800 border-ink-900 text-white shadow-glow'}`}
        title={isOpen ? 'Đóng chat' : 'Mở chat'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
