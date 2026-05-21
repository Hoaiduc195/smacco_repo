import { useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquare, Reply, Send, Sparkles, Trash2 } from 'lucide-react';
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

function ParticipantAvatar({ participant }) {
  const isAi = participant?.isAi;
  const isOnsite = participant?.isOnsite;
  const initials = participant?.initials || (isAi ? 'AI' : 'U');

  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${
        isAi
          ? 'border-violet-200 bg-violet-50 text-violet-700'
          : isOnsite
            ? 'border-cyan-300 bg-cyan-50 text-cyan-700 ring-2 ring-cyan-100'
            : 'border-slate-200 bg-slate-100 text-slate-700'
      }`}
      title={isOnsite ? 'Onsite user' : isAi ? 'AI' : 'Offsite user'}
    >
      {initials}
    </div>
  );
}

function QuestionThreadCard({ thread, draft, onDraftChange, onAnswerSubmit, submittingAnswerId, currentUser, onDeleteQuestion, deletingQuestionId }) {
  const isOwnQuestion = currentUser && thread.author?.firebaseUid && thread.author.firebaseUid === currentUser.uid;

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-200">
      <div className="flex items-start gap-3">
        <ParticipantAvatar participant={thread.author} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">{thread.author?.displayName || 'Người dùng'}</p>
            {thread.author?.isOnsite ? (
              <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-bold text-cyan-700">Onsite</span>
            ) : null}
            <span className="text-xs text-slate-400">{formatTime(thread.createdAt)}</span>
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
          {thread.title ? <h3 className="mt-1 text-lg font-bold text-slate-900">{thread.title}</h3> : null}
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{thread.questionText}</p>
        </div>
      </div>

      {thread.aiAnswer ? (
        <section className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
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
      ) : null}

      <div className="mt-4 space-y-3">
        {thread.answers?.length ? (
          thread.answers.map((answer) => (
            <div key={answer.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <ParticipantAvatar participant={answer.author} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{answer.author?.displayName || 'Người dùng'}</p>
                    {answer.author?.isOnsite ? (
                      <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-bold text-cyan-700">Onsite</span>
                    ) : null}
                    <span className="text-xs text-slate-400">{formatTime(answer.createdAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{answer.answerText}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Chưa có câu trả lời từ user onsite hay offsite.
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Reply className="h-4 w-4 text-cyan-600" />
          Thêm câu trả lời
        </div>
        <textarea
          value={draft}
          onChange={(event) => onDraftChange(thread.id, event.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
          placeholder="Chia sẻ kinh nghiệm, mẹo, hoặc đính chính nếu bạn đang ở đó..."
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => onAnswerSubmit(thread.id)}
            disabled={submittingAnswerId === thread.id || !draft.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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
      await createPlaceQuestion(placeId, {
        title: questionTitle.trim(),
        questionText: questionText.trim(),
      });
      setQuestionTitle('');
      setQuestionText('');
      await loadThreads();
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
    <section className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <MessageSquare className="h-5 w-5 text-cyan-600" />
            Hỏi đáp cộng đồng
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            AI luôn được ghim ở đầu mỗi thread, còn user onsite và offsite đều có thể đặt câu hỏi, bình luận tự do.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          {questionCount} câu hỏi
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-100 bg-cyan-50/60 p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-cyan-800">
          <MessageSquare className="h-4 w-4" />
          Đặt câu hỏi mới
        </div>
        <input
          value={questionTitle}
          onChange={(event) => setQuestionTitle(event.target.value)}
          className="mb-3 w-full rounded-2xl border border-cyan-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
          placeholder="Tiêu đề ngắn, ví dụ: Ở đây có cần đặt chỗ trước không?"
        />
        <textarea
          value={questionText}
          onChange={(event) => setQuestionText(event.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-cyan-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
          placeholder={place ? `Hỏi về ${place.name}...` : 'Đặt câu hỏi của bạn...'}
        />
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleAskQuestion}
            disabled={submittingQuestion || !questionText.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submittingQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Đăng câu hỏi
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang tải hỏi đáp...
        </div>
      ) : threads.length ? (
        <div className="space-y-5">
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
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
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
