import { useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquare, PlusCircle, Reply, Send, Sparkles, Trash2, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createPlaceQuestion, createQuestionAnswer, getPlaceQuestions, deleteQuestion } from '../services/questionService';

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
            ? 'border-primary-300 bg-primary-50 text-primary-700 ring-2 ring-primary-100'
            : 'border-base-200 bg-base-100 text-ink-700'
      } ${compact ? 'h-6 w-6 text-[10px]' : 'h-10 w-10 text-sm'}`}
      title={isOnsite ? 'Onsite user' : isAi ? 'AI' : 'Offsite user'}
    >
      {initials}
    </div>
  );
}

function QuestionThreadCard({ thread, draft, onDraftChange, onAnswerSubmit, submittingAnswerId, currentUser, onDeleteQuestion, deletingQuestionId }) {
  const isOwnQuestion = currentUser && thread.author?.firebaseUid && thread.author.firebaseUid === currentUser.uid;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="grid grid-cols-[3.25rem_1fr]">
        <aside className="flex flex-col items-center gap-2 bg-slate-50 px-2 py-4 text-slate-500">
          <button type="button" className="rounded-lg p-1.5 transition hover:-translate-y-0.5 hover:bg-orange-100 hover:text-orange-600" title="Upvote">
            <ThumbsUp className="h-4 w-4" />
          </button>
          <span className="text-xs font-black text-slate-800">{Math.max(1, (thread.answers?.length || 0) + 1)}</span>
          <button type="button" className="rounded-lg p-1.5 transition hover:translate-y-0.5 hover:bg-slate-200 hover:text-slate-900" title="Downvote">
            <ThumbsDown className="h-4 w-4" />
          </button>
        </aside>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-black text-slate-900">r/smacco_qa</span>
            <span>•</span>
            <ParticipantAvatar participant={thread.author} compact />
            <span>Posted by</span>
            <span className="font-semibold text-slate-700">{thread.author?.displayName || 'Người dùng'}</span>
            {thread.author?.isOnsite ? (
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-700">Onsite</span>
            ) : null}
            <span>{formatTime(thread.createdAt)}</span>
            {isOwnQuestion && (
              <button
                type="button"
                onClick={() => onDeleteQuestion(thread.id)}
                disabled={deletingQuestionId === thread.id}
                className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                title="Xóa câu hỏi của bạn"
              >
                {deletingQuestionId === thread.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Xóa
              </button>
            )}
          </div>

          {thread.title ? <h3 className="mt-3 text-lg font-black text-slate-950">{thread.title}</h3> : null}
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{thread.questionText}</p>
        </div>
      </div>

      {thread.aiAnswer ? (
        <section className="mx-4 mb-4 rounded-2xl border border-violet-100 bg-violet-50/70 p-4 sm:mx-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-violet-700">
            <Sparkles className="h-4 w-4" />
            AI trả lời
          </div>
          <div className="flex gap-3">
            <ParticipantAvatar participant={thread.aiAnswer.author} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-800">
                <span>{thread.aiAnswer.author?.displayName || 'AI'}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-violet-700">Ghim đầu</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{thread.aiAnswer.answerText}</p>
            </div>
          </div>
        </section>
      ) : thread.aiReplyStatus === 'pending' ? (
        <section className="mx-4 mb-4 rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 p-4 text-sm text-violet-700 sm:mx-5">
          <div className="flex items-center gap-2 font-bold">
            <Sparkles className="h-4 w-4 animate-pulse" />
            AI đang soạn câu trả lời
          </div>
          <p className="mt-2 leading-6 text-violet-700/80">Hệ thống sẽ ghim câu trả lời tự động lên đầu thread trong giây lát.</p>
        </section>
      ) : null}

      <div className="mx-4 mb-4 space-y-3 border-l-2 border-slate-100 pl-4 sm:mx-5">
        {thread.answers?.length ? (
          thread.answers.map((answer) => (
            <div key={answer.id} className="rounded-2xl border border-base-200 bg-slate-50/80 p-4">
              <div className="flex items-start gap-3">
                <ParticipantAvatar participant={answer.author} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{answer.author?.displayName || 'Người dùng'}</p>
                    {answer.author?.isOnsite ? (
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary-700">Onsite</span>
                    ) : null}
                    <span className="text-xs text-slate-400">{formatTime(answer.createdAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{answer.answerText}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-base-200 bg-slate-50 p-4 text-sm text-slate-500">
            Chưa có câu trả lời từ user onsite hay offsite.
          </div>
        )}
      </div>

      <div className="mx-4 mb-4 rounded-2xl border border-base-200 bg-white p-4 sm:mx-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Reply className="h-4 w-4 text-primary-600" />
          Thêm câu trả lời
        </div>
        <textarea
          value={draft}
          onChange={(event) => onDraftChange(thread.id, event.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          placeholder="Chia sẻ kinh nghiệm, mẹo, hoặc đính chính nếu bạn đang ở đó..."
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => onAnswerSubmit(thread.id)}
            disabled={submittingAnswerId === thread.id || !draft.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submittingAnswerId === thread.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Gửi trả lời
          </button>
        </div>
      </div>
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
      setError(err?.message || 'Không thể tải phần hỏi đáp.');
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
      setError(err?.message || 'Không thể đăng câu hỏi.');
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
      setError(err?.message || 'Không thể gửi câu trả lời.');
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
      setError(err?.message || 'Không thể xóa câu hỏi.');
    } finally {
      setDeletingQuestionId(null);
    }
  };

  if (!currentUser) return null;

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-slate-100/70 p-3 sm:p-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-white">
              <MessageSquare className="h-5 w-5" />
            </span>
            Hỏi đáp cộng đồng
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Đặt câu hỏi như một bài post; AI được ghim đầu thread, cộng đồng onsite/offsite có thể trả lời bên dưới.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
            {questionCount} câu hỏi
          </div>
          <button
            type="button"
            onClick={() => setShowAskModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-sm font-black text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-lg active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            Đặt câu hỏi
          </button>
        </div>
      </div>

      {showAskModal ? (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm animate-soft-in">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl animate-chat-pop">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <MessageSquare className="h-4 w-4 text-orange-600" />
                  Create Post
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500">Câu hỏi sẽ được đăng vào thread hỏi đáp của địa điểm này.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAskModal(false)}
                className="rounded-2xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-950 hover:shadow-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <input
                value={questionTitle}
                onChange={(event) => setQuestionTitle(event.target.value)}
                className="mb-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition placeholder:font-medium focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                placeholder="Tiêu đề ngắn, ví dụ: Ở đây có cần đặt chỗ trước không?"
              />
              <textarea
                value={questionText}
                onChange={(event) => setQuestionText(event.target.value)}
                rows={7}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                placeholder={place ? `Hỏi về ${place.name}...` : 'Đặt câu hỏi của bạn...'}
                autoFocus
              />
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">{questionText.length}/1000 ký tự</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAskModal(false)}
                    className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleAskQuestion}
                    disabled={submittingQuestion || !questionText.trim()}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submittingQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-3xl border border-dashed border-base-200 bg-base-50 py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang tải hỏi đáp...
        </div>
      ) : threads.length ? (
        <div className="space-y-4">
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
        <div className="rounded-3xl border border-dashed border-base-200 bg-base-50 px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
            <MessageSquare className="h-7 w-7 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Chưa có câu hỏi nào</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Hãy đặt câu hỏi đầu tiên để AI ghim câu trả lời lên trên và cộng đồng onsite/offsite cùng tham gia.
          </p>
        </div>
      )}
    </section>
  );
}
