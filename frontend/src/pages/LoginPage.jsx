import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      console.error('Email login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      await loginWithGoogle();
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
      console.error('Google login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-base-50 text-ink-900 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-base-200 bg-white shadow-soft">
              <img src="/favicon.svg" alt="" className="h-7 w-7" />
            </span>
            <span>
              <span className="block text-lg font-black leading-5 text-ink-900">Smacco</span>
              <span className="text-xs font-bold uppercase tracking-wide text-primary-700">Tìm lưu trú bằng AI</span>
            </span>
          </Link>

          <div className="surface-card p-5 sm:p-7">
            <div className="mb-7">
              <div className="badge-soft mb-4">
                <ShieldCheck className="h-3.5 w-3.5" />
                Firebase Authentication
              </div>
              <h1 className="text-3xl font-black text-ink-900">Chào mừng trở lại</h1>
              <p className="mt-2 text-sm leading-6 text-ink-500">Đăng nhập để mở bản đồ, chatbot và hồ sơ lưu trú của bạn.</p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-300/30 bg-rose-500/10 p-3 text-sm font-semibold text-rose-100">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="mb-2 block text-sm font-black text-ink-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="mb-2 block text-sm font-black text-ink-700">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="input-field pl-10 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed"
                    disabled={isLoading}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary h-12 w-full"
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-base-200" />
              <span className="text-xs font-black uppercase text-ink-500">Hoặc</span>
              <div className="h-px flex-1 bg-base-200" />
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="btn-secondary h-12 w-full"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 text-sm font-black text-white">G</span>
              {isLoading ? 'Đang xử lý...' : 'Đăng nhập với Google'}
            </button>
          </div>
        </div>
      </section>

      <section className="relative hidden overflow-hidden border-l border-base-200 bg-[linear-gradient(135deg,#d6f4ec_0%,#fbf8f3_48%,#ffedd5_100%)] lg:block">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(34,28,23,0.06)_1px,transparent_1px),linear-gradient(rgba(34,28,23,0.06)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="relative flex h-full items-center justify-center p-12">
          <div className="w-full max-w-xl">
            <div className="badge-soft mb-6">
              <Sparkles className="h-3.5 w-3.5 text-accent-500" />
              Khám phá quanh bạn
            </div>
            <h2 className="text-5xl font-black leading-tight text-ink-900">Bản đồ, AI và nơi lưu trú trong một trải nghiệm.</h2>
            <p className="mt-5 text-lg leading-8 text-ink-500">
              Tìm nơi ở phù hợp, xem kết quả trên bản đồ, hỏi trợ lý AI và lưu lại các lựa chọn quan trọng cho chuyến đi.
            </p>
            <div className="mt-10 overflow-hidden surface-card">
              <div className="flex items-center justify-between border-b border-base-200 px-4 py-3">
                <span className="text-sm font-black text-ink-900">Gợi ý gần bạn</span>
                <span className="badge-soft normal-case tracking-normal">Live map</span>
              </div>
              <div className="grid gap-3 p-4">
                {['Khách sạn ven hồ', 'Cafe làm việc yên tĩnh', 'Nhà hàng được đánh giá cao'].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl bg-white/95 p-3 text-slate-900">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-black">{item}</p>
                      <p className="text-xs font-semibold text-slate-500">Phù hợp {92 - index * 4}% với bộ lọc hiện tại</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
