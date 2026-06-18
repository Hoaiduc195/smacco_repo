import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, Loader2, MessageSquare, PlusCircle, Reply, Send, Sparkles, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createPlaceQuestion, createQuestionAnswer, getPlaceQuestions, deleteQuestion } from '../services/questionService';

function extractRequestErrorMessage(error, fallbackMessage) {
  const responseMessage = error?.response?.data?.message;

  if (Array.isArray(responseMessage)) {
    return responseMessage.join(', ');
  }

  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage;
  }

  if (typeof error?.message === 'string' && error.message.trim() && error.message !== 'Network Error') {
    return error.message;
  }

  return fallbackMessage;
}

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ParticipantAvatar({ participant, compact = false }) {
  const isAi = participant?.isAi;
  const isOnsite = participant?.isOnsite;
  const initials = participant?.initials || (isAi ? 'AI' : 'U');

  return (
    <div
      className={`flex items-center justify-center rounded-full border font-bold ${
        isAi
          ? 'border-violet-200 bg-violet-50 text-violet-700'
          : isOnsite
            ? 'border-primary-200 bg-primary-50 text-primary-700 ring-2 ring-primary-100/80'
            : 'border-slate-200 bg-white text-slate-700'
      } ${compact ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-sm'}`}
      title={isOnsite ? 'Onsite user' : isAi ? 'AI' : 'Offsite user'}
    >
      {initials}
    </div>
  );
}

function ReplyModal({ displayTitle, draft, onDraftChange, onClose, onSubmit, submitting }) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[2147483646] animate-soft-in">
      <button
        type="button"
        aria-label="Đóng popup trả lời"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/72"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.14)_0%,rgba(15,23,42,0.32)_100%)]" />
      <div className="relative flex min-h-full items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-xl overflow-hidden rounded-[1.9rem] border border-white/70 bg-white shadow-2xl animate-chat-pop">
        <div className="flex items-center justify-between border-b border-slate-100 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-black text-slate-900">
              <Reply className="h-4 w-4 text-primary-600" />
              Trả lời câu hỏi
            </div>
            <p className="mt-1 truncate text-xs font-medium text-slate-500">{displayTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Đóng popup trả lời"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="mb-3 text-sm leading-7 text-slate-600">
            Chia sẻ kinh nghiệm thực tế, mẹo nhỏ hoặc lưu ý quan trọng để giúp người hỏi có câu trả lời tốt hơn.
          </p>
          <textarea
            value={draft}
            onChange={onDraftChange}
            rows={5}
            className="w-full rounded-[1.35rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            placeholder="Viết câu trả lời của bạn..."
            autoFocus
          />
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-slate-500">Câu trả lời của bạn sẽ xuất hiện trong thread này.</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting || !draft.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Gửi trả lời
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>,
    document.body,
  );
}

