import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X, Loader2, RotateCcw, Tag } from 'lucide-react';
import useStreamingChat from '../hooks/useStreamingChat';
import TaggedPlacesBar from './TaggedPlacesBar';
import TagPlaceModal from './TagPlaceModal';
import { useConversation } from '../contexts/ConversationContext';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
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
      { role: 'assistant', content: 'Xin chào! Tôi có thể hỗ trợ gợi ý địa điểm, lịch trình, ăn uống.' },
    ],
    onSearchAction: (action) => {
      // Dispatch custom event so HomePage can intercept and perform the search
      window.dispatchEvent(new CustomEvent('app:ai-search', { detail: action }));
    }
  });
  const { tagPlace, conversations, selectConversation, selectedConversationId } = useConversation();
  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    await sendMessage();
  };

  const handleAbort = () => {
    abortStreaming();
  };

  // Drag-and-drop: handle drop placeId
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const placeId = e.dataTransfer.getData('placeId');
    if (placeId) tagPlace(placeId);
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
      {isOpen && (
        <div
          className={`h-[min(500px,calc(100vh-11rem))] max-h-[calc(100vh-11rem)] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-row overflow-hidden pointer-events-auto animate-chat-pop transition-all duration-300 ${isDragOver ? 'ring-4 ring-blue-400/60' : ''} ${showHistory ? 'w-[min(40rem,calc(100vw-1.5rem))]' : 'w-[min(24rem,calc(100vw-1.5rem))]'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {showHistory && (
            <div className="w-56 border-r border-gray-200 bg-gray-50 flex flex-col relative shrink-0">
              <div className="p-3 font-semibold text-gray-700 border-b flex justify-between items-center">
                <span>Lịch sử chat</span>
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="p-1 rounded-md hover:bg-gray-200 text-gray-600"
                  title="Đóng lịch sử"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations && conversations.length > 0 ? (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv.id)}
                      className={`w-full text-left px-4 py-3 border-b text-sm hover:bg-blue-50 transition-colors ${selectedConversationId === conv.id ? 'bg-blue-100 font-bold text-blue-900' : 'text-gray-700'}`}
                    >
                      {conv.title || `Hội thoại ${conv.id}`}
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
                onClick={clearConversation}
                className="p-1 rounded-lg hover:bg-gray-100"
                title="Làm mới hội thoại"
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

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap shadow-sm animate-chat-message ${
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
                disabled={!canSend}
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
          <TagPlaceModal open={showTagModal} onClose={() => setShowTagModal(false)} />
          </div>
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