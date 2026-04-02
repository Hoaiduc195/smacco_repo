import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { streamChat } from '../services/aiService';

export default function PlaceChatPanel({ place, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setIsStreaming(true);
    let aiContent = '';
    const controller = new AbortController();
    try {
      await streamChat({
        text: `You are a travel assistant. Answer about this place using provided context if any. Place name: ${place.name}. Address: ${place.address || ''}. Question: ${userMsg.content}`,
        conversationId: place.id,
        signal: controller.signal,
        onChunk: (chunk) => {
          if (chunk.delta) {
            aiContent += chunk.delta;
            setMessages((m) => {
              const clone = [...m];
              const last = clone[clone.length - 1];
              if (last?.role === 'assistant-temp') {
                clone[clone.length - 1] = { ...last, content: aiContent };
              } else {
                clone.push({ role: 'assistant-temp', content: aiContent });
              }
              return clone;
            });
          }
        },
        onDone: () => {
          setIsStreaming(false);
          setMessages((m) => m.map((msg) => (msg.role === 'assistant-temp' ? { ...msg, role: 'assistant' } : msg)));
        },
        onError: (err) => {
          setIsStreaming(false);
          setMessages((m) => [...m, { role: 'assistant', content: err.message || 'Chat error' }]);
        },
      });
    } catch (err) {
      controller.abort();
      setIsStreaming(false);
    }
  };

  return (
    <div className="absolute right-4 top-4 bottom-4 w-96 bg-white border border-gray-200 shadow-xl rounded-lg z-30 flex flex-col">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Chat về địa điểm</div>
          <div className="font-semibold text-gray-900 line-clamp-1">{place.name}</div>
        </div>
        <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 text-sm">
        {!messages.length && <div className="text-gray-500">Hỏi bất cứ điều gì về địa điểm này.</div>}
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.role.startsWith('assistant') ? 'text-gray-900' : 'text-blue-800 font-medium'}>
            {msg.content}
          </div>
        ))}
      </div>
      <div className="p-3 border-t flex items-center gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          placeholder="Nhập câu hỏi..."
        />
        <button
          onClick={send}
          disabled={isStreaming}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