function AskQuestionModal({ place, questionTitle, questionText, onTitleChange, onTextChange, onClose, onSubmit, submittingQuestion }) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[2147483646] animate-soft-in">
      <button
        type="button"
        aria-label="Đóng popup đặt câu hỏi"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/72"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.14)_0%,rgba(15,23,42,0.32)_100%)]" />
      <div className="relative flex min-h-full items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-2xl animate-chat-pop">
          <div className="flex items-center justify-between border-b border-slate-100 bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_100%)] px-5 py-4 sm:px-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <MessageSquare className="h-4 w-4 text-orange-600" />
                Tạo câu hỏi mới
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Viết tiêu đề rõ ràng để người khác có thể quét và mở đúng thread họ quan tâm.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-950 hover:shadow-sm"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-5 sm:p-6">
            <input
              value={questionTitle}
              onChange={onTitleChange}
              className="mb-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              placeholder="Tiêu đề câu hỏi, ví dụ: Ở đây có cần đặt chỗ trước không?"
            />
            <textarea
              value={questionText}
              onChange={onTextChange}
              rows={7}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              placeholder={place ? `Hỏi chi tiết về ${place.name}...` : 'Đặt câu hỏi của bạn...'}
              autoFocus
            />
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-slate-500">{questionText.length}/1000 ký tự</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={submittingQuestion || !questionText.trim()}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Đăng câu hỏi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function QuestionThreadCard({
  thread,
  draft,
  onDraftChange,
  onAnswerSubmit,
  submittingAnswerId,
  currentUser,
  onDeleteQuestion,
  deletingQuestionId,
}) {
  const isOwnQuestion = currentUser && thread.author?.firebaseUid && thread.author.firebaseUid === currentUser.uid;
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const answerCount = thread.answers?.length || 0;
  const totalResponseCount = answerCount + (thread.aiAnswer ? 1 : 0);
  const displayTitle = thread.title || thread.questionText || 'Câu hỏi chưa có tiêu đề';
  const authorName = thread.author?.displayName || 'Người dùng';

  return (
    <article
      className={`overflow-hidden rounded-[2rem] border transition-all duration-300 ${
        isExpanded
          ? 'border-primary-200 bg-white shadow-[0_28px_80px_-48px_rgba(23,20,16,0.38)] ring-1 ring-primary-100'
          : 'border-white/70 bg-white/92 shadow-[0_20px_48px_-36px_rgba(23,20,16,0.28)] backdrop-blur-xl hover:-translate-y-0.5 hover:border-primary-100 hover:shadow-[0_30px_70px_-42px_rgba(23,20,16,0.34)]'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <ParticipantAvatar participant={thread.author} compact />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[1rem] font-black leading-tight text-slate-950 sm:text-[1.08rem] lg:text-[1.12rem]">
              {displayTitle}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-500 sm:text-xs">
              <span className="font-semibold text-slate-700">{authorName}</span>
              {thread.author?.isOnsite ? (
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-primary-700">
                  Onsite
                </span>
              ) : null}
              <span>{formatTime(thread.createdAt)}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 sm:text-[11px]">
                {totalResponseCount} phản hồi
              </span>
              {thread.aiAnswer || thread.aiReplyStatus === 'pending' ? (
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700 sm:text-[11px]">
                  Có AI hỗ trợ
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-black transition sm:px-4 ${
            isExpanded
              ? 'bg-slate-950 text-white shadow-soft hover:bg-slate-800'
              : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700'
          }`}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `Thu gọn câu hỏi ${displayTitle}` : `Mở rộng câu hỏi ${displayTitle}`}
        >
          <span className="hidden sm:inline">{isExpanded ? 'Thu gọn' : 'Xem trả lời'}</span>
          <span className="sm:hidden">{isExpanded ? 'Ẩn' : 'Mở'}</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isExpanded ? (
        <div className="border-t border-slate-100 bg-[linear-gradient(180deg,rgba(251,248,243,0.72)_0%,rgba(255,255,255,1)_22%,rgba(255,255,255,1)_100%)] px-4 pb-4 pt-4 sm:px-5 sm:pb-5 lg:px-6 lg:pb-6">
          <div className="rounded-[1.6rem] border border-slate-100 bg-white p-5 shadow-[0_18px_44px_-34px_rgba(23,20,16,0.24)] sm:p-6">
            <div className="flex items-start gap-3">
              <ParticipantAvatar participant={thread.author} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="text-sm font-black text-slate-900">{authorName}</span>
                  {thread.author?.isOnsite ? (
                    <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-700">Onsite</span>
                  ) : null}
                  <span>{formatTime(thread.createdAt)}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowReplyModal(true)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                      title="Trả lời câu hỏi này"
                      aria-label={`Trả lời câu hỏi ${displayTitle}`}
                    >
                      <Reply className="h-4 w-4" />
                    </button>
                    {isOwnQuestion ? (
                      <button
                        type="button"
                        onClick={() => onDeleteQuestion(thread.id)}
                        disabled={deletingQuestionId === thread.id}
                        className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                        title="Xóa câu hỏi của bạn"
                      >
                        {deletingQuestionId === thread.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Xóa
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-[15px] leading-8 text-slate-700 sm:text-base">
                  {thread.questionText}
                </p>
              </div>
            </div>
          </div>

          {thread.aiAnswer ? (
            <section className="mt-4 ml-3 rounded-[1.45rem] border border-violet-100 bg-[linear-gradient(180deg,rgba(245,243,255,0.92)_0%,rgba(255,255,255,0.98)_100%)] p-4 sm:ml-6 sm:max-w-[calc(100%-1.5rem)]">
              <div className="flex items-start gap-3">
                <ParticipantAvatar participant={thread.aiAnswer.author} compact />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-violet-900">
                    {thread.aiAnswer.author?.displayName || 'AI'}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-6 text-slate-700">
                    {thread.aiAnswer.answerText}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {!thread.aiAnswer && thread.aiReplyStatus === 'pending' ? (
            <section className="mt-4 ml-3 rounded-[1.4rem] border border-dashed border-violet-200 bg-violet-50/80 p-4 text-sm text-violet-700 sm:ml-6 sm:max-w-[calc(100%-1.5rem)]">
              <div className="flex items-center gap-2 font-bold">
                <Sparkles className="h-4 w-4 animate-pulse" />
                AI đang chuẩn bị gợi ý
              </div>
              <p className="mt-2 leading-6 text-violet-700/85">
                Câu trả lời sẽ xuất hiện ngay trong thread này sau ít giây.
              </p>
            </section>
          ) : null}

          <section className="mt-4 rounded-[1.6rem] border border-slate-100 bg-white/90 p-4 shadow-[0_18px_40px_-36px_rgba(23,20,16,0.22)] sm:p-5">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary-700">Câu trả lời</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {answerCount ? `${answerCount} phản hồi từ cộng đồng` : 'Chưa có phản hồi nào từ cộng đồng'}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 border-l-2 border-slate-100 pl-3 sm:pl-5">
              {answerCount ? (
                thread.answers.map((answer) => (
                  <div
                    key={answer.id}
                    className="ml-0 rounded-[1.45rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.86)_0%,rgba(255,255,255,1)_100%)] p-4 shadow-[0_14px_32px_-30px_rgba(23,20,16,0.24)] sm:ml-1 sm:max-w-[calc(100%-1.5rem)]"
                  >
                    <div className="flex items-start gap-3">
                      <ParticipantAvatar participant={answer.author} compact />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[13px] font-bold text-slate-900">
                            {answer.author?.displayName || 'Người dùng'}
                          </p>
                          {answer.author?.isOnsite ? (
                            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700">
                              Onsite
                            </span>
                          ) : null}
                          <span className="text-[11px] font-medium text-slate-500">{formatTime(answer.createdAt)}</span>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-6 text-slate-700">
                          {answer.answerText}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  Chưa có câu trả lời nào. Bạn có thể là người đầu tiên chia sẻ trải nghiệm thực tế.
                </div>
              )}
            </div>

          </section>

          {showReplyModal ? (
            <ReplyModal
              displayTitle={displayTitle}
              draft={draft}
              onDraftChange={(event) => onDraftChange(thread.id, event.target.value)}
              onClose={() => setShowReplyModal(false)}
              onSubmit={async () => {
                await onAnswerSubmit(thread.id);
                if (draft.trim()) {
                  setShowReplyModal(false);
                }
              }}
              submitting={submittingAnswerId === thread.id}
            />
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function QASection({ placeId, place }) {
  const { currentUser } = useAuth();
  const [threads, setThreads] = useState([]);
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [submittingAnswerId, setSubmittingAnswerId] = useState(null);
  const [error, setError] = useState('');
  const [deletingQuestionId, setDeletingQuestionId] = useState(null);
  const [showAskModal, setShowAskModal] = useState(false);

  const questionCount = useMemo(() => threads.length, [threads]);

  useEffect(() => {
    loadThreads();
  }, [placeId]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getPlaceQuestions(placeId);
      setThreads(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(extractRequestErrorMessage(err, 'Không thể tải phần hỏi đáp.'));
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!questionText.trim()) return;

    try {
      setSubmittingQuestion(true);
      setError('');
      const createdThread = await createPlaceQuestion(placeId, {
        title: questionTitle.trim(),
        questionText: questionText.trim(),
      });
      setQuestionTitle('');
      setQuestionText('');
      setShowAskModal(false);
      setThreads((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        const existingIndex = next.findIndex((thread) => thread.id === createdThread?.id);
        const hydratedThread = createdThread?.aiAnswer ? createdThread : { ...createdThread, aiReplyStatus: 'pending' };

        if (existingIndex >= 0) {
          next[existingIndex] = hydratedThread;
          return next;
        }

        return [hydratedThread, ...next];
      });
      if (!createdThread?.aiAnswer) {
        setTimeout(() => {
          loadThreads();
        }, 1200);
      }
    } catch (err) {
      setError(extractRequestErrorMessage(err, 'Không thể đăng câu hỏi.'));
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleAnswerSubmit = async (questionId) => {
    const text = answerDrafts[questionId]?.trim();
    if (!text) return;

    try {
      setSubmittingAnswerId(questionId);
      setError('');
      await createQuestionAnswer(questionId, { answerText: text });
      setAnswerDrafts((prev) => ({ ...prev, [questionId]: '' }));
      await loadThreads();
    } catch (err) {
      setError(extractRequestErrorMessage(err, 'Không thể gửi câu trả lời.'));
    } finally {
      setSubmittingAnswerId(null);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này? Tất cả câu trả lời cũng sẽ bị xóa.')) return;
    try {
      setDeletingQuestionId(questionId);
      setError('');
      await deleteQuestion(questionId);
      setThreads((prev) => prev.filter((t) => t.id !== questionId));
    } catch (err) {
      setError(extractRequestErrorMessage(err, 'Không thể xóa câu hỏi.'));
    } finally {
      setDeletingQuestionId(null);
    }
  };

  if (!currentUser) return null;

  return (
    <section className="space-y-4 rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.86)_0%,rgba(251,248,243,0.94)_100%)] p-3 shadow-[0_28px_70px_-48px_rgba(23,20,16,0.3)] backdrop-blur-xl sm:p-4 lg:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white/78 px-4 py-3 shadow-[0_18px_40px_-36px_rgba(23,20,16,0.24)] backdrop-blur-xl sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <MessageSquare className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">Hỏi đáp cộng đồng</p>
            <p className="text-xs font-medium text-slate-500">{questionCount} câu hỏi</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAskModal(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-orange-700 active:scale-95"
        >
          <PlusCircle className="h-4 w-4" />
          Đặt câu hỏi
        </button>
      </div>

      {showAskModal ? (
        <AskQuestionModal
          place={place}
          questionTitle={questionTitle}
          questionText={questionText}
          onTitleChange={(event) => setQuestionTitle(event.target.value)}
          onTextChange={(event) => setQuestionText(event.target.value)}
          onClose={() => setShowAskModal(false)}
          onSubmit={handleAskQuestion}
          submittingQuestion={submittingQuestion}
        />
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-[1.8rem] border border-dashed border-base-200 bg-white/70 py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang tải hỏi đáp...
        </div>
      ) : threads.length ? (
        <div className="space-y-3">
          {threads.map((thread) => (
            <QuestionThreadCard
              key={thread.id}
              thread={thread}
              draft={answerDrafts[thread.id] || ''}
              onDraftChange={(questionId, nextValue) =>
                setAnswerDrafts((prev) => ({ ...prev, [questionId]: nextValue }))
              }
              onAnswerSubmit={handleAnswerSubmit}
              submittingAnswerId={submittingAnswerId}
              currentUser={currentUser}
              onDeleteQuestion={handleDeleteQuestion}
              deletingQuestionId={deletingQuestionId}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.8rem] border border-dashed border-base-200 bg-white/70 px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
            <MessageSquare className="h-7 w-7 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Chưa có câu hỏi nào</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
            Hãy đặt câu hỏi đầu tiên để nhận gợi ý từ AI và mở đầu cuộc trò chuyện với cộng đồng.
          </p>
        </div>
      )}
    </section>
  );
}
