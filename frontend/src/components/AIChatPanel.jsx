import React, { useRef, useEffect } from 'react';
import { Bot, Check, ChevronRight, History, Loader2, MapPin, RefreshCw, Send, Sparkles, Trash2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import WorkflowPromptCard from './chat/WorkflowPromptCard';
import WizardStepCard from './chat/WizardStepCard';
import WizardSummaryCard from './chat/WizardSummaryCard';

export default function AIChatPanel({
  messages,
  input,
  setInput,
  isStreaming,
  isProgressActive,
  progressSteps,
  quickReplies,
  workflowCard,
  referenceChips,
  onSendMessage,
  onQuickReplyClick,
  onWorkflowConfirm,
  onWorkflowCancel,
  onRemoveReference,
  onClearConversation,
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  showHistory,
  setShowHistory,
  onCollapse,
  // Wizard props
  wizardState,
  wizardActiveWorkflow,
  wizardCurrentStep,
  wizardCurrentStepIndex,
  wizardSteps,
  wizardCollectedData,
  wizardProgress,
  onWizardAccept,
  onWizardDecline,
  onWizardSubmitStep,
  onWizardSkipStep,
  onWizardGoBack,
  onWizardConfirm,
  onWizardCancel,
  onWizardEditStep,
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, isProgressActive, progressSteps, wizardState, wizardCurrentStepIndex]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage(input);
  };

  return (
    <div className="relative flex h-full flex-row overflow-visible animate-panel-in-right">
      {/* Conversation History Popout */}
      {showHistory && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowHistory(false)} />
          <div className="absolute right-full mr-3 top-0 bottom-0 z-20 w-72 overflow-hidden rounded-3xl border border-base-200 bg-white/95 shadow-card backdrop-blur-xl flex flex-col animate-panel-in-left">
            <div className="p-3 font-semibold text-ink-900 border-b border-base-200 flex justify-between items-center bg-base-50/90">
              <span className="text-xs font-bold uppercase tracking-wide">Lịch sử chat</span>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 rounded-xl hover:bg-base-200 text-ink-500 transition-colors"
                title="Đóng lịch sử"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations && conversations.length > 0 ? (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`w-full text-left px-4 py-3 border-b border-base-100 text-sm hover:bg-primary-50/50 cursor-pointer transition-colors relative group ${
                      selectedConversationId === conv.id ? 'bg-primary-50/70 font-semibold text-primary-900' : 'text-ink-700'
                    }`}
                  >
                    <div className="min-w-0 pr-6">
                      <div className="text-xs font-bold line-clamp-1">
                        {conv.title || `Hội thoại ${conv.id.slice(0, 8)}`}
                      </div>
                      {conv.lastMessage && (
                        <div className="text-[11px] text-ink-500 line-clamp-1 mt-0.5">{conv.lastMessage}</div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-rose-50 text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Xóa hội thoại"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-ink-500/50 text-xs text-center">Chưa có hội thoại nào</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden border border-base-200/80 bg-white/[0.90] shadow-card backdrop-blur-xl rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-200 bg-ink-900 text-white rounded-t-3xl">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-2 py-1 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors text-[10px] font-black"
              title="Lịch sử chat"
            >
              <History className="w-3.5 h-3.5 mr-1 inline-block" />
              Lịch sử
            </button>
            <div className="w-7 h-7 rounded-xl bg-primary-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-white leading-none">Trợ lý AI Smacco</p>
              <p className="text-[9px] font-semibold text-primary-300 mt-0.5">Hỗ trợ đặt phòng & du lịch</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onCollapse && (
              <button
                onClick={onCollapse}
                className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                title="Thu gọn Chat AI"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onNewConversation}
              className="px-2 py-1 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors text-[10px] font-black"
              title="Hội thoại mới"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1 inline-block" />
              Mới
            </button>
          </div>
        </div>

        {/* Message area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex animate-chat-message ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                style={{ animationDelay: `${Math.min(idx * 45, 240)}ms` }}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs transition-[transform,box-shadow] duration-200 ease-out will-change-transform ${
                    msg.role === 'user'
                      ? 'chat-bubble-user bg-primary-600 text-white rounded-tr-none font-medium hover:-translate-y-0.5'
                      : 'chat-bubble-assistant bg-ink-900 text-white rounded-tl-none border border-ink-900 prose prose-sm prose-invert leading-relaxed max-w-none hover:-translate-y-0.5'
                  }`}
                  style={{ animationDelay: `${Math.min(idx * 45, 240)}ms`, animationFillMode: 'both' }}
                >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="markdown-chat">
                    <ReactMarkdown
                      components={{
                        a: ({ href, children, ...props }) => {
                          let placeId = null;
                          if (href) {
                            const placeMatch =
                              href.match(/(?:place:|places\/|\/places\/)([^?#\s/]+)/) ||
                              href.match(/\/places\/([^?#\s/]+)/) ||
                              href.match(/place:([^?#\s/]+)/);
                            if (placeMatch) {
                              placeId = placeMatch[1];
                            }
                          }
                          if (placeId) {
                            const placeName = String(children || '');
                            return (
                              <span
                                className="inline-flex items-center bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-primary-200 cursor-pointer hover:bg-primary-100 hover:border-primary-300 transition duration-150 transform hover:-translate-y-0.5 select-none my-0.5 mx-0.5 shadow-sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.dispatchEvent(new CustomEvent('app:select-place', { detail: { id: placeId } }));
                                }}
                                title="Click để xem chi tiết trên bản đồ/workspace"
                              >
                                <MapPin className="w-2.5 h-2.5 text-primary-500 shrink-0 mr-1" />
                                {placeName}
                              </span>
                            );
                          }
                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-400 hover:underline font-semibold"
                              {...props}
                            >
                              {children}
                            </a>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Workflow Wizard: Prompt Card */}
          {wizardState === 'prompting' && wizardActiveWorkflow && (
            <WorkflowPromptCard
              workflowId={wizardActiveWorkflow.workflowId}
              params={wizardActiveWorkflow.initialParams}
              query={wizardActiveWorkflow.detectedQuery}
              taggedPlaces={referenceChips}
              onAccept={onWizardAccept}
              onDecline={onWizardDecline}
            />
          )}

          {/* Workflow Wizard: Step Card */}
          {wizardState === 'collecting' && wizardCurrentStep && (
            <WizardStepCard
              key={`step-${wizardCurrentStepIndex}`}
              step={wizardCurrentStep}
              stepIndex={wizardCurrentStepIndex}
              totalSteps={wizardSteps?.length || 0}
              value={wizardCollectedData?.[wizardCurrentStep.id]}
              onSubmit={(val) => onWizardSubmitStep(wizardCurrentStep.id, val)}
              onSkip={onWizardSkipStep}
              onBack={wizardCurrentStepIndex > 0 ? onWizardGoBack : null}
              onCancel={onWizardCancel}
            />
          )}

          {/* Workflow Wizard: Summary Card */}
          {wizardState === 'confirming' && (
            <WizardSummaryCard
              workflowId={wizardActiveWorkflow?.workflowId}
              steps={wizardSteps}
              collectedData={wizardCollectedData}
              onConfirm={onWizardConfirm}
              onCancel={onWizardCancel}
              onEditStep={onWizardEditStep}
            />
          )}

          {/* Workflow Wizard: Executing state */}
          {wizardState === 'executing' && (
            <div className="border border-primary-100 bg-primary-50/30 rounded-2xl p-3 shadow-soft flex items-center gap-2 animate-soft-in">
              <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
              <span className="text-[10px] font-bold text-primary-800">Đang thực hiện...</span>
            </div>
          )}

          {/* Agent progress states */}
          {isProgressActive && progressSteps && progressSteps.length > 0 && (
            <div className="border border-primary-100 bg-primary-50/30 rounded-2xl p-3 shadow-soft space-y-2 animate-soft-in">
              <div className="flex items-center justify-between border-b border-primary-100/50 pb-1.5">
                <span className="text-[10px] font-black text-primary-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                  Agent Workflow
                </span>
                <span className="text-[9px] font-semibold text-primary-700 bg-primary-100/60 px-2 py-0.5 rounded-full">
                  Đang chạy...
                </span>
              </div>
              <div className="space-y-1.5 pl-1">
                {progressSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[10px]">
                    {step.status === 'completed' ? (
                      <Check className="w-3 h-3 text-emerald-600 shrink-0 stroke-[3]" />
                    ) : step.status === 'active' ? (
                      <Loader2 className="w-3 h-3 text-primary-600 animate-spin shrink-0" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-0.5 mr-1 shrink-0" />
                    )}
                    <span
                      className={`font-semibold ${
                        step.status === 'completed'
                          ? 'text-slate-500 line-through'
                          : step.status === 'active'
                          ? 'text-primary-700 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies group */}
        {quickReplies && quickReplies.length > 0 && (
          <div className="px-4 py-2 border-t border-base-100 bg-white/90 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => onQuickReplyClick(reply)}
                className="px-2.5 py-1 bg-primary-50 text-primary-800 border border-primary-200/60 rounded-full text-[10px] font-semibold hover:bg-primary-100 hover:border-primary-300 transition duration-150 transform hover:-translate-y-0.5 select-none"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Place Tagging reference chips */}
        {referenceChips && referenceChips.length > 0 && (
          <div className="px-4 py-1.5 border-t border-base-100 bg-base-50/70 flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-bold text-ink-500 shrink-0">Tham chiếu:</span>
            {referenceChips.map((place) => (
              <div
                key={place.id}
                className="flex items-center gap-1 bg-ink-900 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm hover:bg-ink-800 transition"
              >
                <MapPin className="w-2.5 h-2.5 text-primary-300" />
                <span className="font-semibold max-w-[5rem] truncate">{place.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveReference(place.id)}
                  className="p-0.5 rounded-full hover:bg-primary-700 text-white"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input box */}
        <form onSubmit={handleFormSubmit} className="p-3 border-t border-base-200 bg-white shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
                  e.preventDefault();
                  handleFormSubmit(e);
                }
              }}
              placeholder="Nhập yêu cầu: Tìm homestay, so sánh, lên lịch trình..."
              className="flex-grow resize-none px-3 py-2 border border-base-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-xs text-ink-900"
            />
            <button
              type="submit"
              disabled={(!input.trim() && !isStreaming) || isStreaming}
              className="h-9 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition font-black shrink-0 shadow-sm text-xs"
              title="Gửi tin nhắn"
            >
              {isStreaming ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
            </button>
          </div>
          {isStreaming && (
            <div className="flex items-center gap-2 text-[10px] text-ink-500 mt-1 pl-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-600" />
              <span>AI đang phản hồi...</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
