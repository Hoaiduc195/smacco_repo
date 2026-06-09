import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MapPin, MessageCircle, Plus, RotateCcw, Send, Tag, Trash2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import useStreamingChat from '../hooks/useStreamingChat';
import { useConversation } from '../contexts/ConversationContext';
import useWorkflowWizard from '../hooks/useWorkflowWizard';
import WorkflowPromptCard from './chat/WorkflowPromptCard';
import WizardStepCard from './chat/WizardStepCard';
import WizardSummaryCard from './chat/WizardSummaryCard';
import { navigateToPlaceDetail } from '../utils/placeNavigation';

const QUICK_REPLIES = [
  'Tìm homestay yên tĩnh ở Đà Lạt',
  'So sánh homestay Đà Lạt',
  'Lên lịch trình 3 ngày 2 đêm',
  'Đánh giá khu vực Phường 4',
  'Dự trù ngân sách đi Đà Lạt',
  'Quán ăn ngon gần Moc House',
];

export default function ChatWidget() {
  const navigate = useNavigate();
  const defaultMessages = useMemo(() => [
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý du lịch AI Smacco. Tôi có thể hỗ trợ bạn tìm kiếm phòng nghỉ, so sánh các chỗ ở, lên lịch trình, dự trù ngân sách và tìm quán ăn ngon xung quanh.\n\nBạn muốn tìm chỗ ở như thế nào? Ví dụ: *"Tìm homestay yên tĩnh ở Đà Lạt dưới 1 triệu cho 2 người"*'
    },
  ], []);

  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isPlaceChatOpen, setIsPlaceChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedPlace, setCopiedPlace] = useState(null);
  const [quickReplies, setQuickReplies] = useState(QUICK_REPLIES);
  const awaitingConfirmedSearchActionRef = useRef(false);
  const latestSearchResultsRef = useRef([]);
  const lastSubmittedUserMessageRef = useRef('');
  const skipNextWorkflowPromptRef = useRef(false);
  const declinedSearchFallbackRef = useRef('');
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const wizard = useWorkflowWizard();

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
  } = useStreamingChat({
    initialMessages: defaultMessages,
    hideSearchWorkflowTrigger: true,
    onSearchAction: (action) => {
      const hasResolvedResults = Array.isArray(action?.results);
      if (!awaitingConfirmedSearchActionRef.current && !hasResolvedResults) {
        return;
      }
      awaitingConfirmedSearchActionRef.current = false;
      latestSearchResultsRef.current = hasResolvedResults ? action.results : [];
      window.activeSearchResults = latestSearchResultsRef.current;
      window.dispatchEvent(new CustomEvent('app:ai-search', { detail: action }));
    },
    onWorkflowAction: (action) => {
      if (wizard.wizardState !== 'idle') return;
      if (action.type === 'search') {
        if (skipNextWorkflowPromptRef.current) {
          skipNextWorkflowPromptRef.current = false;
          return;
        }
        wizard.proposeWorkflow(
          'SEARCH_PLACES',
          action.parameters || {},
          action.parameters?.query || '',
          lastSubmittedUserMessageRef.current
        );
        return { hideTriggerTurn: true };
      } else if (action.type === 'compare') {
        wizard.proposeWorkflow('COMPARE_PLACES', action.parameters || {}, '', lastSubmittedUserMessageRef.current);
      } else if (action.type === 'analyze') {
        wizard.proposeWorkflow('ANALYZE_PLACE', action.parameters || {}, '', lastSubmittedUserMessageRef.current);
      }
    },
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

  const getActivePlacesAndPayload = () => {
    const fallbackSearchResults = latestSearchResultsRef.current.length > 0
      ? latestSearchResultsRef.current
      : (window.activeSearchResults || []);
    const activePlaces = taggedPlaces.length > 0 ? taggedPlaces : fallbackSearchResults;
    return {
      ids: activePlaces.map((place) => place.id),
      payload: activePlaces.map((place) => ({
        id: place.id,
        name: place.name || place.placeName || place.title,
        address: place.address || place.placeAddress || place.displayAddress,
        latitude: place.latitude || place.lat || place.coordinates?.lat || place.location?.lat,
        longitude: place.longitude || place.lng || place.coordinates?.lng || place.location?.lng,
        rating: place.rating || place.averageRating,
        type: place.type || place.categories?.[0],
      })),
    };
  };

  const sendTextMessage = async (text, options = {}) => {
    const userText = String(text || '').trim();
    if (!userText) return;
    lastSubmittedUserMessageRef.current = userText;
    const { ids, payload } = getActivePlacesAndPayload();
    await sendMessage(userText, ids, payload, options);
  };

  const resetQuickReplies = () => {
    setQuickReplies(QUICK_REPLIES);
  };

  const buildSearchPrompt = (data) => {
    const parts = [
      data.query || 'Tìm giúp tôi chỗ ở phù hợp',
      data.location ? `ở ${data.location}` : '',
      Array.isArray(data.types) && data.types.length ? `loại ${data.types.join(', ')}` : '',
      data.guests ? `cho ${data.guests} người` : '',
      data.budget ? `ngân sách ${data.budget}` : '',
    ].filter(Boolean);
    return parts.join(', ');
  };

  const buildComparePrompt = (data) => {
    const criteria = Array.isArray(data.criteria) && data.criteria.length
      ? ` theo các tiêu chí ${data.criteria.join(', ')}`
      : '';
    return `So sánh các địa điểm tôi đã tag${criteria}.`;
  };

  const buildAnalyzePrompt = (data) => {
    const criteria = Array.isArray(data.criteria) && data.criteria.length
      ? ` theo các tiêu chí ${data.criteria.join(', ')}`
      : '';
    return `Phân tích chi tiết địa điểm tôi đã tag${criteria}.`;
  };

  const handleDeclineWorkflow = async () => {
    const workflow = wizard.activeWorkflow;
    const fallbackMessage = String(workflow?.rawUserMessage || workflow?.detectedQuery || '').trim();

    wizard.declineWorkflow();
    resetQuickReplies();

    if (workflow?.workflowId !== 'SEARCH_PLACES' || !fallbackMessage) return;

    declinedSearchFallbackRef.current = fallbackMessage;
    awaitingConfirmedSearchActionRef.current = false;
    if (isStreaming) {
      abortStreaming();
      return;
    }

    declinedSearchFallbackRef.current = '';
    skipNextWorkflowPromptRef.current = true;
    await sendTextMessage(fallbackMessage);
  };

  useEffect(() => {
    if (isStreaming || !declinedSearchFallbackRef.current) return;

    const fallbackMessage = declinedSearchFallbackRef.current;
    declinedSearchFallbackRef.current = '';
    skipNextWorkflowPromptRef.current = true;
    sendTextMessage(fallbackMessage);
  }, [isStreaming, sendMessage, taggedPlaces]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (wizard.wizardState !== 'idle') return;
    setQuickReplies([]);
    awaitingConfirmedSearchActionRef.current = false;
    await sendTextMessage(input);
  };

  const handleQuickReplyClick = async (text) => {
    setIsOpen(true);
    setQuickReplies([]);
    wizard.cancelWizard();
    awaitingConfirmedSearchActionRef.current = false;
    await sendTextMessage(text);
  };

  const handleNewConversation = async () => {
    const conversation = await startNewConversation();
    if (!conversation?.id) return;
    setConversationId(conversation.id);
    setMessages(defaultMessages);
    setShowHistory(false);
    wizard.resetWizard();
    resetQuickReplies();
  };

  useEffect(() => {
    const handlePlaceChatActive = (e) => {
      setIsPlaceChatOpen(e.detail.open);
    };

    const syncMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    syncMobile();
    window.addEventListener('app:place-chat-active', handlePlaceChatActive);
    window.addEventListener('resize', syncMobile);

    return () => {
      window.removeEventListener('app:place-chat-active', handlePlaceChatActive);
      window.removeEventListener('resize', syncMobile);
    };
  }, []);

  useEffect(() => {
    const checkCopiedPlace = () => {
      try {
        const stored = window.localStorage.getItem('copied_place');
        if (!stored) {
          setCopiedPlace(null);
          return;
        }

        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && parsed.name && !taggedPlaces.some((place) => place.id === parsed.id)) {
          setCopiedPlace(parsed);
          return;
        }
      } catch (err) {
        console.error('Lỗi khi đọc copied_place từ localStorage:', err);
      }

      setCopiedPlace(null);
    };

    const handleLocalCopy = (e) => {
      if (e.detail && e.detail.id && e.detail.name && !taggedPlaces.some((place) => place.id === e.detail.id)) {
        setCopiedPlace(e.detail);
      }
    };

    checkCopiedPlace();
    window.addEventListener('app:place-copied', handleLocalCopy);
    window.addEventListener('focus', checkCopiedPlace);

    return () => {
      window.removeEventListener('app:place-copied', handleLocalCopy);
      window.removeEventListener('focus', checkCopiedPlace);
    };
  }, [taggedPlaces]);

  useEffect(() => {
    const handleExternalSend = async (event) => {
      const text = event?.detail?.text;
      if (!text) return;
      setIsOpen(true);
      setQuickReplies([]);
      wizard.cancelWizard();
      awaitingConfirmedSearchActionRef.current = false;
      await sendTextMessage(text);
    };

    const handleExternalPrefill = (event) => {
      const text = event?.detail?.text;
      if (!text) return;
      setIsOpen(true);
      setInput(text);
    };

    window.addEventListener('app:chat-send', handleExternalSend);
    window.addEventListener('app:chat-prefill', handleExternalPrefill);

    return () => {
      window.removeEventListener('app:chat-send', handleExternalSend);
      window.removeEventListener('app:chat-prefill', handleExternalPrefill);
    };
  }, [sendMessage, setInput, taggedPlaces, wizard]);

  useEffect(() => {
    if (conversationId && conversationId !== selectedConversationId) {
      setSelectedConversationId(conversationId);
      refreshConversations?.();
    }
  }, [conversationId, refreshConversations, selectedConversationId, setSelectedConversationId]);

  useEffect(() => {
    if (isStreaming) return;
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
      setMessages(history?.length ? history : defaultMessages);
    };

    loadHistory();
    return () => {
      active = false;
    };
  }, [defaultMessages, isStreaming, selectConversation, selectedConversationId, setConversationId, setMessages]);

  useEffect(() => {
    if (isStreaming) return;
    if (selectedConversationId || !conversations?.length) return;

    selectConversation(conversations[0].id).then((history) => {
      setConversationId(conversations[0].id);
      setMessages(history?.length ? history : defaultMessages);
    });
  }, [conversations, defaultMessages, isStreaming, selectConversation, selectedConversationId, setConversationId, setMessages]);

  useEffect(() => {
    if (wizard.wizardState !== 'executing') return;

    const execute = async () => {
      const data = wizard.summaryData;
      const workflowId = wizard.activeWorkflow?.workflowId;

      try {
        if (workflowId === 'SEARCH_PLACES') {
          awaitingConfirmedSearchActionRef.current = true;
          await sendTextMessage(buildSearchPrompt(data), {
            workflowExecution: {
              workflowId: 'SEARCH_PLACES',
              confirmed: true,
              parameters: data,
            },
            wizardPreferences: {
              guestCount: data.guests,
              budget: data.budget,
              types: data.types,
              preferences: data.preferences,
            },
          });
        } else if (workflowId === 'COMPARE_PLACES') {
          await sendTextMessage(buildComparePrompt(data));
        } else if (workflowId === 'ANALYZE_PLACE') {
          await sendTextMessage(buildAnalyzePrompt(data));
        }
      } catch (err) {
        awaitingConfirmedSearchActionRef.current = false;
        console.error(err);
      } finally {
        wizard.resetWizard();
      }
    };

    execute();
  }, [sendMessage, taggedPlaces, wizard]);

  useEffect(() => {
    if (!isOpen) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [isOpen, messages, wizard.wizardState, quickReplies]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const placeData = e.dataTransfer.getData('placeData');
    if (!placeData) return;

    try {
      tagPlace(JSON.parse(placeData));
    } catch (err) {
      console.error('Lỗi khi parse placeData', err);
    }

    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const visibleTaggedPlace = taggedPlaces[taggedPlaces.length - 1];

  if (isPlaceChatOpen && isMobile) {
    return null;
  }

  return (
    <div
      className="fixed bottom-3 sm:bottom-5 z-[1200] flex flex-col items-end gap-2 pointer-events-none transition-all duration-300 ease-in-out"
      style={{ right: isPlaceChatOpen && !isMobile ? '416px' : (isMobile ? '12px' : '20px') }}
    >
      <div className="flex flex-row items-end gap-3 pointer-events-none w-full justify-end">
        {isOpen && visibleTaggedPlace && (
          <div className="pointer-events-auto select-none shrink-0 pr-1 pb-1">
              <div
                key={visibleTaggedPlace.id}
                className="flex items-center gap-1.5 bg-ink-900 text-white text-xs px-3 py-2 rounded-full shadow-soft border border-ink-900 hover:bg-ink-700 transition duration-200 transform hover:-translate-y-0.5 shrink-0"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('placeId', visibleTaggedPlace.id);
                  e.dataTransfer.setData('placeData', JSON.stringify(visibleTaggedPlace));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0 text-primary-200" />
                <span className="font-semibold max-w-[8rem] truncate">{visibleTaggedPlace.name}</span>
                <button
                  type="button"
                  onClick={() => untagPlace(visibleTaggedPlace.id)}
                  className="p-0.5 rounded-full hover:bg-primary-700 text-white transition"
                  title="Bỏ tag"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
          </div>
        )}

        <div
          className={`h-[min(620px,calc(100vh-7rem))] max-h-[calc(100vh-7rem)] bg-white/[0.96] border border-base-200/90 rounded-3xl shadow-card backdrop-blur-xl flex flex-row overflow-hidden origin-bottom-right transition-all duration-300 ${isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto visible animate-panel-in-right' : 'opacity-0 scale-95 translate-y-4 pointer-events-none invisible'} ${isDragOver ? 'ring-4 ring-primary-400/50' : ''} ${showHistory ? 'w-[min(44rem,calc(100vw-1.5rem))]' : 'w-[min(25rem,calc(100vw-1.5rem))]'}`}
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
                {conversations.length > 0 ? (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={async () => {
                        const history = await selectConversation(conv.id);
                        setConversationId(conv.id);
                        setMessages(history?.length ? history : defaultMessages);
                        wizard.resetWizard();
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
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>
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
                  onClick={handleNewConversation}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  title="Tạo hội thoại mới"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isStreaming) abortStreaming();
                    setIsOpen(false);
                  }}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-white">
              {messages.map((msg, idx) => {
                if (msg.hidden) return null;
                return (
                  <div key={msg.id || idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm shadow-sm animate-chat-message ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-sm whitespace-pre-wrap' : 'bg-ink-900 text-white border border-ink-900 rounded-bl-sm prose prose-sm prose-invert max-w-none'}`}
                    >
                      {msg.role === 'user' ? msg.content : (!msg.content && isStreaming && idx === messages.length - 1 ? (
                        <span className="inline-flex items-center gap-2 text-white/80">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-300" />
                          Đang suy nghĩ...
                        </span>
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
                      ))}
                    </div>
                  </div>
                );
              })}

              {wizard.wizardState === 'prompting' && wizard.activeWorkflow && (
                <WorkflowPromptCard
                  workflowId={wizard.activeWorkflow.workflowId}
                  params={wizard.activeWorkflow.initialParams}
                  query={wizard.activeWorkflow.detectedQuery}
                  taggedPlaces={taggedPlaces}
                  onAccept={wizard.acceptWorkflow}
                  onDecline={handleDeclineWorkflow}
                />
              )}

              {wizard.wizardState === 'collecting' && wizard.currentStep && (
                <WizardStepCard
                  step={wizard.currentStep}
                  stepIndex={wizard.currentStepIndex}
                  totalSteps={wizard.steps.length}
                  value={wizard.collectedData[wizard.currentStep.id]}
                  onSubmit={(value) => wizard.submitStep(wizard.currentStep.id, value)}
                  onSkip={wizard.skipStep}
                  onBack={wizard.currentStepIndex > 0 ? wizard.goBackStep : undefined}
                  onCancel={() => {
                    awaitingConfirmedSearchActionRef.current = false;
                    wizard.cancelWizard();
                    resetQuickReplies();
                  }}
                />
              )}

              {wizard.wizardState === 'confirming' && wizard.activeWorkflow && (
                <WizardSummaryCard
                  workflowId={wizard.activeWorkflow.workflowId}
                  steps={wizard.steps}
                  collectedData={wizard.summaryData}
                  onConfirm={wizard.confirmAndExecute}
                  onCancel={() => {
                    awaitingConfirmedSearchActionRef.current = false;
                    wizard.cancelWizard();
                    resetQuickReplies();
                  }}
                  onEditStep={wizard.editFromSummary}
                />
              )}

              {wizard.wizardState === 'idle' && quickReplies.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      onClick={() => handleQuickReplyClick(reply)}
                      className="rounded-full border border-base-200 bg-base-50 px-3 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

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
                  <button type="button" className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-0.5 rounded-lg font-medium transition">
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
                  disabled={wizard.wizardState !== 'idle'}
                  className="flex-grow resize-none px-3 py-2 border border-base-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm disabled:bg-base-50 disabled:text-ink-400"
                />
                <button
                  type="submit"
                  disabled={!canSend || wizard.wizardState !== 'idle'}
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
                    onClick={abortStreaming}
                    className="text-primary-600 hover:underline font-bold"
                  >
                    Dừng
                  </button>
                </div>
              )}
              {error ? (
                <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                  {error}
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </div>

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
        onClick={() => setIsOpen((value) => !value)}
        className={`h-14 rounded-2xl shadow-xl flex items-center justify-center gap-2 pointer-events-auto animate-floaty transition-colors duration-200 border px-4 ${isOpen ? 'w-14 bg-white hover:bg-primary-50 border-base-200 text-slate-800' : 'bg-ink-900 hover:bg-ink-800 border-ink-900 text-white shadow-glow'}`}
        title={isOpen ? 'Đóng chat' : 'Mở chat'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen ? <span className="text-sm font-black">Mở AI Chat</span> : null}
      </button>
    </div>
  );
}
